package seed

import (
	"context"
	"fmt"
	"time"

	"github.com/antiartificial/contextdb/pkg/advanced"
	"github.com/antiartificial/contextdb/pkg/client"
	"github.com/google/uuid"
)

// SeedNewsroom creates a belief system namespace with competing claims from different sources.
func SeedNewsroom(db *client.DB) error {
	ctx := context.Background()
	ns := db.Namespace("newsroom", advanced.ModeBeliefSystem)

	// Label the three sources
	if err := ns.LabelSource(ctx, "journalist:reuters", []string{"verified", "mainstream"}); err != nil {
		return fmt.Errorf("label reuters: %w", err)
	}
	if err := ns.LabelSource(ctx, "twitter:@cryptobro", []string{"social", "unverified"}); err != nil {
		return fmt.Errorf("label cryptobro: %w", err)
	}
	if err := ns.LabelSource(ctx, "troll:bot42", []string{"troll"}); err != nil {
		return fmt.Errorf("label troll: %w", err)
	}

	now := time.Now()

	// Journalist claims (high confidence)
	journalistClaims := []struct {
		content    string
		topic      string
		confidence float64
	}{
		{"Global GDP growth projected at 3.2% for 2025 according to IMF data", TopicEconomics, 0.95},
		{"mRNA vaccines reduce severe COVID hospitalization by 89% per WHO meta-analysis", TopicHealth, 0.92},
		{"James Webb telescope confirms water vapor in exoplanet K2-18b atmosphere", TopicSpace, 0.88},
		{"Solar panel efficiency reaches 47.6% in laboratory perovskite-silicon tandem cells", TopicEnergy, 0.85},
	}

	journalistIDs := make([]uuid.UUID, len(journalistClaims))
	for i, claim := range journalistClaims {
		result, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "journalist:reuters",
			Labels:     []string{"news", "verified"},
			Vector:     TopicVector(claim.topic, 1),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-1 * time.Hour),
			MemType:    advanced.MemorySemantic,
		})
		if err != nil {
			return fmt.Errorf("write journalist claim %d: %w", i, err)
		}
		journalistIDs[i] = result.NodeID
	}

	// Twitter claims (medium confidence, contradicting 3 journalist claims)
	twitterClaims := []struct {
		content        string
		topic          string
		confidence     float64
		contradictsIdx int // -1 if no contradiction
	}{
		{"Economy is actually shrinking, GDP numbers are manipulated by central banks", TopicEconomics, 0.60, 0},
		{"Vaccines cause more hospitalizations than they prevent, exposed by leaked documents", TopicHealth, 0.55, 1},
		{"K2-18b water detection was a calibration error, retracted by the team", TopicSpace, 0.58, 2},
		{"New battery tech from solid-state lithium achieves 500 Wh/kg milestone", TopicEnergy, 0.52, -1},
	}

	twitterIDs := make([]uuid.UUID, len(twitterClaims))
	for i, claim := range twitterClaims {
		result, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "twitter:@cryptobro",
			Labels:     []string{"social", "unverified"},
			Vector:     TopicVector(claim.topic, 2),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-30 * time.Minute),
			MemType:    advanced.MemorySemantic,
		})
		if err != nil {
			return fmt.Errorf("write twitter claim %d: %w", i, err)
		}
		twitterIDs[i] = result.NodeID
	}

	// Troll claims (very low confidence, should be rejected by admission threshold)
	trollClaims := []struct {
		content string
		topic   string
	}{
		{"The IMF is actually run by lizard people from the hollow earth", TopicEconomics},
		{"Vaccines contain nanobots that control your thoughts via 5G towers", TopicHealth},
		{"K2-18b is flat and NASA is hiding the truth from the public", TopicSpace},
		{"Solar panels steal energy from the sun and will make it burn out faster", TopicEnergy},
	}

	for i, claim := range trollClaims {
		_, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "troll:bot42",
			Labels:     []string{"troll", "spam"},
			Vector:     TopicVector(claim.topic, 3),
			Confidence: 0.05 + float64(i)*0.01, // 0.05 to 0.08
			ValidFrom:  now.Add(-5 * time.Minute),
			MemType:    advanced.MemorySemantic,
		})
		if err != nil {
			return fmt.Errorf("write troll claim %d: %w", i, err)
		}
	}

	// Add contradiction edges between journalist and twitter claims
	for i, claim := range twitterClaims {
		if claim.contradictsIdx >= 0 {
			edge := advanced.Edge{
				Src:    twitterIDs[i],
				Dst:    journalistIDs[claim.contradictsIdx],
				Type:   advanced.EdgeContradicts,
				Weight: 0.8,
			}
			if err := ns.AddEdge(ctx, edge); err != nil {
				return fmt.Errorf("add contradiction edge %d: %w", i, err)
			}
		}
	}

	return nil
}
