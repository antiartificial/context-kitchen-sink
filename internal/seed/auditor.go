package seed

import (
	"context"
	"fmt"
	"time"

	"github.com/antiartificial/contextdb/pkg/advanced"
	"github.com/antiartificial/contextdb/pkg/client"
	"github.com/google/uuid"
)

// SeedAuditor creates a belief system namespace for pharma knowledge with retractions and GDPR erasure targets.
func SeedAuditor(db *client.DB) error {
	ctx := context.Background()
	ns := db.Namespace("auditor", advanced.ModeBeliefSystem)

	// Label the five sources
	if err := ns.LabelSource(ctx, "trial:NCT-2024-001", []string{"clinical_trial", "phase3"}); err != nil {
		return fmt.Errorf("label trial: %w", err)
	}
	if err := ns.LabelSource(ctx, "meta:cochrane-2024", []string{"meta_analysis", "systematic_review"}); err != nil {
		return fmt.Errorf("label meta: %w", err)
	}
	if err := ns.LabelSource(ctx, "study:withdrawn-2023", []string{"withdrawn", "retracted"}); err != nil {
		return fmt.Errorf("label withdrawn: %w", err)
	}
	if err := ns.LabelSource(ctx, "fda:label-2024", []string{"regulatory", "fda_approved"}); err != nil {
		return fmt.Errorf("label fda: %w", err)
	}
	if err := ns.LabelSource(ctx, "patient:user-789", []string{"patient_report", "anecdotal"}); err != nil {
		return fmt.Errorf("label patient: %w", err)
	}

	now := time.Now()

	// Trial claims (high confidence, mostly correct)
	trialClaims := []struct {
		content    string
		confidence float64
		actual     float64
	}{
		{"Drug X reduces primary endpoint events by 42% vs placebo (p<0.001, n=2400)", 0.92, 1.0},
		{"Most common adverse events: headache (12%), nausea (8%), dizziness (5%)", 0.88, 1.0},
		{"Study duration 52 weeks, median follow-up 48 weeks across all sites", 0.90, 1.0},
		{"Patient population: adults 40-75 with moderate to severe condition", 0.89, 1.0},
		{"Secondary endpoints showed 31% improvement in quality of life scores", 0.85, 1.0},
	}

	trialIDs := make([]uuid.UUID, len(trialClaims))
	for i, claim := range trialClaims {
		result, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "trial:NCT-2024-001",
			Labels:     []string{"clinical_trial", "efficacy"},
			Vector:     TopicVector(TopicPharmaEfficacy, i+1),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-180 * 24 * time.Hour),
			MemType:    advanced.MemorySemantic,
			Properties: map[string]any{
				"prediction_outcome": map[string]float64{
					"predicted": claim.confidence,
					"actual":    claim.actual,
				},
			},
		})
		if err != nil {
			return fmt.Errorf("write trial claim %d: %w", i, err)
		}
		trialIDs[i] = result.NodeID
	}

	// Meta-analysis claims (very high confidence, correct)
	metaClaims := []struct {
		content    string
		confidence float64
		actual     float64
	}{
		{"Pooled analysis of 8 RCTs (n=12,450): Drug X efficacy 39% (95% CI: 34-44%)", 0.95, 1.0},
		{"Heterogeneity low (I²=18%), results consistent across studies and populations", 0.93, 1.0},
		{"Number needed to treat (NNT) = 12 for primary endpoint prevention", 0.92, 1.0},
		{"Safety profile: serious adverse events 2.1% vs 1.8% placebo (RR=1.17, p=0.23)", 0.94, 1.0},
		{"Subgroup analysis: efficacy consistent across age, sex, baseline severity", 0.90, 1.0},
	}

	metaIDs := make([]uuid.UUID, len(metaClaims))
	for i, claim := range metaClaims {
		result, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "meta:cochrane-2024",
			Labels:     []string{"meta_analysis", "synthesis"},
			Vector:     TopicVector(TopicPharmaEfficacy, i+10),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-90 * 24 * time.Hour),
			MemType:    advanced.MemorySemantic,
			Properties: map[string]any{
				"prediction_outcome": map[string]float64{
					"predicted": claim.confidence,
					"actual":    claim.actual,
				},
			},
		})
		if err != nil {
			return fmt.Errorf("write meta claim %d: %w", i, err)
		}
		metaIDs[i] = result.NodeID
	}

	// Withdrawn study claims (all incorrect, retraction targets)
	withdrawnClaims := []struct {
		content    string
		confidence float64
	}{
		{"Drug X shows 68% efficacy in preliminary analysis (later found fabricated)", 0.78},
		{"Zero serious adverse events observed in trial cohort (data manipulated)", 0.75},
		{"Composite endpoint reduction of 72% exceeds any previous treatment (false)", 0.80},
		{"Patient adherence rate 98% sustained over 24 months (fabricated logs)", 0.72},
		{"Biomarker improvements in 89% of subjects at week 12 (falsified data)", 0.76},
	}

	withdrawnIDs := make([]uuid.UUID, len(withdrawnClaims))
	for i, claim := range withdrawnClaims {
		result, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "study:withdrawn-2023",
			Labels:     []string{"withdrawn", "fabricated"},
			Vector:     TopicVector(TopicPharmaTrial, i+1),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-365 * 24 * time.Hour),
			MemType:    advanced.MemorySemantic,
			Properties: map[string]any{
				"prediction_outcome": map[string]float64{
					"predicted": claim.confidence,
					"actual":    0.0, // All wrong
				},
			},
		})
		if err != nil {
			return fmt.Errorf("write withdrawn claim %d: %w", i, err)
		}
		withdrawnIDs[i] = result.NodeID
	}

	// FDA label claims (high confidence, correct)
	fdaClaims := []struct {
		content    string
		confidence float64
		actual     float64
	}{
		{"Approved dosage: 100mg once daily, may increase to 200mg based on response", 0.93, 1.0},
		{"Contraindications: severe hepatic impairment, pregnancy category D", 0.91, 1.0},
		{"Black box warning: increased risk of cardiovascular events in high-risk patients", 0.88, 1.0},
		{"Drug interactions: CYP3A4 substrates may require dose adjustment", 0.89, 1.0},
		{"Renal dose adjustment: reduce to 50mg daily if CrCl <30 mL/min", 0.90, 1.0},
	}

	fdaIDs := make([]uuid.UUID, len(fdaClaims))
	for i, claim := range fdaClaims {
		result, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "fda:label-2024",
			Labels:     []string{"regulatory", "dosage", "safety"},
			Vector:     TopicVector(TopicPharmaDosage, i+1),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-60 * 24 * time.Hour),
			MemType:    advanced.MemorySemantic,
			Properties: map[string]any{
				"prediction_outcome": map[string]float64{
					"predicted": claim.confidence,
					"actual":    claim.actual,
				},
			},
		})
		if err != nil {
			return fmt.Errorf("write fda claim %d: %w", i, err)
		}
		fdaIDs[i] = result.NodeID
	}

	// Patient claims (mixed correctness, GDPR erasure target)
	patientClaims := []struct {
		content    string
		confidence float64
		actual     float64
	}{
		{"Experienced mild headaches first 2 weeks, then resolved completely", 0.55, 1.0},
		{"My symptoms improved about 40% after 3 months on Drug X", 0.50, 1.0},
		{"Had severe nausea and had to stop after 1 week (worse than trial data)", 0.45, 0.0},
		{"No improvement after 6 months, switching to different treatment", 0.52, 0.0},
		{"Felt significant improvement within days (placebo effect likely)", 0.40, 0.0},
	}

	for i, claim := range patientClaims {
		_, err := ns.Write(ctx, client.WriteRequest{
			Content:    claim.content,
			SourceID:   "patient:user-789",
			Labels:     []string{"patient_report", "anecdotal", "gdpr_target"},
			Vector:     TopicVector(TopicPharmaSafety, i+1),
			Confidence: claim.confidence,
			ValidFrom:  now.Add(-30 * 24 * time.Hour),
			MemType:    advanced.MemoryEpisodic,
			Properties: map[string]any{
				"prediction_outcome": map[string]float64{
					"predicted": claim.confidence,
					"actual":    claim.actual,
				},
				"pii_owner": "user-789",
			},
		})
		if err != nil {
			return fmt.Errorf("write patient claim %d: %w", i, err)
		}
	}

	// Add rich edges between claims

	// Meta "supports" trial claims (3 edges)
	supportsEdges := []struct{ metaIdx, trialIdx int }{
		{0, 0}, // Pooled efficacy supports trial efficacy
		{2, 0}, // NNT supports trial endpoint
		{3, 1}, // Safety profile supports adverse events
	}
	for _, e := range supportsEdges {
		edge := advanced.Edge{
			Src:    metaIDs[e.metaIdx],
			Dst:    trialIDs[e.trialIdx],
			Type:   advanced.EdgeSupports,
			Weight: 0.85,
		}
		if err := ns.AddEdge(ctx, edge); err != nil {
			return fmt.Errorf("add supports edge: %w", err)
		}
	}

	// Meta "contradicts" withdrawn claims (2 edges)
	contradictsEdges := []struct{ metaIdx, withdrawnIdx int }{
		{0, 0}, // Pooled 39% contradicts fabricated 68%
		{3, 1}, // Safety profile contradicts zero adverse events
	}
	for _, e := range contradictsEdges {
		edge := advanced.Edge{
			Src:    metaIDs[e.metaIdx],
			Dst:    withdrawnIDs[e.withdrawnIdx],
			Type:   advanced.EdgeContradicts,
			Weight: 0.90,
		}
		if err := ns.AddEdge(ctx, edge); err != nil {
			return fmt.Errorf("add contradicts edge: %w", err)
		}
	}

	// FDA "derives_from" trial and meta (3 edges)
	derivesEdges := []struct {
		fdaIdx    int
		sourceID  uuid.UUID
		sourceIdx int
	}{
		{0, trialIDs[0], 0}, // Dosage from trial
		{1, trialIDs[1], 1}, // Contraindications from adverse events
		{2, metaIDs[3], 3},  // Black box from meta safety
	}
	for _, e := range derivesEdges {
		edge := advanced.Edge{
			Src:    fdaIDs[e.fdaIdx],
			Dst:    e.sourceID,
			Type:   advanced.EdgeDerivedFrom,
			Weight: 0.80,
		}
		if err := ns.AddEdge(ctx, edge); err != nil {
			return fmt.Errorf("add derives edge: %w", err)
		}
	}

	// Trial "cites" meta (1 edge)
	edge := advanced.Edge{
		Src:    trialIDs[0],
		Dst:    metaIDs[0],
		Type:   advanced.EdgeCites,
		Weight: 0.75,
	}
	if err := ns.AddEdge(ctx, edge); err != nil {
		return fmt.Errorf("add cites edge: %w", err)
	}

	// Withdrawn contradicts trial (2 edges)
	withdrawnContradictsEdges := []struct{ withdrawnIdx, trialIdx int }{
		{0, 0}, // 68% fabricated vs 42% real efficacy
		{2, 4}, // 72% composite vs 31% secondary
	}
	for _, e := range withdrawnContradictsEdges {
		edge := advanced.Edge{
			Src:    withdrawnIDs[e.withdrawnIdx],
			Dst:    trialIDs[e.trialIdx],
			Type:   advanced.EdgeContradicts,
			Weight: 0.85,
		}
		if err := ns.AddEdge(ctx, edge); err != nil {
			return fmt.Errorf("add withdrawn contradicts edge: %w", err)
		}
	}

	return nil
}
