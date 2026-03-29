package api

import (
	"context"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/antiartificial/context-kitchen-sink/internal/seed"
	"github.com/antiartificial/contextdb/pkg/advanced"
	"github.com/antiartificial/contextdb/pkg/client"
)

// handleAgentMemories handles GET /api/agent/memories
func (s *Server) handleAgentMemories(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	ns := s.db.Namespace("agent", advanced.ModeAgentMemory)

	// Parse as_of query parameter, default to now
	asOfStr := r.URL.Query().Get("as_of")
	var asOf time.Time
	if asOfStr == "" {
		asOf = time.Now()
	} else {
		parsed, err := time.Parse(time.RFC3339, asOfStr)
		if err != nil {
			writeError(w, http.StatusBadRequest, fmt.Sprintf("invalid as_of timestamp: %v", err))
			return
		}
		asOf = parsed
	}

	query := r.URL.Query().Get("query")

	var results []client.Result

	if query != "" {
		// Vector search with query text — use a topic vector as proxy
		req := client.RetrieveRequest{
			TopK:   50,
			AsOf:   asOf,
			Vector: seed.TopicVector(query, 0),
			ScoreParams: advanced.ScoreParams{
				SimilarityWeight: 0.3,
				ConfidenceWeight: 0.3,
				RecencyWeight:    0.2,
				UtilityWeight:    0.2,
			},
		}
		var err error
		results, err = ns.Retrieve(ctx, req)
		if err != nil {
			writeError(w, http.StatusInternalServerError, fmt.Sprintf("retrieve failed: %v", err))
			return
		}
	} else {
		// No query — list all nodes via graph store
		graph, _, _, _ := s.db.Stores()
		nodes, err := graph.ValidAt(ctx, "agent", asOf, nil)
		if err != nil {
			writeError(w, http.StatusInternalServerError, fmt.Sprintf("list failed: %v", err))
			return
		}
		for _, node := range nodes {
			results = append(results, client.Result{
				Node:            node,
				Score:           node.Confidence,
				ConfidenceScore: node.Confidence,
			})
		}
	}

	// Build response
	type memoryResponse struct {
		ID              string    `json:"id"`
		Content         string    `json:"content"`
		Confidence      float64   `json:"confidence"`
		MemType         string    `json:"mem_type"`
		SourceID        string    `json:"source_id"`
		Labels          []string  `json:"labels"`
		ValidFrom       time.Time `json:"valid_from"`
		Score           float64   `json:"score"`
		SimilarityScore float64   `json:"similarity_score"`
		ConfidenceScore float64   `json:"confidence_score"`
		RecencyScore    float64   `json:"recency_score"`
		UtilityScore    float64   `json:"utility_score"`
		DecayAlpha      float64   `json:"decay_alpha"`
	}

	memories := make([]memoryResponse, 0, len(results))
	for _, result := range results {
		// Extract memory type
		memType := "unknown"
		if mt, ok := result.Node.Properties["mem_type"].(string); ok {
			memType = mt
		} else {
			// Infer from labels
			for _, label := range result.Node.Labels {
				if label == "episodic" || label == "semantic" || label == "procedural" || label == "working" {
					memType = label
					break
				}
			}
		}

		// Extract source_id
		sourceID := ""
		if sid, ok := result.Node.Properties["source_id"].(string); ok {
			sourceID = sid
		}

		// Get decay alpha for this memory type
		var decayAlpha float64
		switch memType {
		case "episodic":
			decayAlpha = advanced.DecayAlpha(advanced.MemoryEpisodic)
		case "semantic":
			decayAlpha = advanced.DecayAlpha(advanced.MemorySemantic)
		case "procedural":
			decayAlpha = advanced.DecayAlpha(advanced.MemoryProcedural)
		case "working":
			decayAlpha = advanced.DecayAlpha(advanced.MemoryWorking)
		default:
			decayAlpha = 0.0
		}

		memories = append(memories, memoryResponse{
			ID:              result.Node.ID.String(),
			Content:         advanced.NodeText(result.Node),
			Confidence:      result.Node.Confidence,
			MemType:         memType,
			SourceID:        sourceID,
			Labels:          result.Node.Labels,
			ValidFrom:       result.Node.ValidFrom,
			Score:           result.Score,
			SimilarityScore: result.SimilarityScore,
			ConfidenceScore: result.ConfidenceScore,
			RecencyScore:    result.RecencyScore,
			UtilityScore:    result.UtilityScore,
			DecayAlpha:      decayAlpha,
		})
	}

	writeJSON(w, 200, map[string]any{"memories": memories})
}

