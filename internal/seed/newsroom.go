package seed

import (
	"context"
	"fmt"
	"time"

	"github.com/antiartificial/contextdb/pkg/advanced"
	"github.com/antiartificial/contextdb/pkg/client"
	"github.com/google/uuid"
)

// SeedNewsroom creates a belief system namespace demonstrating credibility-weighted
// conflict resolution. The scenario: evaluating a cloud vendor (Acme Cloud) where
// official specs, analyst reports, independent benchmarks, and community anecdotes
// all compete — and the "authoritative" source isn't always right.
func SeedNewsroom(db *client.DB) error {
	ctx := context.Background()
	ns := db.Namespace("newsroom", advanced.ModeBeliefSystem)

	// Sources: a credibility hierarchy that the evidence will challenge
	if err := ns.LabelSource(ctx, "vendor:acme-cloud", []string{"official", "manufacturer"}); err != nil {
		return fmt.Errorf("label vendor: %w", err)
	}
	if err := ns.LabelSource(ctx, "analyst:gartner", []string{"industry", "analyst"}); err != nil {
		return fmt.Errorf("label analyst: %w", err)
	}
	if err := ns.LabelSource(ctx, "engineer:jane-chen", []string{"practitioner", "benchmarks"}); err != nil {
		return fmt.Errorf("label engineer: %w", err)
	}
	if err := ns.LabelSource(ctx, "blog:random-dev", []string{"community", "anecdotal"}); err != nil {
		return fmt.Errorf("label blog: %w", err)
	}
	if err := ns.LabelSource(ctx, "community:hn-thread", []string{"community", "discussion"}); err != nil {
		return fmt.Errorf("label community: %w", err)
	}

	now := time.Now()

	// ── Vendor claims (high confidence — they wrote the spec sheet) ──

	vendorClaims := []struct {
		content    string
		topic      string
		confidence float64
	}{
		{"Acme Cloud API delivers sub-10ms P99 latency across all regions", TopicPerformance, 0.95},
		{"Acme Cloud guarantees 99.99% uptime SLA backed by service credits", TopicReliability, 0.96},
		{"Acme Cloud storage costs $0.023/GB/month, 40% below industry average", TopicPricing, 0.90},
		{"Acme Cloud achieves SOC 2 Type II and ISO 27001 with zero audit findings", TopicSecurity, 0.93},
	}

	vendorIDs := make([]uuid.UUID, len(vendorClaims))
	for i, claim := range vendorClaims {
		result, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "vendor:acme-cloud",
			Labels:     []string{"official", "spec"},
			Vector:     TopicVector(claim.topic, 1),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-24 * time.Hour),
			MemType:    advanced.MemorySemantic,
		})
		if err != nil {
			return fmt.Errorf("write vendor claim %d: %w", i, err)
		}
		vendorIDs[i] = result.NodeID
	}

	// ── Analyst claims (high confidence, mostly backs the vendor) ──

	analystClaims := []struct {
		content    string
		topic      string
		confidence float64
	}{
		{"Gartner rates Acme Cloud as Leader with strong latency in US-East and EU-West", TopicPerformance, 0.88},
		{"Acme Cloud uptime tracked at 99.95% over trailing 12 months per Gartner monitoring", TopicReliability, 0.87},
		{"Acme Cloud pricing is competitive but egress fees add 15-20% to effective cost", TopicPricing, 0.85},
		{"Acme Cloud security posture rated above average, minor gap in key rotation automation", TopicSecurity, 0.83},
	}

	analystIDs := make([]uuid.UUID, len(analystClaims))
	for i, claim := range analystClaims {
		result, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "analyst:gartner",
			Labels:     []string{"analyst", "report"},
			Vector:     TopicVector(claim.topic, 2),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-12 * time.Hour),
			MemType:    advanced.MemorySemantic,
		})
		if err != nil {
			return fmt.Errorf("write analyst claim %d: %w", i, err)
		}
		analystIDs[i] = result.NodeID
	}

	// ── Engineer claims (respected peer with real benchmark data — contradicts vendor) ──

	engineerClaims := []struct {
		content        string
		topic          string
		confidence     float64
		contradictsIdx int // index into vendorIDs, -1 if none
	}{
		{"Measured Acme Cloud P99 latency at 47ms in US-West and 62ms in AP-Southeast under production load (n=2M requests)", TopicPerformance, 0.91, 0},
		{"Acme Cloud experienced 4 outages totaling 11.2 hours in Q1, actual uptime 99.48% — well below SLA", TopicReliability, 0.89, 1},
		{"With egress and cross-region transfer, effective Acme Cloud cost is $0.041/GB — 78% above listed price", TopicPricing, 0.87, 2},
		{"Acme Cloud API keys are rotatable but rotation causes 30-60s of rejected requests — not zero-downtime", TopicSecurity, 0.84, 3},
	}

	engineerIDs := make([]uuid.UUID, len(engineerClaims))
	for i, claim := range engineerClaims {
		result, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "engineer:jane-chen",
			Labels:     []string{"benchmark", "data"},
			Vector:     TopicVector(claim.topic, 3),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-6 * time.Hour),
			MemType:    advanced.MemorySemantic,
		})
		if err != nil {
			return fmt.Errorf("write engineer claim %d: %w", i, err)
		}
		engineerIDs[i] = result.NodeID
	}

	// ── Blog claims (random dev, anecdotal, some align with engineer) ──

	blogClaims := []struct {
		content    string
		topic      string
		confidence float64
	}{
		{"My Acme Cloud latency is fine for CRUD apps but spikes to 200ms+ during their maintenance windows", TopicPerformance, 0.45},
		{"We had two unplanned outages on Acme Cloud last month, support took 3 hours to respond", TopicReliability, 0.40},
		{"Acme Cloud is cheap until you need to move data out, then the bill doubles", TopicPricing, 0.42},
		{"I just use Acme Cloud defaults for security, seems fine, never had an incident", TopicSecurity, 0.35},
	}

	for i, claim := range blogClaims {
		_, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "blog:random-dev",
			Labels:     []string{"anecdotal", "blog"},
			Vector:     TopicVector(claim.topic, 4),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-2 * time.Hour),
			MemType:    advanced.MemorySemantic,
		})
		if err != nil {
			return fmt.Errorf("write blog claim %d: %w", i, err)
		}
	}

	// ── Community claims (mixed, some noise) ──

	communityClaims := []struct {
		content    string
		topic      string
		confidence float64
	}{
		{"Thread consensus: Acme latency is region-dependent, US-East is great, AP-Southeast is rough", TopicPerformance, 0.55},
		{"Multiple commenters report Acme uptime issues in Q1, one links to status page showing 99.5%", TopicReliability, 0.52},
	}

	for i, claim := range communityClaims {
		_, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "community:hn-thread",
			Labels:     []string{"discussion", "community"},
			Vector:     TopicVector(claim.topic, 5),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-1 * time.Hour),
			MemType:    advanced.MemorySemantic,
		})
		if err != nil {
			return fmt.Errorf("write community claim %d: %w", i, err)
		}
	}

	// ── Contradiction edges: engineer vs. vendor (data vs. spec sheet) ──

	for i, claim := range engineerClaims {
		if claim.contradictsIdx >= 0 {
			edge := advanced.Edge{
				Src:    engineerIDs[i],
				Dst:    vendorIDs[claim.contradictsIdx],
				Type:   advanced.EdgeContradicts,
				Weight: 0.85,
			}
			if err := ns.AddEdge(ctx, edge); err != nil {
				return fmt.Errorf("add engineer-vendor contradiction %d: %w", i, err)
			}
		}
	}

	// ── Support edges: analyst partially supports vendor ──

	supportPairs := [][2]int{{0, 0}, {3, 3}} // perf and security
	for _, pair := range supportPairs {
		edge := advanced.Edge{
			Src:    analystIDs[pair[0]],
			Dst:    vendorIDs[pair[1]],
			Type:   advanced.EdgeSupports,
			Weight: 0.7,
		}
		if err := ns.AddEdge(ctx, edge); err != nil {
			return fmt.Errorf("add analyst-vendor support: %w", err)
		}
	}

	// ── Analyst reliability claim also conflicts with vendor (99.95% vs 99.99%) ──

	edge := advanced.Edge{
		Src:    analystIDs[1],
		Dst:    vendorIDs[1],
		Type:   advanced.EdgeContradicts,
		Weight: 0.5,
	}
	if err := ns.AddEdge(ctx, edge); err != nil {
		return fmt.Errorf("add analyst-vendor reliability contradiction: %w", err)
	}

	return nil
}
