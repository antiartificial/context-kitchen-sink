import { useState, useEffect } from "react";
import { SCENARIOS } from "./scenarioData";
import BeforeAfter from "./BeforeAfter";
import DisambiguationGraph from "./DisambiguationGraph";
import ProvenanceGraph from "./ProvenanceGraph";
import ArchitectureDiagram from "./ArchitectureDiagram";

interface ScenariosTabProps {
  initialScenario?: string;
}

const NAV_ICONS: Record<string, string> = {
  disambiguation: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
  temporal: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  credibility: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  contradiction: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  provenance: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.086-9.086a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 006.364 6.364l1.757-1.757",
  erasure: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  gaps: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
};

export default function ScenariosTab({ initialScenario }: ScenariosTabProps) {
  const [activeId, setActiveId] = useState(initialScenario || "disambiguation");
  const [showArch, setShowArch] = useState(false);

  useEffect(() => {
    if (initialScenario) setActiveId(initialScenario);
  }, [initialScenario]);

  const active = SCENARIOS.find(s => s.id === activeId) || SCENARIOS[0];

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
        <h2 className="text-lg font-bold text-gray-100 mb-1">Why contextdb?</h2>
        <p className="text-[11px] text-gray-500 leading-relaxed max-w-2xl">
          Vector similarity finds what's related. contextdb tells you what's
          trustworthy, what contradicts, what's expired, and what's missing.
          Toggle between pgvector and contextdb on each scenario to see the
          transformation.
        </p>
      </div>

      {/* Mobile: horizontal pill nav */}
      <div className="lg:hidden overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1.5 pb-1">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeId === s.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {s.title}
            </button>
          ))}
          <button
            onClick={() => { setShowArch(!showArch); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              showArch
                ? "bg-green-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Architecture
          </button>
        </div>
      </div>

      {/* Desktop: sidebar + content */}
      <div className="hidden lg:flex min-h-[500px] bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0 border-r border-gray-800 py-2 flex flex-col">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveId(s.id); setShowArch(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-all inline-flex items-center gap-2 ${
                activeId === s.id && !showArch
                  ? "bg-indigo-500/10 text-white border-r-2 border-indigo-500 font-medium"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={NAV_ICONS[s.id] || ""} />
              </svg>
              {s.title}
            </button>
          ))}
          <div className="border-t border-gray-800 mt-2 pt-2">
            <button
              onClick={() => setShowArch(true)}
              className={`w-full text-left px-4 py-2 text-sm transition-all inline-flex items-center gap-2 ${
                showArch
                  ? "bg-green-500/10 text-white border-r-2 border-green-500 font-medium"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
              </svg>
              Architecture
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {showArch ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-100">How It Fits Together</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                contextdb is a library, not a separate service. It wraps your existing
                storage backend and adds temporal awareness, source tracking, and graph
                reasoning on top. No new infrastructure to deploy.
              </p>
              <ArchitectureDiagram />
            </div>
          ) : (
            <ScenarioView scenario={active} />
          )}
        </div>
      </div>

      {/* Mobile content */}
      <div className="lg:hidden">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          {showArch ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-100">How It Fits Together</h3>
              <ArchitectureDiagram />
            </div>
          ) : (
            <ScenarioView scenario={active} />
          )}
        </div>
      </div>
    </div>
  );
}

function ScenarioView({ scenario }: { scenario: typeof SCENARIOS[number] }) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={scenario.icon} />
          </svg>
          <h3 className="text-lg font-semibold text-gray-100">{scenario.title}</h3>
        </div>
        <p className="text-sm text-gray-400">{scenario.headline}</p>
      </div>

      {/* Before/After interactive */}
      <BeforeAfter scenario={scenario} />

      {/* Diagram (scenario-specific) */}
      {scenario.id === "disambiguation" && (
        <>
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-400">How labels separate meaning</h4>
            <DisambiguationGraph />
          </div>
          <LabelingGuide />
        </>
      )}

      {scenario.id === "provenance" && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400">Evidence chain visualization</h4>
          <ProvenanceGraph />
        </div>
      )}

      {scenario.id === "temporal" && <TemporalDiagram />}
      {scenario.id === "credibility" && <CredibilityDiagram />}
      {scenario.id === "contradiction" && <ContradictionDiagram />}
      {scenario.id === "erasure" && <ErasureDiagram />}
      {scenario.id === "gaps" && <GapsDiagram />}
    </div>
  );
}

function TemporalDiagram() {
  const versions = [
    { label: "v1", x: 10, age: "2 years ago", opacity: 0.15, detail: "pip install acme-sdk==1.0", status: "expired" },
    { label: "v2", x: 33, age: "6 months ago", opacity: 0.3, detail: "pip install acme-sdk==2.0", status: "decayed" },
    { label: "v3", x: 60, age: "2 months ago", opacity: 0.55, detail: "import acme from 'acme-sdk'", status: "fading" },
    { label: "v4", x: 88, age: "2 days ago", opacity: 1, detail: "replace init() with connect()", status: "current" },
  ];
  const statusColors: Record<string, string> = {
    expired: "text-red-500/50",
    decayed: "text-orange-400/50",
    fading: "text-yellow-400/60",
    current: "text-green-400",
  };
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-400">Temporal decay in action</h4>
      <div className="bg-gray-950 rounded-lg border border-gray-800 p-4">
        {/* Timeline */}
        <div className="relative w-full h-32">
          <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Timeline axis */}
            <line x1="5" y1="22" x2="95" y2="22" stroke="rgb(55, 65, 81)" strokeWidth="0.4" />
            {/* Arrow tip */}
            <polygon points="95,22 93,20.5 93,23.5" fill="rgb(55, 65, 81)" />

            {/* Decay gradient zones */}
            <defs>
              <linearGradient id="decayGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.1" />
                <stop offset="50%" stopColor="rgb(234, 179, 8)" stopOpacity="0.05" />
                <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <rect x="5" y="14" width="90" height="16" rx="2" fill="url(#decayGrad)" />

            {/* Version nodes */}
            {versions.map((v, i) => (
              <g key={i} opacity={v.opacity} className="transition-opacity duration-500">
                <circle cx={v.x} cy={22} r="4.5" fill="rgba(99, 102, 241, 0.3)" stroke="rgb(129, 140, 248)" strokeWidth="0.4" />
                <text x={v.x} y={22.5} textAnchor="middle" dominantBaseline="central" className="fill-white text-[3px] font-bold">
                  {v.label}
                </text>
                <text x={v.x} y={34} textAnchor="middle" className="fill-gray-500 text-[2.3px]">
                  {v.age}
                </text>
                <text x={v.x} y={38} textAnchor="middle" className={`text-[1.8px] ${statusColors[v.status]}`}>
                  {v.status}
                </text>
                {/* Detail text above */}
                <text x={v.x} y={13} textAnchor="middle" className="fill-gray-400 text-[1.8px]">
                  {v.detail}
                </text>
              </g>
            ))}

            {/* Labels */}
            <text x="7" y="46" className="fill-red-400/40 text-[2.2px]">past</text>
            <text x="92" y="46" textAnchor="end" className="fill-green-400/60 text-[2.2px]">now</text>
          </svg>
        </div>

        {/* Retention bars */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {versions.map(v => (
            <div key={v.label} className="text-center">
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden mx-2">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${v.opacity * 100}%`, opacity: v.opacity }} />
              </div>
              <span className="text-[9px] text-gray-600">{v.label}: {(v.opacity * 100).toFixed(0)}% retained</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-gray-600 text-center">
        Older versions decay naturally. No manual cleanup, no version-pinning logic. Query with as_of to time-travel.
      </p>
    </div>
  );
}

