package seed

import (
	"context"
	"fmt"
	"time"

	"github.com/antiartificial/contextdb/pkg/advanced"
	"github.com/antiartificial/contextdb/pkg/client"
)

// SeedAgent creates an agent memory namespace with episodic, semantic, procedural, and working memories.
func SeedAgent(db *client.DB) error {
	ctx := context.Background()
	ns := db.Namespace("agent", advanced.ModeAgentMemory)

	now := time.Now()
	source := "agent:coder-v2"

	// Episodic memories: chronological events during the refactor
	episodicMemories := []struct {
		content    string
		topic      string
		hoursAgo   int
		confidence float64
	}{
		{"Started auth module refactor, analyzed existing JWT implementation", TopicAuth, 72, 0.85},
		{"Found SQL injection vulnerability in login query builder", TopicAuth, 65, 0.90},
		{"Replaced raw SQL with parameterized queries in auth/login.go", TopicRefactor, 48, 0.88},
		{"Added rate limiting middleware: 100 req/min per IP using sliding window", TopicRefactor, 36, 0.87},
		{"OAuth2 PKCE flow implemented for mobile clients", TopicRefactor, 24, 0.86},
		{"Integration tests passing for all auth endpoints (23/23)", TopicTesting, 12, 0.89},
		{"Deployed auth v2 to staging, monitoring error rates", TopicDeploy, 4, 0.82},
		{"Production rollout complete, 0.02% error rate (below 0.1% threshold)", TopicDeploy, 1, 0.80},
	}

	for i, mem := range episodicMemories {
		_, err := ns.Write(ctx, client.WriteRequest{
			Content:    mem.content,
			SourceID:   source,
			Labels:     []string{"episodic", "refactor", "auth"},
			Vector:     TopicVector(mem.topic, i+1),
			Confidence: mem.confidence,
			ValidFrom:  now.Add(-time.Duration(mem.hoursAgo) * time.Hour),
			MemType:    advanced.MemoryEpisodic,
		})
		if err != nil {
			return fmt.Errorf("write episodic memory %d: %w", i, err)
		}
	}

	// Semantic memories: learned facts and principles
	semanticMemories := []struct {
		content    string
		topic      string
		confidence float64
	}{
		{"JWT tokens should use RS256 with 2048-bit keys for production", TopicAuth, 0.95},
		{"Rate limiting prevents brute force: sliding window > fixed window for UX", TopicAuth, 0.92},
		{"PKCE eliminates authorization code interception in mobile OAuth flows", TopicAuth, 0.93},
		{"Parameterized queries prevent SQL injection in all database operations", TopicAuth, 0.95},
		{"Integration tests should cover both happy path and error cases for auth", TopicTesting, 0.88},
	}

	for i, mem := range semanticMemories {
		_, err := ns.Write(ctx, client.WriteRequest{
			Content:    mem.content,
			SourceID:   source,
			Labels:     []string{"semantic", "principle", "security"},
			Vector:     TopicVector(mem.topic, i+10),
			Confidence: mem.confidence,
			ValidFrom:  now.Add(-12 * time.Hour),
			MemType:    advanced.MemorySemantic,
		})
		if err != nil {
			return fmt.Errorf("write semantic memory %d: %w", i, err)
		}
	}

	// Procedural memories: how-to knowledge
	proceduralMemories := []struct {
		content    string
		topic      string
		confidence float64
	}{
		{"Auth refactor workflow: audit → fix vulns → add features → test → stage → deploy", TopicRefactor, 0.94},
		{"Code review checklist: injection, auth bypass, rate limits, token expiry, CORS", TopicAuth, 0.92},
		{"Deployment procedure: run tests → deploy staging → monitor 1hr → deploy prod → monitor", TopicDeploy, 0.93},
	}

	for i, mem := range proceduralMemories {
		_, err := ns.Write(ctx, client.WriteRequest{
			Content:    mem.content,
			SourceID:   source,
			Labels:     []string{"procedural", "workflow", "process"},
			Vector:     TopicVector(mem.topic, i+20),
			Confidence: mem.confidence,
			ValidFrom:  now.Add(-24 * time.Hour),
			MemType:    advanced.MemoryProcedural,
		})
		if err != nil {
			return fmt.Errorf("write procedural memory %d: %w", i, err)
		}
	}

	// Working memories: current context and next actions
	workingMemories := []struct {
		content    string
		topic      string
		confidence float64
	}{
		{"Currently monitoring production auth v2 deployment", TopicDeploy, 0.70},
		{"Next task: implement refresh token rotation", TopicAuth, 0.65},
	}

	for i, mem := range workingMemories {
		_, err := ns.Write(ctx, client.WriteRequest{
			Content:    mem.content,
			SourceID:   source,
			Labels:     []string{"working", "active", "current"},
			Vector:     TopicVector(mem.topic, i+30),
			Confidence: mem.confidence,
			ValidFrom:  now.Add(-30 * time.Minute),
			MemType:    advanced.MemoryWorking,
		})
		if err != nil {
			return fmt.Errorf("write working memory %d: %w", i, err)
		}
	}

	return nil
}
