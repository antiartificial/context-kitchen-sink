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

		// Extract source_id from properties
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

	_ = vecs // silence unused warning if needed
	writeJSON(w, 200, result)
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

	writeJSON(w, 200, report)
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

	// Enrich conflicts with node content
	type enrichedConflict struct {
		ClaimA struct {
			NodeID         string  `json:"node_id"`
			Text           string  `json:"text"`
			Confidence     float64 `json:"confidence"`
			SourceID       string  `json:"source_id"`
			SupporterCount int     `json:"supporter_count"`
		} `json:"claim_a"`
		ClaimB struct {
			NodeID         string  `json:"node_id"`
			Text           string  `json:"text"`
			Confidence     float64 `json:"confidence"`
			SourceID       string  `json:"source_id"`
			SupporterCount int     `json:"supporter_count"`
		} `json:"claim_b"`
		ContradictionWeight float64 `json:"contradiction_weight"`
		CredibilityGap      float64 `json:"credibility_gap"`
	}

	enriched := make([]enrichedConflict, 0, len(diff.Conflicts))
	for _, conflict := range diff.Conflicts {
		textA := advanced.NodeText(conflict.ClaimA.Node)
		textB := advanced.NodeText(conflict.ClaimB.Node)

		ec := enrichedConflict{
			ContradictionWeight: conflict.ContradictionWeight,
			CredibilityGap:      conflict.CredibilityGap,
		}
		ec.ClaimA.NodeID = conflict.ClaimA.Node.ID.String()
		ec.ClaimA.Text = textA
		ec.ClaimA.Confidence = conflict.ClaimA.Confidence
		ec.ClaimA.SourceID = conflict.ClaimA.SourceID
		ec.ClaimA.SupporterCount = conflict.ClaimA.SupporterCount

		ec.ClaimB.NodeID = conflict.ClaimB.Node.ID.String()
		ec.ClaimB.Text = textB
		ec.ClaimB.Confidence = conflict.ClaimB.Confidence
		ec.ClaimB.SourceID = conflict.ClaimB.SourceID
		ec.ClaimB.SupporterCount = conflict.ClaimB.SupporterCount

		enriched = append(enriched, ec)
	}

	result := map[string]interface{}{
		"namespace":           diff.Namespace,
		"conflicts":           enriched,
		"total_conflicts":     diff.TotalConflicts,
		"avg_credibility_gap": diff.AvgCredibilityGap,
	}

	writeJSON(w, 200, result)
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

	// Set defaults
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

	// Get total nodes for coverage calculation
	nodes, err := graph.ValidAt(ctx, "auditor", time.Now(), nil)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	report := advanced.BuildGapReport("auditor", gaps, len(nodes))
	writeJSON(w, 200, report)
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

	// Extract prediction outcomes from nodes
	outcomes := make([]advanced.PredictionOutcome, 0)
	for _, node := range nodes {
		if predMap, ok := node.Properties["prediction_outcome"].(map[string]interface{}); ok {
			predicted, okPred := predMap["predicted"].(float64)
			actual, okActual := predMap["actual"].(float64)
			if okPred && okActual {
				outcomes = append(outcomes, advanced.PredictionOutcome{
					Predicted: predicted,
					Actual:    actual,
				})
			}
		}
	}

	if len(outcomes) == 0 {
		writeJSON(w, 200, map[string]interface{}{
			"message":     "no prediction outcomes found",
			"total_nodes": len(nodes),
			"brier_score": 0,
			"ece":         0,
			"mce":         0,
			"bins":        []interface{}{},
		})
		return
	}

	// Compute calibration metrics
	brierScore := advanced.BrierScore(outcomes)
	ece := advanced.ExpectedCalibrationError(outcomes, 10)
	mce := advanced.MaxCalibrationError(outcomes, 10)

	// Fit calibrators
	platt := &advanced.PlattScaler{}
	platt.Fit(outcomes, 10)

	iso := &advanced.IsotonicRegressor{}
	iso.Fit(outcomes)

	// Build bins manually (10 bins)
	type binData struct {
		BinStart       float64 `json:"bin_start"`
		BinEnd         float64 `json:"bin_end"`
		AvgPredicted   float64 `json:"avg_predicted"`
		AvgActual      float64 `json:"avg_actual"`
		Count          int     `json:"count"`
		CalibrationErr float64 `json:"calibration_err"`
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
			bins[i].CalibrationErr = bins[i].AvgPredicted - bins[i].AvgActual
			if bins[i].CalibrationErr < 0 {
				bins[i].CalibrationErr = -bins[i].CalibrationErr
			}
		}
	}

	result := map[string]interface{}{
		"total_predictions": len(outcomes),
		"brier_score":       brierScore,
		"ece":               ece,
		"mce":               mce,
		"bins":              bins,
		"platt_fitted":      platt != nil,
		"isotonic_fitted":   iso != nil,
	}

	writeJSON(w, 200, result)
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

	writeJSON(w, 200, result)
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

	writeJSON(w, 200, report)
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

	writeJSON(w, 200, suggestions)
}

// handleAuditorReset handles POST /api/auditor/reset
func (s *Server) handleAuditorReset(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	graph, _, _, _ := s.db.Stores()

	// Get all sources in the namespace
	nodes, err := graph.ValidAt(ctx, "auditor", time.Now(), nil)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	// Collect unique source IDs from properties
	sourceMap := make(map[string]bool)
	for _, node := range nodes {
		if sid, ok := node.Properties["source_id"].(string); ok && sid != "" {
			sourceMap[sid] = true
		}
	}

	// Retract all sources
	retractor := advanced.NewBulkRetractor(graph)
	for sourceID := range sourceMap {
		_, err := retractor.RetractBySource(ctx, "auditor", sourceID, "reset")
		if err != nil {
			writeJSON(w, 500, map[string]string{"error": err.Error()})
			return
		}
	}

	// Re-seed
	if err := seed.SeedAuditor(s.db); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, 200, map[string]bool{"ok": true})
}
