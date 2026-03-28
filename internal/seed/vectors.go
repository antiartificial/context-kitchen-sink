package seed

import (
	"hash/fnv"
	"math"
	"math/rand"
)

// Topic constants for vector generation
const (
	TopicEconomics        = "economics"
	TopicHealth           = "health"
	TopicSpace            = "space"
	TopicEnergy           = "energy"
	TopicAuth             = "auth"
	TopicRefactor         = "refactor"
	TopicTesting          = "testing"
	TopicDeploy           = "deploy"
	TopicPharmaEfficacy   = "pharma_efficacy"
	TopicPharmaSafety     = "pharma_safety"
	TopicPharmaDosage     = "pharma_dosage"
	TopicPharmaInteraction = "pharma_interaction"
	TopicPharmaTrial      = "pharma_trial"
	TopicGeneralScience   = "general_science"
	TopicGeneralHistory   = "general_history"
	TopicGeneralTech      = "general_tech"
	TopicGeneralCulture   = "general_culture"
	TopicGeneralPolitics  = "general_politics"
)

// TopicVector generates a deterministic 128-dimensional unit vector for a given topic and variant.
// Same topic with different variants will have cosine similarity ~0.5-0.7.
// Different topics will be near-orthogonal.
func TopicVector(topic string, variant int) []float32 {
	const dim = 128
	const perturbScale = 0.3

	// Create deterministic seed from topic string
	h := fnv.New64a()
	h.Write([]byte(topic))
	baseSeed := int64(h.Sum64())

	// Generate base vector for this topic
	rng := rand.New(rand.NewSource(baseSeed))
	base := make([]float32, dim)
	for i := 0; i < dim; i++ {
		// Sample from standard normal N(0,1)
		base[i] = float32(rng.NormFloat64())
	}

	// Normalize base to unit vector
	base = normalize(base)

	// If variant is 0, return the base vector
	if variant == 0 {
		return base
	}

	// For variants, add small perturbation
	variantRng := rand.New(rand.NewSource(baseSeed + int64(variant)))
	perturbed := make([]float32, dim)
	for i := 0; i < dim; i++ {
		perturbation := perturbScale * float32(variantRng.NormFloat64())
		perturbed[i] = base[i] + perturbation
	}

	// Re-normalize to unit vector
	return normalize(perturbed)
}

// normalize returns a unit vector (L2 norm = 1)
func normalize(v []float32) []float32 {
	var sumSq float64
	for _, x := range v {
		sumSq += float64(x * x)
	}
	norm := math.Sqrt(sumSq)
	if norm < 1e-10 {
		norm = 1.0 // Avoid division by zero
	}

	result := make([]float32, len(v))
	for i, x := range v {
		result[i] = float32(float64(x) / norm)
	}
	return result
}
