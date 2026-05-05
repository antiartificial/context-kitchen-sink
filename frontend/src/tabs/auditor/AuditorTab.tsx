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

const PILL_COLORS: Record<SubView, string> = {
  "narrative":       "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "belief-diff":     "bg-red-500/20 text-red-400 border-red-500/30",
  "gaps":            "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "calibration":     "bg-green-500/20 text-green-400 border-green-500/30",
  "retract":         "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "gdpr":            "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "active-learning": "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

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
          lead researcher&rsquo;s earlier study is retracted for fabricated data. The FDA
          issues a cautious advisory, and patients report mixed real-world outcomes.
          How do you decide what to trust &mdash; and how do you <em>prove</em> your
          reasoning is sound?
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          <strong className="text-gray-300">Scenario:</strong> Evaluating a pharma trial
          across 25 claims from 5 sources (trial, meta-analysis, withdrawn study, FDA,
          patient reports).{" "}
          <Pill view="narrative" onClick={() => goTo("narrative")}>
            Narrative
          </Pill>{" "}
          explains any claim in plain language with its full evidence chain.{" "}
          <Pill view="belief-diff" onClick={() => goTo("belief-diff")}>
            Belief Diff
          </Pill>{" "}
          surfaces contradictions between sources, like a &ldquo;track changes&rdquo; for
          what&rsquo;s believed vs. what&rsquo;s contested.{" "}
          <Pill view="gaps" onClick={() => goTo("gaps")}>
            Knowledge Gaps
          </Pill>{" "}
          reveals blind spots &mdash; topics with too little data or outdated evidence.{" "}
          <Pill view="calibration" onClick={() => goTo("calibration")}>
            Calibration
          </Pill>{" "}
          checks whether the system&rsquo;s confidence scores actually match reality.{" "}
          <Pill view="retract" onClick={() => goTo("retract")}>
            Retract
          </Pill>{" "}
          removes a discredited source and cascades the impact.{" "}
          <Pill view="gdpr" onClick={() => goTo("gdpr")}>
            GDPR Erasure
          </Pill>{" "}
          demonstrates regulatory-compliant data deletion.{" "}
          <Pill view="active-learning" onClick={() => goTo("active-learning")}>
            Active Learning
          </Pill>{" "}
          recommends where to invest effort next for the biggest knowledge payoff.
        </p>
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

function Pill({ view, onClick, children }: {
  view: SubView;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`pill-interactive inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium border ${PILL_COLORS[view]}`}
    >
      {children}
    </button>
  );
}
