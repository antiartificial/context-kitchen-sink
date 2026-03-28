// API Response Types

export interface Source {
  id: string;
  external_id?: string;
  alpha: number;
  beta: number;
  labels?: string[];
  credibility: number;
  variance: number;
  interval_lower: number;
  interval_upper: number;
}

export interface WriteResult {
  node_id: string;
  admitted: boolean;
  reason?: string;
  conflict_ids?: string[];
}

export interface Claim {
  id: string;
  content: string;
  confidence: number;
  epistemic_type: string;
  source_id: string;
  labels?: string[];
  valid_from?: string;
  valid_until?: string;
  admitted: boolean;
  created_at?: string;
  updated_at?: string;
  conflict_ids?: string[];
}

export interface ConflictEdge {
  from_id: string;
  to_id: string;
  edge_type: string;
  strength: number;
}

export interface ConflictCluster {
  nodes: Claim[];
  edges: ConflictEdge[];
  credibility_gap: number;
}

export interface Memory {
  id: string;
  content: string;
  confidence: number;
  mem_type: "episodic" | "semantic" | "procedural" | "working";
  source_id: string;
  labels: string[];
  valid_from: string;
  score: number;
  similarity_score: number;
  confidence_score: number;
  recency_score: number;
  utility_score: number;
  decay_alpha: number;
  created_at?: string;
  accessed_at?: string;
}

export interface TimelinePoint {
  offset_hours: number;
  episodic: number;
  semantic: number;
  procedural: number;
  working: number;
  total: number;
}

export interface NarrativeReport {
  query: string;
  narrative: string;
  supporting_node_ids: string[];
  conflicting_node_ids: string[];
  confidence: number;
  evidence_strength: number;
}

export interface BeliefChange {
  node_id: string;
  content: string;
  old_confidence: number;
  new_confidence: number;
  delta: number;
  reason: string;
}

export interface BeliefDiff {
  added: string[];
  removed: string[];
  strengthened: BeliefChange[];
  weakened: BeliefChange[];
  unchanged_count: number;
}

export interface Gap {
  gap_type: string;
  description: string;
  missing_edges: string[];
  suggested_queries: string[];
  severity: number;
}

export interface GapReport {
  gaps: Gap[];
  gap_count: number;
  coverage_score: number;
}

export interface CalibrationBin {
  predicted_range: string;
  count: number;
  correct: number;
  accuracy: number;
}

export interface CalibrationResult {
  bins: CalibrationBin[];
  overall_score: number;
  overconfident: boolean;
  brier_score: number;
}

export interface RetractResult {
  retracted_node_ids: string[];
  affected_node_ids: string[];
  propagation_depth: number;
}

export interface ErasureReport {
  erased_node_ids: string[];
  erased_edge_count: number;
  redacted_node_ids: string[];
  cascade_depth: number;
}

export interface AcquisitionSuggestion {
  query: string;
  priority: number;
  expected_value: number;
  reason: string;
  gap_types: string[];
  type?: string;
  description?: string;
  related_node_ids?: string[];
  namespace?: string;
}

// Auditor-specific types
export interface AuditorNode {
  id: string;
  content: string;
  confidence: number;
  source_id: string;
  labels: string[];
  epistemic_type: string;
}

export interface CitedClaim {
  node_id: string;
  source_id: string;
  text: string;
  confidence: number;
  relation: string;
}

export interface NarrativeReportDetailed {
  node_id: string;
  summary: string;
  claim: CitedClaim;
  evidence: CitedClaim[];
  contradictions: CitedClaim[];
  provenance: CitedClaim[];
  confidence_explanation: string;
}

export interface BeliefConflict {
  claim_a: { content: string; confidence: number; source_id: string; supporter_count: number };
  claim_b: { content: string; confidence: number; source_id: string; supporter_count: number };
  contradiction_weight: number;
  credibility_gap: number;
}

export interface BeliefDiffDetailed {
  namespace: string;
  conflicts: BeliefConflict[];
  total_conflicts: number;
  avg_credibility_gap: number;
}

export interface KnowledgeGap {
  id: string;
  nearest_topics: string[];
  density_score: number;
  confidence_gap: number;
  temporal_gap_seconds: number;
}

export interface GapReportDetailed {
  namespace: string;
  gaps: KnowledgeGap[];
  coverage_score: number;
  total_nodes: number;
  gaps_detected: number;
}

export interface CalibrationBinDetailed {
  bin_start: number;
  bin_end: number;
  avg_predicted: number;
  avg_actual: number;
  count: number;
}

export interface CalibrationResultDetailed {
  brier_score: number;
  ece: number;
  mce: number;
  bins: CalibrationBinDetailed[];
  platt: { a: number; b: number; fitted: boolean };
  isotonic: { fitted: boolean };
  sample_count: number;
}

export interface RetractResultDetailed {
  nodes_retracted: number;
  cascade_depth: number;
  node_ids: string[];
}

export interface ErasureReportDetailed {
  namespace: string;
  source_id: string;
  nodes_retracted: number;
  vectors_deleted: number;
  edges_invalidated: number;
  events_redacted: number;
}

export interface ReplResultNode {
  id: string;
  content: string;
  labels: string[];
  confidence: number;
  score: number;
  similarity_score: number;
  confidence_score: number;
  recency_score: number;
  utility_score: number;
  source_id: string;
  valid_from: string;
}

export interface ReplResult {
  query: string;
  syntax: string;
  ast?: unknown;
  results: ReplResultNode[];
  error?: string;
  parse_time_us: number;
  execute_time_us: number;
  total_results: number;
}

export interface AuthCheckResponse {
  authenticated: boolean;
}

export interface LoginResponse {
  ok: boolean;
}
