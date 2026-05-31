package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/antiartificial/contextdb/pkg/advanced"
	"github.com/antiartificial/contextdb/pkg/client"
	"github.com/google/uuid"
)

type platformFeature struct {
	Name        string `json:"name"`
	Status      string `json:"status"`
	Description string `json:"description"`
	Surface     string `json:"surface"`
}

func (s *Server) handlePlatformStatus(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"playground":        "context-kitchen-sink",
		"contextdb_version": "v0.108.0",
		"updated_at":        time.Now().UTC(),
		"summary":           "The playground is current for scenarios, source credibility, contradiction workflows, agent memory, auditor epistemics, and DSL exploration. Newer reliability and acquisition surfaces are exposed here as guided system checks.",
		"features": []platformFeature{
			{"Scenario explorer", "live", "Side-by-side examples for temporal knowledge, source trust, contradictions, provenance, erasure, and gaps.", "Scenarios"},
			{"Newsroom credibility", "live", "Multi-source claim writes, validation/refutation, source trust, and conflict surfacing.", "Newsroom"},
			{"Agent memory", "live", "Memory decay, recency, utility scoring, and noise resistance examples.", "Agent Memory"},
			{"Auditor epistemics", "live", "Narratives, belief diff, knowledge gaps, calibration, retraction, erasure, and active learning.", "Auditor"},
			{"DSL REPL", "live", "Pipe and CQL parsing/execution with rerank syntax examples.", "DSL REPL"},
			{"Acquisition dry-run", "live", "Connector-specific dry-run preview using the current acquisition planner and payload hash contract.", "System"},
			{"Acquisition receipts", "live", "Receipt and retry endpoints are wired for executed connector attempts; dry-run mode intentionally creates no receipts.", "System"},
			{"Explain-rank", "live", "Compares two seeded auditor claims with current score-factor and graph-evidence explanations.", "System"},
			{"Admin dashboard", "external", "The full Svelte metrics/ranking/debugger dashboard lives in the contextdb server on observe port 7702.", "contextdb"},
			{"Release health", "external", "Schema catalog, closure bundle, ranking baseline, Docker/Postgres, and durability gates are tracked in the main contextdb repo.", "contextdb"},
		},
	})
}

func (s *Server) handlePlatformAcquisitionPreview(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Budget           int      `json:"budget"`
		MaxGaps          int      `json:"max_gaps"`
		MaxResults       int      `json:"max_results"`
		AllowedSourceIDs []string `json:"allowed_source_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if req.Budget <= 0 {
		req.Budget = 3
	}
	if req.MaxGaps <= 0 {
		req.MaxGaps = 3
	}
	if req.MaxResults <= 0 {
		req.MaxResults = 3
	}
	if len(req.AllowedSourceIDs) == 0 {
		req.AllowedSourceIDs = []string{"playground/auditor"}
	}

	ns := s.db.Namespace("auditor", advanced.ModeBeliefSystem)
	plan, err := ns.AcquisitionExecutionPreview(r.Context(), client.AcquisitionExecutionRequest{
		AcquisitionPlanRequest: client.AcquisitionPlanRequest{
			Budget:  req.Budget,
			MaxGaps: req.MaxGaps,
		},
		MaxResults:       req.MaxResults,
		AllowedSourceIDs: req.AllowedSourceIDs,
		Connectors: []client.AcquisitionConnector{{
			ID:               "playground-search-preview",
			Type:             "search",
			Endpoint:         "https://search.example.internal/contextdb",
			AllowedSourceIDs: req.AllowedSourceIDs,
			DefaultLabels:    []string{"acquired", "playground"},
		}},
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, plan)
}

func (s *Server) handlePlatformAcquisitionReceipts(w http.ResponseWriter, r *http.Request) {
	ns := s.db.Namespace("auditor", advanced.ModeBeliefSystem)
	receipts, err := ns.AcquisitionExecutionReceipts(r.Context(), time.Time{})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	candidates, err := ns.AcquisitionRetryCandidates(r.Context(), time.Time{})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	recommendations, err := ns.AcquisitionRetryRecommendations(r.Context(), time.Time{}, time.Now())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"receipts":        receipts,
		"candidates":      candidates,
		"recommendations": recommendations,
	})
}

func (s *Server) handlePlatformExplainRank(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	graph, _, _, _ := s.db.Stores()
	nodes, err := graph.ValidAt(ctx, "auditor", time.Now(), nil)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if len(nodes) < 2 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "need at least two auditor nodes"})
		return
	}

	var req struct {
		NodeID      string `json:"node_id"`
		OtherNodeID string `json:"other_node_id"`
		Text        string `json:"text"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	left := nodes[0].ID
	right := nodes[1].ID
	if req.NodeID != "" {
		id, err := uuid.Parse(req.NodeID)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid node_id"})
			return
		}
		left = id
	}
	if req.OtherNodeID != "" {
		id, err := uuid.Parse(req.OtherNodeID)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid other_node_id"})
			return
		}
		right = id
	}
	if req.Text == "" {
		req.Text = "Which claim is better supported by reliable evidence?"
	}

	ns := s.db.Namespace("auditor", advanced.ModeBeliefSystem)
	explanation, err := ns.ExplainRank(ctx, client.ExplainRankRequest{
		NodeID:      left,
		OtherNodeID: right,
		Text:        req.Text,
		MaxDepth:    2,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, explanation)
}
