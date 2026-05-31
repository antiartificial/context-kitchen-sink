package api

import (
	"net/http"
	"sync"
	"time"

	"github.com/antiartificial/contextdb/pkg/client"
)

// Server holds the API server state
type Server struct {
	db       *client.DB
	password string
	sessions map[string]time.Time // sessionID → expiry
	mu       sync.RWMutex
	limiter  *rateLimiter
}

// NewRouter creates a new HTTP router with all API endpoints
func NewRouter(db *client.DB, password string) http.Handler {
	s := &Server{
		db:       db,
		password: password,
		sessions: make(map[string]time.Time),
		limiter:  &rateLimiter{attempts: make(map[string][]time.Time)},
	}

	mux := http.NewServeMux()

	// Auth (no auth middleware)
	mux.HandleFunc("POST /api/auth/login", s.handleLogin)
	mux.HandleFunc("POST /api/auth/logout", s.handleLogout)
	mux.HandleFunc("GET /api/auth/check", s.handleAuthCheck)

	// Protected routes - wrap in auth middleware
	protected := http.NewServeMux()

	// Newsroom
	protected.HandleFunc("POST /api/newsroom/write", s.handleNewsroomWrite)
	protected.HandleFunc("GET /api/newsroom/sources", s.handleNewsroomSources)
	protected.HandleFunc("POST /api/newsroom/validate", s.handleNewsroomValidate)
	protected.HandleFunc("GET /api/newsroom/claims", s.handleNewsroomClaims)
	protected.HandleFunc("GET /api/newsroom/conflicts", s.handleNewsroomConflicts)
	protected.HandleFunc("POST /api/newsroom/fetch-live", s.handleNewsroomFetchLive)
	protected.HandleFunc("POST /api/newsroom/reset", s.handleNewsroomReset)

	// Agent
	protected.HandleFunc("GET /api/agent/memories", s.handleAgentMemories)
	protected.HandleFunc("GET /api/agent/timeline", s.handleAgentTimeline)
	protected.HandleFunc("POST /api/agent/add-noise", s.handleAgentAddNoise)
	protected.HandleFunc("POST /api/agent/reset", s.handleAgentReset)

	// Auditor
	protected.HandleFunc("GET /api/auditor/nodes", s.handleAuditorNodes)
	protected.HandleFunc("POST /api/auditor/narrative", s.handleAuditorNarrative)
	protected.HandleFunc("POST /api/auditor/belief-diff", s.handleAuditorBeliefDiff)
	protected.HandleFunc("POST /api/auditor/knowledge-gaps", s.handleAuditorKnowledgeGaps)
	protected.HandleFunc("POST /api/auditor/calibration", s.handleAuditorCalibration)
	protected.HandleFunc("POST /api/auditor/retract", s.handleAuditorRetract)
	protected.HandleFunc("POST /api/auditor/gdpr-erase", s.handleAuditorGDPRErase)
	protected.HandleFunc("GET /api/auditor/active-learning", s.handleAuditorActiveLearning)
	protected.HandleFunc("POST /api/auditor/reset", s.handleAuditorReset)

	// REPL
	protected.HandleFunc("POST /api/repl/execute", s.handleReplExecute)
	protected.HandleFunc("POST /api/repl/parse", s.handleReplParse)
	protected.HandleFunc("POST /api/repl/reset", s.handleReplReset)

	// Current platform surface
	protected.HandleFunc("GET /api/platform/status", s.handlePlatformStatus)
	protected.HandleFunc("POST /api/platform/acquisition-preview", s.handlePlatformAcquisitionPreview)
	protected.HandleFunc("GET /api/platform/acquisition-receipts", s.handlePlatformAcquisitionReceipts)
	protected.HandleFunc("POST /api/platform/explain-rank", s.handlePlatformExplainRank)

	mux.Handle("/api/", s.authMiddleware(protected))

	handler := corsMiddleware(loggingMiddleware(mux))
	return handler
}
