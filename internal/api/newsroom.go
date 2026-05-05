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
		"vendor:acme-cloud",
		"analyst:gartner",
		"engineer:jane-chen",
		"blog:random-dev",
		"community:hn-thread",
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

	graph, _, _, _ := s.db.Stores()

	// List all valid nodes in the newsroom namespace
	nodes, err := graph.ValidAt(ctx, "newsroom", time.Now(), nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Wrap nodes as results
	results := make([]client.Result, 0, len(nodes))
	for _, node := range nodes {
		results = append(results, client.Result{
			Node:            node,
			Score:           node.Confidence,
			ConfidenceScore: node.Confidence,
		})
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

	// Simulated incoming claims from various community sources
	headlines := []struct {
		content  string
		sourceID string
		topic    string
		conf     float64
	}{
		{"Independent load test confirms Acme P99 at 52ms in EU-West under 10k RPS", "community:hn-thread", seed.TopicPerformance, 0.60},
		{"Acme status page shows 99.92% uptime YTD, contradicting their 99.99% SLA claim", "community:hn-thread", seed.TopicReliability, 0.58},
		{"Switched from Acme to competitor, egress bill dropped 60%", "blog:random-dev", seed.TopicPricing, 0.40},
		{"Acme rotated our API keys automatically and nothing broke — smooth experience", "blog:random-dev", seed.TopicSecurity, 0.38},
		{"Acme Cloud publishes new benchmark: 8ms P50 latency on dedicated instances", "vendor:acme-cloud", seed.TopicPerformance, 0.92},
		{"Our team measured Acme at 99.7% uptime over 6 months — fine for staging, not for prod", "engineer:jane-chen", seed.TopicReliability, 0.82},
		{"Gartner downgrades Acme Cloud reliability rating from Strong to Adequate in Q2 update", "analyst:gartner", seed.TopicReliability, 0.80},
		{"Thread: anyone else seeing Acme latency regression since their March migration?", "community:hn-thread", seed.TopicPerformance, 0.48},
		{"Acme just published SOC 2 Type II report — clean, but scope excludes their CDN edge nodes", "analyst:gartner", seed.TopicSecurity, 0.78},
		{"My Acme bill went up 30% after enabling cross-region replication, not mentioned in pricing page", "blog:random-dev", seed.TopicPricing, 0.42},
	}

	rand.Seed(time.Now().UnixNano())
	selected := make([]struct {
		content  string
		sourceID string
		topic    string
		conf     float64
	}, 3)
	perm := rand.Perm(len(headlines))
	for i := 0; i < 3; i++ {
		selected[i] = headlines[perm[i]]
	}

	claimsAdded := 0
	for _, h := range selected {
		_, err := ns.Write(ctx, client.WriteRequest{
			Content:    h.content,
			SourceID:   h.sourceID,
			Labels:     []string{"live-feed"},
			Vector:     seed.TopicVector(h.topic, int(time.Now().UnixNano()%1000)),
			Confidence: h.conf,
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