function CredibilityDiagram() {
  const sources = [
    { label: "Independent benchmark", credibility: 0.91, bar: "bg-green-500", validated: 3 },
    { label: "User reports", credibility: 0.72, bar: "bg-blue-500", validated: 1 },
    { label: "Vendor marketing", credibility: 0.34, bar: "bg-red-500", validated: 0 },
  ];
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-400">Source credibility scores</h4>
      <div className="space-y-2">
        {sources.map(s => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 w-36 flex-shrink-0">{s.label}</span>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${s.bar} transition-all duration-500`} style={{ width: `${s.credibility * 100}%` }} />
            </div>
            <span className="text-[10px] text-gray-500 font-mono w-10 text-right">{(s.credibility * 100).toFixed(0)}%</span>
            <span className="text-[9px] text-gray-600">{s.validated > 0 ? `${s.validated}x validated` : "unverified"}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-600 text-center">
        Credibility updates via Bayesian inference as claims are validated or refuted.
      </p>
    </div>
  );
}

function ContradictionDiagram() {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-400">Conflict detection</h4>
      <div className="relative w-full aspect-[3/1] bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
        <svg viewBox="0 0 100 30" className="w-full h-full">
          {/* Claim nodes */}
          <rect x="2" y="8" width="28" height="10" rx="2" fill="rgba(34, 197, 94, 0.1)" stroke="rgb(34, 197, 94)" strokeWidth="0.3" />
          <text x="16" y="13" textAnchor="middle" className="fill-green-400 text-[2px]">Phase 3 trial</text>
          <text x="16" y="16" textAnchor="middle" className="fill-green-400/60 text-[1.8px]">89% efficacy</text>

          <rect x="36" y="8" width="28" height="10" rx="2" fill="rgba(239, 68, 68, 0.1)" stroke="rgb(239, 68, 68)" strokeWidth="0.3" strokeDasharray="1,0.5" />
          <text x="50" y="13" textAnchor="middle" className="fill-red-400 text-[2px]">Retracted study</text>
          <text x="50" y="16" textAnchor="middle" className="fill-red-400/60 text-[1.8px]">94% (fabricated)</text>

          <rect x="70" y="8" width="28" height="10" rx="2" fill="rgba(59, 130, 246, 0.1)" stroke="rgb(59, 130, 246)" strokeWidth="0.3" />
          <text x="84" y="13" textAnchor="middle" className="fill-blue-400 text-[2px]">FDA advisory</text>
          <text x="84" y="16" textAnchor="middle" className="fill-blue-400/60 text-[1.8px]">78-85% range</text>

          {/* Contradiction edge */}
          <line x1="30" y1="13" x2="36" y2="13" stroke="rgb(239, 68, 68)" strokeWidth="0.5" strokeDasharray="1,0.5" />
          <text x="33" y="11" textAnchor="middle" className="fill-red-400 text-[1.5px]">contradicts</text>

          {/* Support edge */}
          <path d="M 16 18 Q 16 25, 84 18" fill="none" stroke="rgb(34, 197, 94)" strokeWidth="0.3" strokeDasharray="1.5,1" />
          <text x="50" y="25" textAnchor="middle" className="fill-green-400/50 text-[1.5px]">corroborates range</text>
        </svg>
      </div>
      <p className="text-[10px] text-gray-600 text-center">
        Contradictions are explicit edges. Retracted sources cascade, down-ranking all their claims.
      </p>
    </div>
  );
}

