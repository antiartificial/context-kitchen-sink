package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/antiartificial/context-kitchen-sink/internal/seed"
	"github.com/antiartificial/contextdb/pkg/advanced"
	"github.com/google/uuid"
)

// handleAuditorNodes handles GET /api/auditor/nodes
func (s *Server) handleAuditorNodes(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	graph, vecs, _, _ := s.db.Stores()

	nodes, err := graph.ValidAt(ctx, "auditor", time.Now(), nil)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	type nodeResponse struct {
		ID            string                 `json:"id"`
		Content       string                 `json:"content"`
		Confidence    float64                `json:"confidence"`
		SourceID      string                 `json:"source_id"`
		Labels        []string               `json:"labels"`
		EpistemicType string                 `json:"epistemic_type"`
		Properties    map[string]interface{} `json:"properties,omitempty"`
	}

	result := make([]nodeResponse, 0, len(nodes))
	for _, node := range nodes {
		content := advanced.NodeText(node)
		sourceID := ""
		if sid, ok := node.Properties["source_id"].(string); ok {
			sourceID = sid
		}
		result = append(result, nodeResponse{
			ID:            node.ID.String(),
			Content:       content,
			Confidence:    node.Confidence,
			SourceID:      sourceID,
			Labels:        node.Labels,
			EpistemicType: node.EpistemicType,
			Properties:    node.Properties,
		})
	}

	_ = vecs
	writeJSON(w, 200, map[string]any{"nodes": result})
}

// handleAuditorNarrative handles POST /api/auditor/narrative
func (s *Server) handleAuditorNarrative(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	graph, vecs, _, _ := s.db.Stores()

	var req struct {
		NodeID string `json:"node_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, map[string]string{"error": "invalid JSON"})
		return
	}

	nodeID, err := uuid.Parse(req.NodeID)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": "invalid node_id"})
		return
	}

	formatter := advanced.NewNarrativeFormatter(graph, vecs)
	report, err := formatter.Explain(ctx, "auditor", nodeID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	type citedClaimJSON struct {
		NodeID          string  `json:"node_id"`
		SourceID        string  `json:"source_id"`
		Text            string  `json:"text"`
		Confidence      float64 `json:"confidence"`
		Relation        string  `json:"relation"`
		ProvenanceDepth int     `json:"provenance_depth,omitempty"`
	}
	mapClaim := func(c advanced.CitedClaim) citedClaimJSON {
		return citedClaimJSON{
			NodeID:          c.NodeID.String(),
			SourceID:        c.SourceID,
			Text:            c.Text,
			Confidence:      c.Confidence,
			Relation:        c.Relation,
			ProvenanceDepth: c.ProvenanceDepth,
		}
	}
	mapClaims := func(cs []advanced.CitedClaim) []citedClaimJSON {
		out := make([]citedClaimJSON, 0, len(cs))
		for _, c := range cs {
			out = append(out, mapClaim(c))
		}
		return out
	}

	writeJSON(w, 200, map[string]any{
		"node_id":                report.NodeID.String(),
		"summary":                report.Summary,
		"claim":                  mapClaim(report.Claim),
		"evidence":               mapClaims(report.Evidence),
		"contradictions":         mapClaims(report.Contradictions),
		"provenance":             mapClaims(report.Provenance),
		"confidence_explanation": report.ConfidenceExplanation,
	})
}

// handleAuditorBeliefDiff handles POST /api/auditor/belief-diff
func (s *Server) handleAuditorBeliefDiff(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	graph, _, _, _ := s.db.Stores()

	var req struct {
		NodeIDs []string `json:"node_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, map[string]string{"error": "invalid JSON"})
		return
	}

	var nodeIDs []uuid.UUID
	if len(req.NodeIDs) > 0 {
		nodeIDs = make([]uuid.UUID, 0, len(req.NodeIDs))
		for _, idStr := range req.NodeIDs {
			id, err := uuid.Parse(idStr)
			if err != nil {
				writeJSON(w, 400, map[string]string{"error": "invalid node_id in array"})
				return
			}
			nodeIDs = append(nodeIDs, id)
		}
	}

	diff, err := advanced.ComputeBeliefDiff(ctx, graph, "auditor", nodeIDs)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	type claimSide struct {
		NodeID         string  `json:"node_id"`
		Content        string  `json:"content"`
		Confidence     float64 `json:"confidence"`
		SourceID       string  `json:"source_id"`
		SupporterCount int     `json:"supporter_count"`
	}
	type enrichedConflict struct {
		ClaimA              claimSide `json:"claim_a"`
		ClaimB              claimSide `json:"claim_b"`
		ContradictionWeight float64   `json:"contradiction_weight"`
		CredibilityGap      float64   `json:"credibility_gap"`
	}

	enriched := make([]enrichedConflict, 0, len(diff.Conflicts))
	for _, conflict := range diff.Conflicts {
		enriched = append(enriched, enrichedConflict{
			ClaimA: claimSide{
				NodeID:         conflict.ClaimA.Node.ID.String(),
				Content:        advanced.NodeText(conflict.ClaimA.Node),
				Confidence:     conflict.ClaimA.Confidence,
				SourceID:       conflict.ClaimA.SourceID,
				SupporterCount: conflict.ClaimA.SupporterCount,
			},
			ClaimB: claimSide{
				NodeID:         conflict.ClaimB.Node.ID.String(),
				Content:        advanced.NodeText(conflict.ClaimB.Node),
				Confidence:     conflict.ClaimB.Confidence,
				SourceID:       conflict.ClaimB.SourceID,
				SupporterCount: conflict.ClaimB.SupporterCount,
			},
			ContradictionWeight: conflict.ContradictionWeight,
			CredibilityGap:      conflict.CredibilityGap,
		})
	}

	writeJSON(w, 200, map[string]any{
		"namespace":           diff.Namespace,
		"conflicts":           enriched,
		"total_conflicts":     diff.TotalConflicts,
		"avg_credibility_gap": diff.AvgCredibilityGap,
	})
}

