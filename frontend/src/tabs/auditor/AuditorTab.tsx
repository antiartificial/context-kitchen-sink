import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../api";
import type { AuditorNode } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import NarrativeView from "./NarrativeView";
import BeliefDiffView from "./BeliefDiffView";
import GapsView from "./GapsView";
import CalibrationView from "./CalibrationView";
import RetractPanel from "./RetractPanel";
import GDPRErasure from "./GDPRErasure";
import ActiveLearning from "./ActiveLearning";

type SubView =
  | "narrative"
  | "belief-diff"
  | "gaps"
  | "calibration"
  | "retract"
  | "gdpr"
  | "active-learning";

const navItems: { id: SubView; label: string; short: string; icon: string }[] = [
  { id: "narrative",       label: "Narrative",       short: "Narrative",  icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { id: "belief-diff",     label: "Belief Diff",     short: "Diff",       icon: "M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" },
  { id: "gaps",            label: "Knowledge Gaps",  short: "Gaps",       icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" },
  { id: "calibration",     label: "Calibration",     short: "Calib",      icon: "M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" },
  { id: "retract",         label: "Retract Source",   short: "Retract",    icon: "M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.374-6.375a1.125 1.125 0 010-1.59L9.42 4.83a1.125 1.125 0 011.59 0l6.375 6.375a1.125 1.125 0 010 1.59l-6.375 6.375a1.125 1.125 0 01-1.59 0z" },
  { id: "gdpr",            label: "GDPR Erasure",    short: "GDPR",       icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
  { id: "active-learning", label: "Active Learning", short: "Learn",      icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" },
];

export default function AuditorTab() {
  const [nodes, setNodes] = useState<AuditorNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<SubView>("narrative");
  const [isResetting, setIsResetting] = useState(false);
  const [glowView, setGlowView] = useState<SubView | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ nodes: AuditorNode[] }>("/auditor/nodes");
      setNodes(data.nodes ?? []);
    } catch (err) {
      console.error("Failed to fetch auditor nodes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNodes(); }, []);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.post("/auditor/reset");
      await fetchNodes();
    } finally {
      setIsResetting(false);
    }
  };

  const handleDataChange = () => { fetchNodes(); };

  const switchView = (id: SubView) => {
    setActiveView(id);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hintView = useCallback((view: SubView) => {
    setGlowView(view);
    setTimeout(() => setGlowView(null), 1600);
  }, []);

  const goTo = useCallback((view: SubView) => {
    setActiveView(view);
    hintView(view);
  }, [hintView]);

  const activeLabel = navItems.find((n) => n.id === activeView)?.label;

  return (
    <div className="space-y-3">
      {/* Executive summary + interactive synopsis */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-100">Auditor</h2>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded text-xs font-medium transition-colors"
          >
            {isResetting ? "..." : "Reset"}
          </button>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
          A drug trial publishes promising results. A meta-analysis agrees. Then the
          lead researcher's earlier study is retracted for fabricated data. The FDA
          issues a cautious advisory, and patients report mixed real-world outcomes.
          How do you decide what to trust, and how do you <em>prove</em> your
          reasoning is sound?
        </p>
        <p className="text-xs text-gray-400 leading-relaxed mb-2">
          <strong className="text-gray-300">Scenario:</strong> Evaluating a pharma trial
          across 25 claims from 5 sources (trial, meta-analysis, withdrawn study, FDA,
          patient reports).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
          <LegendItem view="narrative" onClick={() => goTo("narrative")}>
            Explain any claim with its full evidence chain
          </LegendItem>
          <LegendItem view="belief-diff" onClick={() => goTo("belief-diff")}>
            Surface contradictions between sources
          </LegendItem>
          <LegendItem view="gaps" onClick={() => goTo("gaps")}>
            Find blind spots and outdated evidence
          </LegendItem>
          <LegendItem view="calibration" onClick={() => goTo("calibration")}>
            Check if confidence scores match reality
          </LegendItem>
          <LegendItem view="retract" onClick={() => goTo("retract")}>
            Remove a discredited source and cascade
          </LegendItem>
          <LegendItem view="gdpr" onClick={() => goTo("gdpr")}>
            Regulatory-compliant data deletion
          </LegendItem>
          <LegendItem view="active-learning" onClick={() => goTo("active-learning")}>
            Prioritize where to investigate next
          </LegendItem>
        </div>
      </div>

      {/* Mobile: horizontal scrollable pill nav */}
      <div className="lg:hidden overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1.5 pb-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => switchView(item.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeView === item.id
                  ? "bg-[#6366f1] text-white shadow-md shadow-indigo-500/20"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              } ${glowView === item.id ? "animate-tab-glow" : ""}`}
            >
              {item.short}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: sidebar + content */}
      <div className="hidden lg:flex min-h-[500px] bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0 border-r border-gray-800 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full text-left px-4 py-2 text-sm transition-all inline-flex items-center gap-2 ${
                activeView === item.id
                  ? "bg-[#6366f1]/10 text-white border-r-2 border-[#6366f1] font-medium"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              } ${glowView === item.id ? "animate-tab-glow" : ""}`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4" ref={scrollRef}>
          <ViewContent
            activeView={activeView}
            loading={loading}
            nodes={nodes}
            onDataChange={handleDataChange}
          />
        </div>
      </div>

      {/* Mobile: content below pills */}
      <div className="lg:hidden" ref={scrollRef}>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-base font-semibold text-gray-100 mb-3">{activeLabel}</h3>
          <ViewContent
            activeView={activeView}
            loading={loading}
            nodes={nodes}
            onDataChange={handleDataChange}
          />
        </div>
      </div>
    </div>
  );
}

function ViewContent({
  activeView,
  loading,
  nodes,
  onDataChange,
}: {
  activeView: SubView;
  loading: boolean;
  nodes: AuditorNode[];
  onDataChange: () => void;
}) {
  if (loading && !["gaps", "calibration", "active-learning"].includes(activeView)) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      {activeView === "narrative" && <NarrativeView nodes={nodes} />}
      {activeView === "belief-diff" && <BeliefDiffView />}
      {activeView === "gaps" && <GapsView />}
      {activeView === "calibration" && <CalibrationView />}
      {activeView === "retract" && <RetractPanel onRetract={onDataChange} />}
      {activeView === "gdpr" && <GDPRErasure onErase={onDataChange} />}
      {activeView === "active-learning" && <ActiveLearning />}
    </>
  );
}

function LegendItem({ view, onClick, children }: {
  view: SubView;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const dotColors: Record<SubView, string> = {
    "narrative":       "bg-indigo-400",
    "belief-diff":     "bg-red-400",
    "gaps":            "bg-yellow-400",
    "calibration":     "bg-green-400",
    "retract":         "bg-orange-400",
    "gdpr":            "bg-blue-400",
    "active-learning": "bg-purple-400",
  };
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-left py-0.5 hover:text-white transition-colors group"
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColors[view]} group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-offset-gray-900 group-hover:ring-current`} />
      <span className="text-[11px]">{children}</span>
    </button>
  );
}
