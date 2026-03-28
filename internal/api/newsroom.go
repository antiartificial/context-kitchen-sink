package api

import (
	"math/rand"
	"net/http"
	"time"

	"github.com/antiartificial/context-kitchen-sink/internal/seed"
	"github.com/antiartificial/contextdb/pkg/advanced"
	"github.com/antiartificial/contextdb/pkg/client"
)

// handleNewsroomWrite handles POST /api/newsroom/write
func (s *Server) handleNewsroomWrite(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		Content    string   `json:"content"`
		SourceID   string   `json:"source_id"`
		Confidence float64  `json:"confidence"`
		Labels     []string `json:"labels"`
		Topic      string   `json:"topic"`
	}

	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate required fields
	if req.Content == "" {
		writeError(w, http.StatusBadRequest, "content is required")
		return
	}
	if req.SourceID == "" {
		writeError(w, http.StatusBadRequest, "source_id is required")
		return
	}

	// Default confidence if not provided
	if req.Confidence == 0 {
		req.Confidence = 0.5
	}

	// Get namespace
	ns := s.db.Namespace("newsroom", advanced.ModeBeliefSystem)

	// Generate vector if topic is provided
	var vector []float32
	if req.Topic != "" {
		vector = seed.TopicVector(req.Topic, 99)
	}

	// Write the claim
	writeReq := client.WriteRequest{
		Content:    req.Content,
		SourceID:   req.SourceID,
		Labels:     req.Labels,
		Vector:     vector,
		Confidence: req.Confidence,
		ValidFrom:  time.Now(),
		MemType:    advanced.MemorySemantic,
	}

	result, err := ns.Write(ctx, writeReq)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Return the write result
	writeJSON(w, http.StatusOK, map[string]any{
		"node_id":      result.NodeID,
		"admitted":     result.Admitted,
		"reason":       result.Reason,
		"conflict_ids": result.ConflictIDs,
	})
}

// handleNewsroomSources handles GET /api/newsroom/sources
func (s *Server) handleNewsroomSources(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	graph, _, _, _ := s.db.Stores()

	// Known source IDs from seed data
	sourceIDs := []string{
		"journalist:reuters",
		"twitter:@cryptobro",
		"troll:bot42",
		"rss:bbc-news",
	}

	// Build response with credibility metrics for each source
	type sourceResponse struct {
		ID              string   `json:"id"`
		ExternalID      string   `json:"external_id"`
		Labels          []string `json:"labels"`
		ClaimsAsserted  int64    `json:"claims_asserted"`
		ClaimsValidated int64    `json:"claims_validated"`
		ClaimsRefuted   int64    `json:"claims_refuted"`
		Alpha           float64  `json:"alpha"`
		Beta            float64  `json:"beta"`
		Credibility     float64  `json:"credibility"`
		Variance        float64  `json:"variance"`
		IntervalLower   float64  `json:"interval_lower"`
		IntervalUpper   float64  `json:"interval_upper"`
	}

	responses := []sourceResponse{}
	for _, srcID := range sourceIDs {
		src, err := graph.GetSourceByExternalID(ctx, "newsroom", srcID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if src == nil {
			continue // Source doesn't exist yet
		}

		credibility := advanced.MeanCredibility(src.Alpha, src.Beta)
		variance := advanced.CredibilityVariance(src.Alpha, src.Beta)
		lower, upper := src.CredibleInterval(0.95)

		responses = append(responses, sourceResponse{
			ID:              src.ID.String(),
			ExternalID:      src.ExternalID,
			Labels:          src.Labels,
			ClaimsAsserted:  src.ClaimsAsserted,
			ClaimsValidated: src.ClaimsValidated,
			ClaimsRefuted:   src.ClaimsRefuted,
			Alpha:           src.Alpha,
			Beta:            src.Beta,
			Credibility:     credibility,
			Variance:        variance,
			IntervalLower:   lower,
			IntervalUpper:   upper,
		})
	}

	writeJSON(w, http.StatusOK, responses)
}

// handleNewsroomValidate handles POST /api/newsroom/validate
func (s *Server) handleNewsroomValidate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		SourceID  string `json:"source_id"`
		Validated bool   `json:"validated"`
	}

	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.SourceID == "" {
		writeError(w, http.StatusBadRequest, "source_id is required")
		return
	}

	graph, _, _, _ := s.db.Stores()

	// Get the source
	source, err := graph.GetSourceByExternalID(ctx, "newsroom", req.SourceID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if source == nil {
		writeError(w, http.StatusNotFound, "source not found")
		return
	}

	// Update credibility using Bayesian update
	source.BayesianUpdate(req.Validated)

	// Save the updated source
	if err := graph.UpsertSource(ctx, *source); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":           true,
		"credibility":  advanced.MeanCredibility(source.Alpha, source.Beta),
		"alpha":        source.Alpha,
		"beta":         source.Beta,
	})
}

