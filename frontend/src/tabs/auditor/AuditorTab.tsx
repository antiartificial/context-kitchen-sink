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
  { id: "narrative",       label: "Narrative",       short: "Narrative",  icon: "N" },
  { id: "belief-diff",     label: "Belief Diff",     short: "Diff",       icon: "D" },
  { id: "gaps",            label: "Knowledge Gaps",  short: "Gaps",       icon: "G" },
  { id: "calibration",     label: "Calibration",     short: "Calib",      icon: "C" },
  { id: "retract",         label: "Retract Source",   short: "Retract",    icon: "R" },
  { id: "gdpr",            label: "GDPR Erasure",    short: "GDPR",       icon: "E" },
  { id: "active-learning", label: "Active Learning", short: "Learn",      icon: "L" },
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
              className={`w-full text-left px-4 py-2 text-sm transition-all ${
                activeView === item.id
                  ? "bg-[#6366f1]/10 text-white border-r-2 border-[#6366f1] font-medium"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              } ${glowView === item.id ? "animate-tab-glow" : ""}`}
            >
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
