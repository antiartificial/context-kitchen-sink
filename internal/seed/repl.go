package seed

import (
	"context"
	"fmt"
	"time"

	"github.com/antiartificial/contextdb/pkg/advanced"
	"github.com/antiartificial/contextdb/pkg/client"
	"github.com/google/uuid"
)

// SeedRepl creates a general-purpose namespace with diverse content for REPL exploration.
func SeedRepl(db *client.DB) error {
	ctx := context.Background()
	ns := db.Namespace("repl", advanced.ModeGeneral)

	now := time.Now()
	source := "corpus:wikipedia"

	// Science claims
	scienceClaims := []struct {
		content    string
		confidence float64
		hoursAgo   int
		expired    bool
	}{
		{"DNA molecule has a double helix structure discovered by Watson and Crick in 1953", 0.95, 2, false},
		{"Photosynthesis converts light energy into chemical energy in plants and algae", 0.92, 6, false},
		{"Quantum entanglement allows particles to affect each other instantaneously at distance", 0.88, 12, false},
		{"CRISPR-Cas9 is a gene editing tool derived from bacterial immune systems", 0.90, 24, false},
		{"Dark matter comprises approximately 27% of the universe's mass-energy content", 0.75, 168, true}, // 1 week old, expired
	}

	scienceIDs := make([]uuid.UUID, len(scienceClaims))
	for i, claim := range scienceClaims {
		req := client.WriteRequest{
			Content:    claim.content,
			SourceID:   source,
			Labels:     []string{"science"},
			Vector:     TopicVector(TopicGeneralScience, i+1),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-time.Duration(claim.hoursAgo) * time.Hour),
			MemType:    advanced.MemorySemantic,
		}
		if claim.expired {
			validUntil := now.Add(-24 * time.Hour) // Expired yesterday
			req.Properties = map[string]any{"valid_until": validUntil}
		}
		result, err := ns.Write(ctx, req)
		if err != nil {
			return fmt.Errorf("write science claim %d: %w", i, err)
		}
		scienceIDs[i] = result.NodeID
	}

	// History claims
	historyClaims := []struct {
		content    string
		confidence float64
		daysAgo    int
	}{
		{"The Roman Empire fell in 476 CE when Romulus Augustulus was deposed", 0.88, 1},
		{"The Magna Carta was sealed by King John of England in 1215 at Runnymede", 0.92, 3},
		{"The Industrial Revolution began in Britain in the late 18th century", 0.85, 7},
		{"World War II ended in 1945 with the surrender of Germany and Japan", 0.95, 14},
		{"The Renaissance was a cultural movement spanning the 14th to 17th centuries", 0.78, 30},
	}

	historyIDs := make([]uuid.UUID, len(historyClaims))
	for i, claim := range historyClaims {
		result, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   source,
			Labels:     []string{"history"},
			Vector:     TopicVector(TopicGeneralHistory, i+1),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-time.Duration(claim.daysAgo) * 24 * time.Hour),
			MemType:    advanced.MemorySemantic,
		})
		if err != nil {
			return fmt.Errorf("write history claim %d: %w", i, err)
		}
		historyIDs[i] = result.NodeID
	}

	// Technology claims
	techClaims := []struct {
		content    string
		confidence float64
		hoursAgo   int
		expired    bool
	}{
		{"The World Wide Web was invented by Tim Berners-Lee at CERN in 1989", 0.95, 4, false},
		{"Transistors are semiconductor devices that amplify or switch electronic signals", 0.93, 8, false},
		{"Machine learning algorithms improve performance through experience without explicit programming", 0.87, 16, false},
		{"Blockchain is a distributed ledger technology enabling secure peer-to-peer transactions", 0.82, 48, false},
		{"Quantum computers use qubits that can exist in superposition states", 0.80, 720, true}, // 30 days old, expired
	}

	techIDs := make([]uuid.UUID, len(techClaims))
	for i, claim := range techClaims {
		req := client.WriteRequest{
			Content:    claim.content,
			SourceID:   source,
			Labels:     []string{"tech"},
			Vector:     TopicVector(TopicGeneralTech, i+1),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-time.Duration(claim.hoursAgo) * time.Hour),
			MemType:    advanced.MemorySemantic,
		}
		if claim.expired {
			validUntil := now.Add(-48 * time.Hour) // Expired 2 days ago
			req.Properties = map[string]any{"valid_until": validUntil}
		}
		result, err := ns.Write(ctx, req)
		if err != nil {
			return fmt.Errorf("write tech claim %d: %w", i, err)
		}
		techIDs[i] = result.NodeID
	}

	// Culture claims
	cultureClaims := []struct {
		content    string
		confidence float64
		daysAgo    int
	}{
		{"Shakespeare wrote 37 plays and 154 sonnets during the Elizabethan era", 0.85, 2},
		{"Jazz originated in African American communities in New Orleans in the early 20th century", 0.82, 5},
		{"The Mona Lisa painted by Leonardo da Vinci is housed in the Louvre Museum", 0.90, 10},
		{"Greek mythology featured gods like Zeus, Athena, and Apollo living on Mount Olympus", 0.75, 15},
		{"Buddhism was founded by Siddhartha Gautama in ancient India around 500 BCE", 0.65, 21},
	}

	cultureIDs := make([]uuid.UUID, len(cultureClaims))
	for i, claim := range cultureClaims {
		result, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   source,
			Labels:     []string{"culture"},
			Vector:     TopicVector(TopicGeneralCulture, i+1),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-time.Duration(claim.daysAgo) * 24 * time.Hour),
			MemType:    advanced.MemorySemantic,
		})
		if err != nil {
			return fmt.Errorf("write culture claim %d: %w", i, err)
		}
		cultureIDs[i] = result.NodeID
	}

	// Add edges between related claims
	edges := []struct {
		fromID   uuid.UUID
		toID     uuid.UUID
		relation string
		desc     string
	}{
		// Science relationships
		{scienceIDs[2], scienceIDs[4], advanced.EdgeSupports, "quantum entanglement supports dark matter research"},
		{scienceIDs[3], scienceIDs[0], advanced.EdgeDerivedFrom, "CRISPR builds on DNA structure understanding"},

		// History relationships
		{historyIDs[3], historyIDs[2], advanced.EdgeDerivedFrom, "WWII outcome shaped by industrial capacity"},
		{historyIDs[4], historyIDs[0], "relates_to", "Renaissance preceded Roman Empire's influence"},

		// Tech relationships
		{techIDs[2], techIDs[1], advanced.EdgeDerivedFrom, "ML algorithms run on transistor-based hardware"},
		{techIDs[4], techIDs[2], advanced.EdgeSupports, "quantum computing may accelerate ML"},

		// Cross-domain relationships
		{techIDs[0], historyIDs[1], "relates_to", "WWW democratized information like Magna Carta did rights"},
		{cultureIDs[2], historyIDs[4], "relates_to", "Mona Lisa exemplifies Renaissance art"},
	}

	for i, e := range edges {
		edge := advanced.Edge{
			Src:        e.fromID,
			Dst:        e.toID,
			Type:       e.relation,
			Weight:     0.70,
			Properties: map[string]any{"description": e.desc},
		}
		if err := ns.AddEdge(ctx, edge); err != nil {
			return fmt.Errorf("add edge %d: %w", i, err)
		}
	}

	return nil
}
