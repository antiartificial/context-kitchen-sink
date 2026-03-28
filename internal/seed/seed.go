package seed

import (
	"fmt"

	"github.com/antiartificial/contextdb/pkg/client"
)

// SeedAll populates all demonstration namespaces with seed data.
func SeedAll(db *client.DB) error {
	if err := SeedNewsroom(db); err != nil {
		return fmt.Errorf("newsroom seed: %w", err)
	}
	if err := SeedAgent(db); err != nil {
		return fmt.Errorf("agent seed: %w", err)
	}
	if err := SeedAuditor(db); err != nil {
		return fmt.Errorf("auditor seed: %w", err)
	}
	if err := SeedRepl(db); err != nil {
		return fmt.Errorf("repl seed: %w", err)
	}
	return nil
}