// handleAgentTimeline handles GET /api/agent/timeline
func (s *Server) handleAgentTimeline(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	graph, _, _, _ := s.db.Stores()

	// Time offsets in hours
	offsets := []int{0, 6, 12, 24, 48, 72, 120, 168}

	type timelinePoint struct {
		OffsetHours int `json:"offset_hours"`
		Episodic    int `json:"episodic"`
		Semantic    int `json:"semantic"`
		Procedural  int `json:"procedural"`
		Working     int `json:"working"`
		Total       int `json:"total"`
	}

	points := make([]timelinePoint, 0, len(offsets))

	for _, offset := range offsets {
		timestamp := time.Now().Add(-time.Duration(offset) * time.Hour)
		nodes, err := graph.ValidAt(ctx, "agent", timestamp, nil)
		if err != nil {
			writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to get nodes at offset %d: %v", offset, err))
			return
		}

		// Count by memory type
		counts := map[string]int{
			"episodic":   0,
			"semantic":   0,
			"procedural": 0,
			"working":    0,
		}

		for _, node := range nodes {
			memType := "unknown"
			if mt, ok := node.Properties["mem_type"].(string); ok {
				memType = mt
			} else {
				// Infer from labels
				for _, label := range node.Labels {
					if label == "episodic" || label == "semantic" || label == "procedural" || label == "working" {
						memType = label
						break
					}
				}
			}
			if _, ok := counts[memType]; ok {
				counts[memType]++
			}
		}

		points = append(points, timelinePoint{
			OffsetHours: offset,
			Episodic:    counts["episodic"],
			Semantic:    counts["semantic"],
			Procedural:  counts["procedural"],
			Working:     counts["working"],
			Total:       len(nodes),
		})
	}

	writeJSON(w, 200, map[string]any{"points": points})
}

// handleAgentAddNoise handles POST /api/agent/add-noise
func (s *Server) handleAgentAddNoise(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	ns := s.db.Namespace("agent", advanced.ModeAgentMemory)

	// Parse request body
	var reqBody struct {
		Count int `json:"count"`
	}
	if err := readJSON(r, &reqBody); err != nil {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("invalid request body: %v", err))
		return
	}

	if reqBody.Count <= 0 || reqBody.Count > 1000 {
		writeError(w, http.StatusBadRequest, "count must be between 1 and 1000")
		return
	}

	// List of random content for noise memories
	noiseContent := []string{
		"Checked coffee machine water level",
		"Noticed keyboard key starting to stick",
		"Heard notification sound from other room",
		"Thought about weekend plans briefly",
		"Glanced at clock on the wall",
		"Adjusted chair height slightly",
		"Noticed bird outside the window",
		"Stretched arms after typing",
		"Took sip of water from bottle",
		"Heard footsteps in hallway",
		"Noticed slight room temperature change",
		"Checked phone for time",
		"Adjusted screen brightness",
		"Thought about lunch options",
		"Noticed cloud patterns in sky",
		"Heard distant traffic noise",
		"Felt slight breeze from AC vent",
		"Noticed dust particle in sunbeam",
		"Adjusted sitting posture",
		"Briefly lost train of thought",
	}

	// Add noise memories
	for i := 0; i < reqBody.Count; i++ {
		content := noiseContent[rand.Intn(len(noiseContent))]
		confidence := 0.3 + rand.Float64()*0.4 // 0.3 to 0.7

		_, err := ns.Write(ctx, client.WriteRequest{
			Content:  content,
			SourceID: "agent:noise-generator",
			Labels:   []string{"episodic", "noise", "low-priority"},
			Properties: map[string]any{
				"source_id": "agent:noise-generator",
				"mem_type":  "episodic",
			},
			Vector:     seed.TopicVector(seed.TopicAuth, i+1000),
			Confidence: confidence,
			ValidFrom:  time.Now(),
			MemType:    advanced.MemoryEpisodic,
		})
		if err != nil {
			writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to write noise memory %d: %v", i, err))
			return
		}
	}

	writeJSON(w, 200, map[string]any{"added": reqBody.Count})
}

// handleAgentReset handles POST /api/agent/reset
func (s *Server) handleAgentReset(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	graph, _, _, _ := s.db.Stores()

	// Retract all nodes from agent namespace
	retractor := advanced.NewBulkRetractor(graph)
	_, err := retractor.RetractBySource(ctx, "agent", "agent:coder-v2", "reset")
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to retract nodes: %v", err))
		return
	}

	// Also retract noise generator nodes
	_, err = retractor.RetractBySource(ctx, "agent", "agent:noise-generator", "reset")
	if err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to retract noise nodes: %v", err))
		return
	}

	// Re-seed
	if err := seed.SeedAgent(s.db); err != nil {
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to re-seed: %v", err))
		return
	}

	writeJSON(w, 200, map[string]bool{"ok": true})
}