// handleAuditorKnowledgeGaps handles POST /api/auditor/knowledge-gaps
func (s *Server) handleAuditorKnowledgeGaps(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	graph, vecs, _, _ := s.db.Stores()

	var req struct {
		TopK       int     `json:"top_k"`
		MinGapSize float64 `json:"min_gap_size"`
		MaxGaps    int     `json:"max_gaps"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, map[string]string{"error": "invalid JSON"})
		return
	}

	if req.TopK == 0 {
		req.TopK = 10
	}
	if req.MaxGaps == 0 {
		req.MaxGaps = 20
	}

	detector := advanced.NewGapDetector(graph, vecs)
	gaps, err := detector.DetectGaps(ctx, "auditor", advanced.GapQuery{
		TopK:       req.TopK,
		MinGapSize: req.MinGapSize,
		MaxGaps:    req.MaxGaps,
	})
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	nodes, err := graph.ValidAt(ctx, "auditor", time.Now(), nil)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	report := advanced.BuildGapReport("auditor", gaps, len(nodes))

	// Map to snake_case
	type gapJSON struct {
		ID                string   `json:"id"`
		NearestTopics     []string `json:"nearest_topics"`
		DensityScore      float64  `json:"density_score"`
		ConfidenceGap     float64  `json:"confidence_gap"`
		TemporalGapSecs   float64  `json:"temporal_gap_seconds"`
	}
	gapsOut := make([]gapJSON, 0, len(report.Gaps))
	for _, g := range report.Gaps {
		gapsOut = append(gapsOut, gapJSON{
			ID:              g.ID.String(),
			NearestTopics:   g.NearestTopics,
			DensityScore:    g.DensityScore,
			ConfidenceGap:   g.ConfidenceGap,
			TemporalGapSecs: g.TemporalGap.Seconds(),
		})
	}

	writeJSON(w, 200, map[string]any{
		"namespace":      report.Namespace,
		"gaps":           gapsOut,
		"coverage_score": report.CoverageScore,
		"total_nodes":    report.TotalNodes,
		"gaps_detected":  report.GapsDetected,
	})
}

// handleAuditorCalibration handles POST /api/auditor/calibration
func (s *Server) handleAuditorCalibration(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	graph, _, _, _ := s.db.Stores()

	nodes, err := graph.ValidAt(ctx, "auditor", time.Now(), nil)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	outcomes := make([]advanced.PredictionOutcome, 0)
	for _, node := range nodes {
		pred, ok := node.Properties["prediction_outcome"]
		if !ok {
			continue
		}
		var predicted, actual float64
		var havePred, haveActual bool
		switch m := pred.(type) {
		case map[string]interface{}:
			predicted, havePred = m["predicted"].(float64)
			actual, haveActual = m["actual"].(float64)
		case map[string]float64:
			predicted, havePred = m["predicted"]
			actual, haveActual = m["actual"]
		}
		if havePred && haveActual {
			outcomes = append(outcomes, advanced.PredictionOutcome{
				Predicted: predicted,
				Actual:    actual,
			})
		}
	}

	if len(outcomes) == 0 {
		writeJSON(w, 200, map[string]any{
			"brier_score":  0.0,
			"ece":          0.0,
			"mce":          0.0,
			"bins":         []any{},
			"platt":        map[string]any{"a": 0.0, "b": 0.0, "fitted": false},
			"isotonic":     map[string]any{"fitted": false},
			"sample_count": 0,
		})
		return
	}

	brierScore := advanced.BrierScore(outcomes)
	ece := advanced.ExpectedCalibrationError(outcomes, 10)
	mce := advanced.MaxCalibrationError(outcomes, 10)

	platt := &advanced.PlattScaler{}
	platt.Fit(outcomes, 10)

	iso := &advanced.IsotonicRegressor{}
	iso.Fit(outcomes)

	type binData struct {
		BinStart     float64 `json:"bin_start"`
		BinEnd       float64 `json:"bin_end"`
		AvgPredicted float64 `json:"avg_predicted"`
		AvgActual    float64 `json:"avg_actual"`
		Count        int     `json:"count"`
	}

	binSize := 0.1
	bins := make([]binData, 10)
	for i := 0; i < 10; i++ {
		bins[i].BinStart = float64(i) * binSize
		bins[i].BinEnd = float64(i+1) * binSize
	}

	for _, outcome := range outcomes {
		binIdx := int(outcome.Predicted / binSize)
		if binIdx >= 10 {
			binIdx = 9
		}
		bins[binIdx].AvgPredicted += outcome.Predicted
		bins[binIdx].AvgActual += outcome.Actual
		bins[binIdx].Count++
	}

	for i := range bins {
		if bins[i].Count > 0 {
			bins[i].AvgPredicted /= float64(bins[i].Count)
			bins[i].AvgActual /= float64(bins[i].Count)
		}
	}

	writeJSON(w, 200, map[string]any{
		"brier_score":  brierScore,
		"ece":          ece,
		"mce":          mce,
		"bins":         bins,
		"platt":        map[string]any{"a": platt.A, "b": platt.B, "fitted": true},
		"isotonic":     map[string]any{"fitted": true},
		"sample_count": len(outcomes),
	})
}

// handleAuditorRetract handles POST /api/auditor/retract
func (s *Server) handleAuditorRetract(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	graph, _, _, _ := s.db.Stores()

	var req struct {
		SourceID string `json:"source_id"`
		Reason   string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, map[string]string{"error": "invalid JSON"})
		return
	}

	if req.SourceID == "" {
		writeJSON(w, 400, map[string]string{"error": "source_id is required"})
		return
	}

	retractor := advanced.NewBulkRetractor(graph)
	result, err := retractor.RetractBySource(ctx, "auditor", req.SourceID, req.Reason)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	nodeIDs := make([]string, 0, len(result.NodeIDs))
	for _, id := range result.NodeIDs {
		nodeIDs = append(nodeIDs, id.String())
	}

	writeJSON(w, 200, map[string]any{
		"nodes_retracted": result.NodesRetracted,
		"cascade_depth":   result.CascadeDepth,
		"node_ids":        nodeIDs,
	})
}

// handleAuditorGDPRErase handles POST /api/auditor/gdpr-erase
func (s *Server) handleAuditorGDPRErase(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	graph, vecs, kv, log := s.db.Stores()

	var req struct {
		SourceID string `json:"source_id"`
		Reason   string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, map[string]string{"error": "invalid JSON"})
		return
	}

	if req.SourceID == "" {
		writeJSON(w, 400, map[string]string{"error": "source_id is required"})
		return
	}

	processor := advanced.NewGDPRProcessor(graph, vecs, kv, log)
	report, err := processor.ProcessErasure(ctx, advanced.ErasureRequest{
		Namespace: "auditor",
		SourceID:  req.SourceID,
		Reason:    req.Reason,
	})
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, 200, map[string]any{
		"namespace":          report.Namespace,
		"source_id":          report.SourceID,
		"nodes_retracted":    report.NodesRetracted,
		"vectors_deleted":    report.VectorsDeleted,
		"edges_invalidated":  report.EdgesInvalidated,
		"events_redacted":    report.EventsRedacted,
	})
}

// handleAuditorActiveLearning handles GET /api/auditor/active-learning
func (s *Server) handleAuditorActiveLearning(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	graph, _, _, _ := s.db.Stores()

	budgetStr := r.URL.Query().Get("budget")
	budget := 5
	if budgetStr != "" {
		parsed, err := strconv.Atoi(budgetStr)
		if err == nil && parsed > 0 {
			budget = parsed
		}
	}

	learner := advanced.NewActiveLearner(graph)
	suggestions, err := learner.Suggest(ctx, "auditor", budget)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	type suggestionJSON struct {
		Type           string   `json:"type"`
		Priority       float64  `json:"priority"`
		Description    string   `json:"description"`
		RelatedNodeIDs []string `json:"related_node_ids"`
		Namespace      string   `json:"namespace"`
	}

	out := make([]suggestionJSON, 0, len(suggestions))
	for _, s := range suggestions {
		ids := make([]string, 0, len(s.RelatedNodeIDs))
		for _, id := range s.RelatedNodeIDs {
			ids = append(ids, id.String())
		}
		out = append(out, suggestionJSON{
			Type:           string(s.Type),
			Priority:       s.Priority,
			Description:    s.Description,
			RelatedNodeIDs: ids,
			Namespace:      s.Namespace,
		})
	}

	writeJSON(w, 200, out)
}

// handleAuditorReset handles POST /api/auditor/reset
func (s *Server) handleAuditorReset(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	graph, _, _, _ := s.db.Stores()

	nodes, err := graph.ValidAt(ctx, "auditor", time.Now(), nil)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	sourceMap := make(map[string]bool)
	for _, node := range nodes {
		if sid, ok := node.Properties["source_id"].(string); ok && sid != "" {
			sourceMap[sid] = true
		}
	}

	retractor := advanced.NewBulkRetractor(graph)
	for sourceID := range sourceMap {
		_, err := retractor.RetractBySource(ctx, "auditor", sourceID, "reset")
		if err != nil {
			writeJSON(w, 500, map[string]string{"error": err.Error()})
			return
		}
	}

	if err := seed.SeedAuditor(s.db); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, 200, map[string]bool{"ok": true})
}
