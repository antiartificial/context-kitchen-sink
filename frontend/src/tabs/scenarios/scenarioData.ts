export interface BeforeAfterItem {
  label: string;
  score: number;
  meta?: string;
  highlight?: boolean;
  dimmed?: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  headline: string;
  before: {
    caption: string;
    items: BeforeAfterItem[];
  };
  after: {
    caption: string;
    items: BeforeAfterItem[];
  };
  insight: string;
  icon: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "disambiguation",
    title: "Disambiguation",
    headline: "Same word, completely different things",
    before: {
      caption: "Vector search for \"strawberry\"",
      items: [
        { label: "Project Strawberry is OpenAI's reasoning research initiative", score: 0.94 },
        { label: "Classic strawberry shortcake uses fresh berries and whipped cream", score: 0.91 },
        { label: "Strawberry fields is a memorial to John Lennon in Central Park", score: 0.88 },
        { label: "OpenAI's Strawberry improves multi-step reasoning in LLMs", score: 0.86 },
        { label: "Strawberry jam requires pectin for proper consistency", score: 0.83 },
      ],
    },
    after: {
      caption: "contextdb: labels + sources separate meaning",
      items: [
        { label: "Project Strawberry is OpenAI's reasoning research initiative", score: 0.94, meta: "ai, openai | source:arxiv", highlight: true },
        { label: "OpenAI's Strawberry improves multi-step reasoning in LLMs", score: 0.86, meta: "ai, reasoning | source:techcrunch", highlight: true },
        { label: "Classic strawberry shortcake uses fresh berries and whipped cream", score: 0.91, meta: "recipe, dessert | source:food-blog", dimmed: true },
        { label: "Strawberry jam requires pectin for proper consistency", score: 0.83, meta: "recipe, cooking | source:food-blog", dimmed: true },
        { label: "Strawberry fields is a memorial to John Lennon in Central Park", score: 0.88, meta: "culture, nyc | source:wikipedia", dimmed: true },
      ],
    },
    insight: "Labels and source tracking let you filter by meaning, not just similarity. Query with labels:[\"ai\"] and recipes vanish.",
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z",
  },
  {
    id: "temporal",
    title: "Time Travel",
    headline: "What was true then vs. what's true now",
    before: {
      caption: "Vector search for \"SDK setup guide\"",
      items: [
        { label: "Install SDK v2: pip install acme-sdk==2.0", score: 0.95 },
        { label: "SDK v4 migration: replace init() with connect()", score: 0.92 },
        { label: "SDK v3 quickstart: import acme from 'acme-sdk'", score: 0.89 },
        { label: "SDK v1 deprecated: use legacy adapter for compat", score: 0.85 },
      ],
    },
    after: {
      caption: "contextdb: only current knowledge surfaces",
      items: [
        { label: "SDK v4 migration: replace init() with connect()", score: 0.92, meta: "valid: now | 2 days old", highlight: true },
        { label: "Install SDK v2: pip install acme-sdk==2.0", score: 0.41, meta: "expired 6 months ago | decayed", dimmed: true },
        { label: "SDK v3 quickstart: import acme from 'acme-sdk'", score: 0.35, meta: "superseded by v4 | decayed", dimmed: true },
        { label: "SDK v1 deprecated: use legacy adapter for compat", score: 0.12, meta: "expired 2 years ago | near-zero", dimmed: true },
      ],
    },
    insight: "Old versions decay naturally. Time-travel with as_of lets you see what the agent believed at any past moment.",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "credibility",
    title: "Source Trust",
    headline: "Not all sources deserve equal weight",
    before: {
      caption: "Vector search for \"Acme Cloud latency\"",
      items: [
        { label: "Acme Cloud delivers sub-10ms P99 latency globally", score: 0.96 },
        { label: "Independent benchmark: Acme P99 is 47ms in eu-west", score: 0.93 },
        { label: "Acme Cloud: fastest infrastructure on the market", score: 0.90 },
        { label: "User report: seeing 120ms spikes during peak hours", score: 0.84 },
      ],
    },
    after: {
      caption: "contextdb: credibility-weighted ranking",
      items: [
        { label: "Independent benchmark: Acme P99 is 47ms in eu-west", score: 0.93, meta: "credibility: 0.91 | verified 3x", highlight: true },
        { label: "User report: seeing 120ms spikes during peak hours", score: 0.84, meta: "credibility: 0.72 | 1 corroboration", highlight: true },
        { label: "Acme Cloud delivers sub-10ms P99 latency globally", score: 0.58, meta: "credibility: 0.34 | contradicted", dimmed: true },
        { label: "Acme Cloud: fastest infrastructure on the market", score: 0.41, meta: "credibility: 0.22 | marketing copy", dimmed: true },
      ],
    },
    insight: "Source credibility updates via Bayesian inference. Each validation or refutation shifts trust scores, and claims from untrusted sources sink.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    id: "contradiction",
    title: "Contradictions",
    headline: "When your data disagrees with itself",
    before: {
      caption: "Vector search for \"trial efficacy rate\"",
      items: [
        { label: "Phase 3 trial shows 89% efficacy rate", score: 0.95 },
        { label: "Meta-analysis confirms 87% efficacy across studies", score: 0.93 },
        { label: "Retracted study reported 94% efficacy (fabricated data)", score: 0.91 },
        { label: "FDA advisory: efficacy likely between 78-85%", score: 0.88 },
      ],
    },
    after: {
      caption: "contextdb: contradictions surfaced automatically",
      items: [
        { label: "Phase 3 trial shows 89% efficacy rate", score: 0.93, meta: "supports: meta-analysis | no conflicts", highlight: true },
        { label: "FDA advisory: efficacy likely between 78-85%", score: 0.88, meta: "caution flag | credible source", highlight: true },
        { label: "Retracted study reported 94% efficacy (fabricated data)", score: 0.21, meta: "CONTRADICTS trial | source retracted", dimmed: true },
        { label: "Meta-analysis confirms 87% efficacy across studies", score: 0.87, meta: "supports: trial | 2 evidence edges", highlight: true },
      ],
    },
    insight: "Contradiction edges and retraction cascades mean fabricated or conflicting claims are automatically flagged and down-ranked.",
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  },
  {
    id: "provenance",
    title: "Provenance",
    headline: "Show your work, not just your answer",
    before: {
      caption: "Vector search returns a claim",
      items: [
        { label: "Compound X reduces inflammation by 40% in joint tissue", score: 0.94 },
      ],
    },
    after: {
      caption: "contextdb: the full evidence chain",
      items: [
        { label: "Compound X reduces inflammation by 40% in joint tissue", score: 0.94, meta: "claim", highlight: true },
        { label: "  supports: Phase 2 trial (n=340, double-blind)", score: 0.91, meta: "evidence", highlight: true },
        { label: "  supports: In-vitro study by Chen et al. 2024", score: 0.85, meta: "evidence", highlight: true },
        { label: "    derived_from: NIH grant #R01-AR-07734", score: 0.82, meta: "source", highlight: true },
        { label: "  contradicts: Earlier pilot (n=28, open-label)", score: 0.45, meta: "weak counter-evidence", dimmed: true },
      ],
    },
    insight: "Every claim traces back through supports, derives_from, and contradicts edges to its original sources. Auditable by design.",
    icon: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.086-9.086a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 006.364 6.364l1.757-1.757",
  },
  {
    id: "erasure",
    title: "Right to Forget",
    headline: "Delete a source, cascade everything it touched",
    before: {
      caption: "pgvector: delete vectors, orphans remain",
      items: [
        { label: "Deleted: 3 vectors from source user-x", score: 0, meta: "removed" },
        { label: "Orphaned: 2 claims derived from deleted source", score: 0.87, meta: "still retrievable" },
        { label: "Orphaned: 1 edge referencing deleted node", score: 0, meta: "dangling pointer" },
        { label: "Orphaned: audit log still references source", score: 0, meta: "compliance gap" },
      ],
    },
    after: {
      caption: "contextdb: cascading erasure",
      items: [
        { label: "Erased: 3 source nodes + vectors", score: 0, meta: "redacted", highlight: true },
        { label: "Cascade: 2 derived claims invalidated", score: 0, meta: "retracted automatically", highlight: true },
        { label: "Cascade: 4 edges removed", score: 0, meta: "graph cleaned", highlight: true },
        { label: "Audit: erasure receipt with timestamp + scope", score: 0, meta: "GDPR-compliant log", highlight: true },
      ],
    },
    insight: "GDPR Article 17 requires complete erasure. contextdb cascades deletions through the graph so no orphaned references survive.",
    icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  },
  {
    id: "gaps",
    title: "Blind Spots",
    headline: "Know what you don't know",
    before: {
      caption: "pgvector: only answers what you ask",
      items: [
        { label: "Query: \"side effects\" -- 4 results returned", score: 0.9 },
        { label: "You don't know what topics have zero coverage", score: 0 },
        { label: "You don't know which areas are going stale", score: 0 },
        { label: "You don't know where confidence is suspiciously low", score: 0 },
      ],
    },
    after: {
      caption: "contextdb: proactive gap detection",
      items: [
        { label: "Confidence gap: drug interactions coverage at 12%", score: 0.12, meta: "critical gap | 0 recent sources", highlight: true },
        { label: "Temporal gap: pediatric dosing data is 2+ years old", score: 0.31, meta: "stale | needs refresh", highlight: true },
        { label: "Source gap: only 1 source covers long-term effects", score: 0.45, meta: "single point of failure", highlight: true },
        { label: "Dense: efficacy data well-covered (8 sources, recent)", score: 0.95, meta: "healthy coverage", dimmed: true },
      ],
    },
    insight: "Gap detection finds sparse embedding regions, stale temporal zones, and single-source dependencies before they become blind spots.",
    icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  },
];

export interface ArchLayer {
  label: string;
  description: string;
  color: string;
}

export const ARCHITECTURE_LAYERS: ArchLayer[] = [
  { label: "Your Application", description: "RAG pipeline, agent, chatbot", color: "rgb(99, 102, 241)" },
  { label: "contextdb", description: "Temporal graph-vector layer", color: "rgb(34, 197, 94)" },
  { label: "Storage Backend", description: "PostgreSQL, SQLite, or embedded", color: "rgb(107, 114, 128)" },
];

export const TRADEOFFS: { gain: string; cost: string }[] = [
  { gain: "Source credibility and trust scoring", cost: "Each write needs a source_id" },
  { gain: "Automatic contradiction detection", cost: "Edges must be declared or inferred" },
  { gain: "Time-travel and temporal decay", cost: "ValidFrom timestamps on all data" },
  { gain: "GDPR-compliant cascading erasure", cost: "Graph overhead vs flat vector store" },
  { gain: "Knowledge gap and blind spot detection", cost: "Label taxonomy requires upfront design" },
  { gain: "Provenance chains for auditability", cost: "More storage than vectors alone" },
];
