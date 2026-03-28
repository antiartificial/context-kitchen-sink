// Package noise generates random memories for testing decay behavior.
package noise

import (
	"fmt"
	"math/rand"
	"time"
)

var episodicTemplates = []string{
	"Observed unexpected behavior in %s module at %s",
	"User reported issue with %s feature during %s",
	"Deployed hotfix for %s service affecting %s",
	"Performance spike detected in %s endpoint: %s",
	"Code review completed for %s PR: %s",
	"Database migration for %s table completed %s",
	"API rate limit triggered by %s client at %s",
	"Cache invalidation event for %s namespace: %s",
	"Security scan flagged %s dependency as %s",
	"Load test results for %s: %s",
}

var modules = []string{
	"auth", "payments", "notifications", "search", "analytics",
	"user-profiles", "messaging", "file-storage", "billing", "admin",
}

var descriptors = []string{
	"peak hours", "maintenance window", "during rollback",
	"after upgrade", "in staging", "on production",
	"intermittently", "consistently", "under load",
	"at startup",
}

// GenerateEpisodicMemory creates a random episodic memory string.
func GenerateEpisodicMemory(rng *rand.Rand) string {
	tmpl := episodicTemplates[rng.Intn(len(episodicTemplates))]
	mod := modules[rng.Intn(len(modules))]
	desc := descriptors[rng.Intn(len(descriptors))]
	return fmt.Sprintf(tmpl, mod, desc)
}

// GenerateConfidence returns a random confidence between 0.3 and 0.7.
func GenerateConfidence(rng *rand.Rand) float64 {
	return 0.3 + rng.Float64()*0.4
}

// NewRNG creates a seeded random generator.
func NewRNG() *rand.Rand {
	return rand.New(rand.NewSource(time.Now().UnixNano()))
}
