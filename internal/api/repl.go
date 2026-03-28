package api

import (
	"net/http"
	"time"

	"github.com/antiartificial/context-kitchen-sink/internal/seed"
	"github.com/antiartificial/contextdb/pkg/advanced"
)

// parseMode converts a mode string to a NamespaceMode constant
func parseMode(s string) advanced.NamespaceMode {
	switch s {
	case "belief_system":
		return advanced.ModeBeliefSystem
	case "agent_memory":
		return advanced.ModeAgentMemory
	case "procedural":
		return advanced.ModeProcedural
	default:
		return advanced.ModeGeneral
	}
}

// handleReplExecute handles POST /api/repl/execute
func (s *Server) handleReplExecute(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		Query     string `json:"query"`
		Syntax    string `json:"syntax"`
		Namespace string `json:"namespace"`
		Mode      string `json:"mode"`
	}

	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate required fields
	if req.Query == "" {
		writeError(w, http.StatusBadRequest, "query is required")
		return
	}
	if req.Syntax != "pipe" && req.Syntax != "cql" {
		writeError(w, http.StatusBadRequest, "syntax must be 'pipe' or 'cql'")
		return
	}

	// Default namespace and mode
	if req.Namespace == "" {
		req.Namespace = "repl"
	}
	if req.Mode == "" {
		req.Mode = "general"
	}

	// Record start time
	startTime := time.Now()

	// Parse query
	var query *advanced.Query
	var parseErr error
	if req.Syntax == "pipe" {
		query, parseErr = advanced.ParsePipe(req.Query)
	} else {
		query, parseErr = advanced.ParseCQL(req.Query)
	}

	parseTime := time.Since(startTime)

	// If parse error, return early
	if parseErr != nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"query":           req.Query,
			"syntax":          req.Syntax,
			"ast":             nil,
			"results":         nil,
			"error":           parseErr.Error(),
			"parse_time_us":   parseTime.Microseconds(),
			"execute_time_us": int64(0),
			"total_results":   0,
		})
		return
	}

	// Convert to RetrieveRequest
	retrieveReq := advanced.ToRetrieveRequest(query)

	// Use namespace from query if set, otherwise use from request body
	namespace := req.Namespace
	if query.Namespace != "" {
		namespace = query.Namespace
	}

	// Get namespace handle with appropriate mode
	mode := parseMode(req.Mode)
	ns := s.db.Namespace(namespace, mode)

	// Execute retrieve
	executeStart := time.Now()
	results, err := ns.Retrieve(ctx, retrieveReq)
	executeTime := time.Since(executeStart)

	// If execution error, return with error
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"query":           req.Query,
			"syntax":          req.Syntax,
			"ast":             query,
			"results":         nil,
			"error":           err.Error(),
			"parse_time_us":   parseTime.Microseconds(),
			"execute_time_us": executeTime.Microseconds(),
			"total_results":   0,
		})
		return
	}

	// Build response results
	type resultResponse struct {
		ID              string    `json:"id"`
		Content         string    `json:"content"`
		Labels          []string  `json:"labels"`
		Confidence      float64   `json:"confidence"`
		Score           float64   `json:"score"`
		SimilarityScore float64   `json:"similarity_score"`
		ConfidenceScore float64   `json:"confidence_score"`
		RecencyScore    float64   `json:"recency_score"`
		UtilityScore    float64   `json:"utility_score"`
		SourceID        string    `json:"source_id"`
		ValidFrom       time.Time `json:"valid_from"`
	}

	responseResults := make([]resultResponse, 0, len(results))
	for _, result := range results {
		// Extract source_id from properties
		sourceID := ""
		if sid, ok := result.Node.Properties["source_id"].(string); ok {
			sourceID = sid
		}

		responseResults = append(responseResults, resultResponse{
			ID:              result.Node.ID.String(),
			Content:         advanced.NodeText(result.Node),
			Labels:          result.Node.Labels,
			Confidence:      result.Node.Confidence,
			Score:           result.Score,
			SimilarityScore: result.SimilarityScore,
			ConfidenceScore: result.ConfidenceScore,
			RecencyScore:    result.RecencyScore,
			UtilityScore:    result.UtilityScore,
			SourceID:        sourceID,
			ValidFrom:       result.Node.ValidFrom,
		})
	}

	// Return successful response
	writeJSON(w, http.StatusOK, map[string]any{
		"query":           req.Query,
		"syntax":          req.Syntax,
		"ast":             query,
		"results":         responseResults,
		"error":           nil,
		"parse_time_us":   parseTime.Microseconds(),
		"execute_time_us": executeTime.Microseconds(),
		"total_results":   len(results),
	})
}

// handleReplParse handles POST /api/repl/parse
func (s *Server) handleReplParse(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Query  string `json:"query"`
		Syntax string `json:"syntax"`
	}

	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate required fields
	if req.Query == "" {
		writeError(w, http.StatusBadRequest, "query is required")
		return
	}
	if req.Syntax != "pipe" && req.Syntax != "cql" {
		writeError(w, http.StatusBadRequest, "syntax must be 'pipe' or 'cql'")
		return
	}

	// Parse query
	var query *advanced.Query
	var parseErr error
	if req.Syntax == "pipe" {
		query, parseErr = advanced.ParsePipe(req.Query)
	} else {
		query, parseErr = advanced.ParseCQL(req.Query)
	}

	// Return parse result
	if parseErr != nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"valid": false,
			"ast":   nil,
			"error": parseErr.Error(),
		})
	} else {
		writeJSON(w, http.StatusOK, map[string]any{
			"valid": true,
			"ast":   query,
			"error": nil,
		})
	}
}

// handleReplReset handles POST /api/repl/reset
func (s *Server) handleReplReset(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	graph, _, _, _ := s.db.Stores()

	// Create bulk retractor
	retractor := advanced.NewBulkRetractor(graph)

	// Retract all nodes in the repl namespace (uses source: corpus:wikipedia)
	_, err := retractor.RetractBySource(ctx, "repl", "corpus:wikipedia", "reset")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Re-seed the repl
	if err := seed.SeedRepl(s.db); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{
		"ok": true,
	})
}
