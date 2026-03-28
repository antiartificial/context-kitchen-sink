package api

import (
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
)

// rateLimiter tracks authentication attempts per IP address
type rateLimiter struct {
	attempts map[string][]time.Time
	mu       sync.Mutex
}

// allow checks if the IP is allowed to make an attempt
// Returns false if >5 attempts in last minute or >15 attempts in last 5 minutes
func (rl *rateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	attempts := rl.attempts[ip]

	// Clean up old attempts (older than 5 minutes)
	var recent []time.Time
	for _, t := range attempts {
		if now.Sub(t) < 5*time.Minute {
			recent = append(recent, t)
		}
	}
	rl.attempts[ip] = recent

	// Check 15 attempts in 5 minutes (block for 5 min)
	if len(recent) >= 15 {
		return false
	}

	// Check 5 attempts in 1 minute
	var lastMinute int
	for _, t := range recent {
		if now.Sub(t) < time.Minute {
			lastMinute++
		}
	}

	return lastMinute < 5
}

// record records an authentication attempt for the IP
func (rl *rateLimiter) record(ip string) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	rl.attempts[ip] = append(rl.attempts[ip], time.Now())
}

// handleLogin handles POST /api/auth/login
func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	// Get client IP
	ip := r.RemoteAddr
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ip = xff
	}

	// Check rate limit
	if !s.limiter.allow(ip) {
		writeError(w, http.StatusTooManyRequests, "too many login attempts")
		return
	}

	// Record attempt
	s.limiter.record(ip)

	// Parse request
	var req struct {
		Password string `json:"password"`
	}
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request")
		return
	}

	// Check password
	if req.Password != s.password {
		writeError(w, http.StatusUnauthorized, "invalid password")
		return
	}

	// Create session
	sessionID := uuid.New().String()
	expiry := time.Now().Add(24 * time.Hour)

	s.mu.Lock()
	s.sessions[sessionID] = expiry
	s.mu.Unlock()

	// Set cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "playground_session",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  expiry,
	})

	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// handleLogout handles POST /api/auth/logout
func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("playground_session")
	if err == nil {
		// Delete session from map
		s.mu.Lock()
		delete(s.sessions, cookie.Value)
		s.mu.Unlock()
	}

	// Clear cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "playground_session",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// handleAuthCheck handles GET /api/auth/check
func (s *Server) handleAuthCheck(w http.ResponseWriter, r *http.Request) {
	authenticated := false

	cookie, err := r.Cookie("playground_session")
	if err == nil {
		s.mu.RLock()
		expiry, exists := s.sessions[cookie.Value]
		s.mu.RUnlock()

		if exists && time.Now().Before(expiry) {
			authenticated = true
		}
	}

	writeJSON(w, http.StatusOK, map[string]bool{"authenticated": authenticated})
}
