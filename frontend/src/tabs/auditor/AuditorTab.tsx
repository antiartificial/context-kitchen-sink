import { useState, useEffect } from "react";
import { api } from "../../api";
import type { AuditorNode } from "../../types";
import ResetButton from "../../components/ResetButton";
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

const navItems: { id: SubView; label: string }[] = [
  { id: "narrative", label: "Narrative" },
  { id: "belief-diff", label: "Belief Diff" },
  { id: "gaps", label: "Knowledge Gaps" },
  { id: "calibration", label: "Calibration" },
  { id: "retract", label: "Retract Source" },
  { id: "gdpr", label: "GDPR Erasure" },
  { id: "active-learning", label: "Active Learning" },
];

export default function AuditorTab() {
  const [nodes, setNodes] = useState<AuditorNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<SubView>("narrative");

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ nodes: AuditorNode[] }>("/auditor/nodes");
      setNodes(data.nodes);
    } catch (err) {
      console.error("Failed to fetch auditor nodes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const handleReset = async () => {
    await api.post("/auditor/reset");
    await fetchNodes();
  };

  const handleDataChange = () => {
    fetchNodes();
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar navigation */}
      <div className="w-64 bg-gray-900/50 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-gray-100">Auditor</h2>
          <p className="text-xs text-gray-400 mt-1">
            Epistemic analysis tools
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                activeView === item.id
                  ? "bg-[#6366f1] text-white font-medium"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right content area */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-100">
                {navItems.find((n) => n.id === activeView)?.label}
              </h3>
            </div>
            <ResetButton onReset={handleReset} label="Reset Auditor" />
          </div>

          {loading && activeView !== "gaps" && activeView !== "calibration" && activeView !== "active-learning" ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-6">
              {activeView === "narrative" && <NarrativeView nodes={nodes} />}
              {activeView === "belief-diff" && <BeliefDiffView />}
              {activeView === "gaps" && <GapsView />}
              {activeView === "calibration" && <CalibrationView />}
              {activeView === "retract" && <RetractPanel onRetract={handleDataChange} />}
              {activeView === "gdpr" && <GDPRErasure onErase={handleDataChange} />}
              {activeView === "active-learning" && <ActiveLearning />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