function ErasureDiagram() {
  const steps = [
    { label: "Source deleted", icon: "user", color: "text-red-400", bg: "bg-red-500/10" },
    { label: "3 vectors erased", icon: "vectors", color: "text-red-400", bg: "bg-red-500/10" },
    { label: "4 edges removed", icon: "edges", color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "2 derived claims retracted", icon: "claims", color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Erasure receipt logged", icon: "receipt", color: "text-green-400", bg: "bg-green-500/10" },
  ];
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-400">Cascading erasure</h4>
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`${step.bg} border border-gray-800 rounded px-2 py-1.5 text-center`}>
              <span className={`text-[10px] ${step.color} block`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <svg className="w-3 h-3 text-gray-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-600 text-center">
        One API call. Everything downstream is cleaned up, with a compliance-ready audit trail.
      </p>
    </div>
  );
}

function LabelingGuide() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
      >
        <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        How do I choose labels? Show the insertion process
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* The mental model */}
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 space-y-3">
            <h5 className="text-xs font-medium text-gray-200">Thinking about labels</h5>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Labels answer the question: <em className="text-gray-300">"If someone searches for this and gets the wrong thing,
              what category would have prevented the mistake?"</em> Start with the broadest distinction that matters.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-900 rounded px-3 py-2">
                <span className="text-[10px] text-indigo-400 font-medium block mb-1">Domain</span>
                <p className="text-[10px] text-gray-400">What world does this belong to?</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {["ai", "recipe", "finance", "medical"].map(l => (
                    <span key={l} className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[9px] font-mono">{l}</span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900 rounded px-3 py-2">
                <span className="text-[10px] text-green-400 font-medium block mb-1">Topic</span>
                <p className="text-[10px] text-gray-400">What specific subject within the domain?</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {["reasoning", "dessert", "pricing", "efficacy"].map(l => (
                    <span key={l} className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-300 text-[9px] font-mono">{l}</span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900 rounded px-3 py-2">
                <span className="text-[10px] text-amber-400 font-medium block mb-1">Entity</span>
                <p className="text-[10px] text-gray-400">What specific thing or project?</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {["openai", "strawberry-cake", "acme-cloud", "trial-phase-3"].map(l => (
                    <span key={l} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[9px] font-mono">{l}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded px-3 py-2">
              <p className="text-[10px] text-indigo-300/80 leading-relaxed">
                <strong>Rule of thumb:</strong> 2-4 labels per record. One domain, one topic, optional entity.
                You don't need to get it perfect upfront. Labels can be added later, and queries can combine them.
              </p>
            </div>
          </div>

          {/* What the insertion looks like */}
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 space-y-3">
            <h5 className="text-xs font-medium text-gray-200">What insertion looks like</h5>

            <div className="space-y-3">
              {/* Record 1 */}
              <div className="border border-gray-800 rounded px-3 py-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] text-gray-600 uppercase tracking-wider">Record 1</span>
                  <div className="flex gap-1">
                    {["ai", "openai", "reasoning"].map(l => (
                      <span key={l} className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[9px] font-mono">{l}</span>
                    ))}
                  </div>
                </div>
                <pre className="text-[10px] font-mono text-gray-400 leading-relaxed whitespace-pre-wrap">{`ns.Write(ctx, client.WriteRequest{
  Content:    "Project Strawberry is OpenAI's reasoning research initiative",
  SourceID:   "source:arxiv-papers",
  Labels:     []string{"ai", "openai", "reasoning"},
  Confidence: 0.92,
})`}</pre>
              </div>

              {/* Record 2 */}
              <div className="border border-gray-800 rounded px-3 py-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] text-gray-600 uppercase tracking-wider">Record 2</span>
                  <div className="flex gap-1">
                    {["recipe", "dessert", "strawberry"].map(l => (
                      <span key={l} className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300 text-[9px] font-mono">{l}</span>
                    ))}
                  </div>
                </div>
                <pre className="text-[10px] font-mono text-gray-400 leading-relaxed whitespace-pre-wrap">{`ns.Write(ctx, client.WriteRequest{
  Content:    "Classic strawberry shortcake uses fresh berries and whipped cream",
  SourceID:   "source:recipe-blog",
  Labels:     []string{"recipe", "dessert", "strawberry"},
  Confidence: 0.88,
})`}</pre>
              </div>

              {/* The query */}
              <div className="border border-indigo-500/30 bg-indigo-500/5 rounded px-3 py-2">
                <span className="text-[9px] text-indigo-400 uppercase tracking-wider block mb-1.5">Query with label filter</span>
                <pre className="text-[10px] font-mono text-indigo-300/80 leading-relaxed whitespace-pre-wrap">{`// Only AI-related results — recipes filtered out
search "strawberry" | where labels = "ai" | top 5`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GapsDiagram() {
  const areas = [
    { label: "Efficacy", coverage: 0.92, color: "bg-green-500", status: "Well covered" },
    { label: "Safety", coverage: 0.71, color: "bg-blue-500", status: "Adequate" },
    { label: "Dosing", coverage: 0.34, color: "bg-yellow-500", status: "Sparse" },
    { label: "Drug interactions", coverage: 0.08, color: "bg-red-500", status: "Critical gap" },
    { label: "Long-term effects", coverage: 0.15, color: "bg-red-500", status: "Insufficient" },
  ];
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-400">Coverage map</h4>
      <div className="space-y-1.5">
        {areas.map(a => (
          <div key={a.label} className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 w-28 flex-shrink-0">{a.label}</span>
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${a.color}`} style={{ width: `${a.coverage * 100}%` }} />
            </div>
            <span className="text-[10px] text-gray-500 font-mono w-8 text-right">{(a.coverage * 100).toFixed(0)}%</span>
            <span className={`text-[9px] w-20 ${a.coverage < 0.3 ? "text-red-400" : a.coverage < 0.6 ? "text-yellow-400" : "text-gray-500"}`}>
              {a.status}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-600 text-center">
        Gap detection reveals where your knowledge base is thin, stale, or dependent on a single source.
      </p>
    </div>
  );
}