// handleNewsroomClaims handles GET /api/newsroom/claims
func (s *Server) handleNewsroomClaims(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	ns := s.db.Namespace("newsroom", advanced.ModeBeliefSystem)

	// Retrieve all nodes (use high TopK to get everything)
	results, err := ns.Retrieve(ctx, client.RetrieveRequest{
		TopK: 100,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Build response
	type claimResponse struct {
		ID               string   `json:"id"`
		Content          string   `json:"content"`
		SourceID         string   `json:"source_id"`
		Labels           []string `json:"labels"`
		Confidence       float64  `json:"confidence"`
		Score            float64  `json:"score"`
		SimilarityScore  float64  `json:"similarity_score"`
		ConfidenceScore  float64  `json:"confidence_score"`
		RecencyScore     float64  `json:"recency_score"`
		UtilityScore     float64  `json:"utility_score"`
		EpistemicType    string   `json:"epistemic_type"`
		ValidFrom        string   `json:"valid_from"`
		Version          uint64   `json:"version"`
	}

	responses := make([]claimResponse, len(results))
	for i, res := range results {
		content := advanced.NodeText(res.Node)
		sourceID := ""
		if sid, ok := res.Node.Properties["source_id"].(string); ok {
			sourceID = sid
		}

		validFrom := ""
		if !res.Node.ValidFrom.IsZero() {
			validFrom = res.Node.ValidFrom.Format(time.RFC3339)
		}

		responses[i] = claimResponse{
			ID:              res.Node.ID.String(),
			Content:         content,
			SourceID:        sourceID,
			Labels:          res.Node.Labels,
			Confidence:      res.Node.Confidence,
			Score:           res.Score,
			SimilarityScore: res.SimilarityScore,
			ConfidenceScore: res.ConfidenceScore,
			RecencyScore:    res.RecencyScore,
			UtilityScore:    res.UtilityScore,
			EpistemicType:   res.Node.EpistemicType,
			ValidFrom:       validFrom,
			Version:         res.Node.Version,
		}
	}

	writeJSON(w, http.StatusOK, responses)
}

// handleNewsroomConflicts handles GET /api/newsroom/conflicts
func (s *Server) handleNewsroomConflicts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	graph, _, _, _ := s.db.Stores()

	clusters, err := advanced.FindConflictClusters(ctx, graph, "newsroom", nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Build response
	type conflictNode struct {
		ID         string  `json:"id"`
		Content    string  `json:"content"`
		SourceID   string  `json:"source_id"`
		Confidence float64 `json:"confidence"`
	}

	type conflictEdge struct {
		Src    string  `json:"src"`
		Dst    string  `json:"dst"`
		Type   string  `json:"type"`
		Weight float64 `json:"weight"`
	}

	type conflictCluster struct {
		Nodes          []conflictNode `json:"nodes"`
		Edges          []conflictEdge `json:"edges"`
		CredibilityGap float64        `json:"credibility_gap"`
	}

	responses := make([]conflictCluster, len(clusters))
	for i, cluster := range clusters {
		nodes := make([]conflictNode, len(cluster.Nodes))
		for j, node := range cluster.Nodes {
			content := advanced.NodeText(node)
			sourceID := ""
			if sid, ok := node.Properties["source_id"].(string); ok {
				sourceID = sid
			}
			nodes[j] = conflictNode{
				ID:         node.ID.String(),
				Content:    content,
				SourceID:   sourceID,
				Confidence: node.Confidence,
			}
		}

		edges := make([]conflictEdge, len(cluster.Edges))
		for j, edge := range cluster.Edges {
			edges[j] = conflictEdge{
				Src:    edge.Src.String(),
				Dst:    edge.Dst.String(),
				Type:   edge.Type,
				Weight: edge.Weight,
			}
		}

		responses[i] = conflictCluster{
			Nodes:          nodes,
			Edges:          edges,
			CredibilityGap: cluster.CredibilityGap,
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"clusters": responses,
	})
}

// handleNewsroomFetchLive handles POST /api/newsroom/fetch-live
func (s *Server) handleNewsroomFetchLive(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	ns := s.db.Namespace("newsroom", advanced.ModeBeliefSystem)

	// Hardcoded headlines for simulation
	headlines := []string{
		"Central bank raises interest rates by 0.25% to combat inflation",
		"New study shows Mediterranean diet reduces heart disease risk by 30%",
		"Scientists discover potential biosignatures on Europa moon",
		"Renewable energy surpasses coal in global electricity generation",
		"Tech giant announces breakthrough in quantum computing error correction",
		"Climate summit reaches historic agreement on carbon emissions",
		"Major pharmaceutical trial shows promise for Alzheimer's treatment",
		"Astronomers detect unusual radio signals from distant galaxy",
		"Energy storage breakthrough could enable 24-hour solar power",
		"Research reveals link between gut microbiome and mental health",
	}

	// Randomly select 3 headlines
	rand.Seed(time.Now().UnixNano())
	selected := make([]string, 3)
	perm := rand.Perm(len(headlines))
	for i := 0; i < 3; i++ {
		selected[i] = headlines[perm[i]]
	}

	// Write each headline
	claimsAdded := 0
	for _, headline := range selected {
		// Determine topic based on keywords
		topic := seed.TopicEconomics
		if containsAny(headline, []string{"health", "diet", "disease", "pharma", "microbiome"}) {
			topic = seed.TopicHealth
		} else if containsAny(headline, []string{"space", "moon", "galaxy", "astronomers"}) {
			topic = seed.TopicSpace
		} else if containsAny(headline, []string{"energy", "solar", "renewable"}) {
			topic = seed.TopicEnergy
		}

		_, err := ns.Write(ctx, client.WriteRequest{
			Content:    headline,
			SourceID:   "rss:bbc-news",
			Labels:     []string{"news", "live-feed"},
			Vector:     seed.TopicVector(topic, int(time.Now().UnixNano()%1000)),
			Confidence: 0.65,
			ValidFrom:  time.Now(),
			MemType:    advanced.MemorySemantic,
		})
		if err == nil {
			claimsAdded++
		}
	}

	writeJSON(w, http.StatusOK, map[string]int{
		"claims_added": claimsAdded,
	})
}

// handleNewsroomReset handles POST /api/newsroom/reset
func (s *Server) handleNewsroomReset(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	ns := s.db.Namespace("newsroom", advanced.ModeBeliefSystem)
	graph, _, _, _ := s.db.Stores()

	// Get all nodes to retract them
	results, err := ns.Retrieve(ctx, client.RetrieveRequest{
		TopK: 1000, // Get all nodes
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Retract each node individually
	for _, res := range results {
		if err := graph.RetractNode(ctx, "newsroom", res.Node.ID, "reset", time.Now()); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
	}

	// Re-seed the newsroom
	if err := seed.SeedNewsroom(s.db); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{
		"ok": true,
	})
}

// containsAny returns true if s contains any of the substrings
func containsAny(s string, substrs []string) bool {
	for _, substr := range substrs {
		if contains(s, substr) {
			return true
		}
	}
	return false
}

// contains returns true if s contains substr (case-insensitive)
func contains(s, substr string) bool {
	s = toLower(s)
	substr = toLower(substr)
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// toLower converts a string to lowercase
func toLower(s string) string {
	result := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			c += 'a' - 'A'
		}
		result[i] = c
	}
	return string(result)
}
