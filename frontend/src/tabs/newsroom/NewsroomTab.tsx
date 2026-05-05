import { useState, useCallback } from "react";
import { usePolling } from "../../hooks/usePolling";
import { api } from "../../api";
import type { Source, Claim, ConflictCluster } from "../../types";
import AnimatedCount from "../../components/AnimatedCount";
import ClaimWriter from "./ClaimWriter";
import ClaimFeed from "./ClaimFeed";
import SourceSelector from "./SourceSelector";
import CredibilityPanel from "./CredibilityPanel";
import ConflictAlert from "./ConflictAlert";
import ValidationPanel from "./ValidationPanel";
import LiveDataButton from "./LiveDataButton";

type PanelTab = "write" | "conflicts" | "sources" | "validate" | "live";

const TAB_ACTIVE_BG: Record<PanelTab, string> = {
  write:     "border-blue-500",
  conflicts: "border-orange-500",
  sources:   "border-green-500",
  validate:  "border-purple-500",
  live:      "border-cyan-500",
};

export default function NewsroomTab() {
  const [sources, setSources] = useState<Source[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [conflicts, setConflicts] = useState<ConflictCluster[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelTab>("write");
  const [glowTab, setGlowTab] = useState<PanelTab | null>(null);

  const fetchData = async () => {
    try {
      const [sourcesData, claimsData, conflictsData] = await Promise.all([
        api.get<Source[]>("/newsroom/sources"),
        api.get<Claim[]>("/newsroom/claims"),
        api.get<{ clusters: ConflictCluster[] }>("/newsroom/conflicts"),
      ]);
      setSources(sourcesData);
      setClaims(claimsData);
      setConflicts(conflictsData.clusters);
    } catch (err) {
      console.error("Failed to fetch newsroom data:", err);
    }
  };

  usePolling(fetchData, 3000);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.post("/newsroom/reset");
      await fetchData();
    } catch (err) {
      console.error("Failed to reset:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const hintTab = useCallback((tab: PanelTab) => {
    setGlowTab(tab);
    setTimeout(() => setGlowTab(null), 1600);
  }, []);

  const tabs: { id: PanelTab; label: string; badge?: number }[] = [
    { id: "write", label: "Write" },
    { id: "conflicts", label: "Conflicts", badge: conflicts.length || undefined },
    { id: "sources", label: "Sources", badge: sources.length || undefined },
    { id: "validate", label: "Validate" },
    { id: "live", label: "Live" },
  ];

  return (
    <div className="space-y-3">
      {/* Executive summary + interactive synopsis */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-100">Newsroom</h2>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded text-xs font-medium transition-colors"
          >
            {isResetting ? "..." : "Reset"}
          </button>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
          When information comes from multiple sources, who do you trust?
          A vendor says their API is sub-10ms. An analyst agrees. Then a respected engineer
          publishes benchmarks showing 47ms. A random blog post backs that up.
          The spec sheet and the data disagree &mdash; <em>which claim wins?</em>
        </p>
        <p className="text-xs text-gray-400 leading-relaxed mb-2">
          <strong className="text-gray-300">Scenario:</strong> Evaluating Acme Cloud.
          Five sources (vendor, analyst, engineer, blog, community) compete with
          conflicting claims about performance, reliability, pricing, and security.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400">
          <LegendItem color="sources" onClick={() => { setActivePanel("sources"); hintTab("sources"); }}>
            Compare source credibility and track records
          </LegendItem>
          <LegendItem color="conflicts" onClick={() => { setActivePanel("conflicts"); hintTab("conflicts"); }}>
            See which claims contradict each other
          </LegendItem>
          <LegendItem color="validate" onClick={() => { setActivePanel("validate"); hintTab("validate"); }}>
            Validate or refute sources to shift credibility
          </LegendItem>
          <LegendItem color="write" onClick={() => { setActivePanel("write"); hintTab("write"); }}>
            Submit new claims from any source
          </LegendItem>
          <LegendItem color="live" onClick={() => { setActivePanel("live"); hintTab("live"); }}>
            Pull simulated live data from the community
          </LegendItem>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Claim feed — 3/5 */}
        <div className="lg:col-span-3">
          <ClaimFeed claims={claims} />
        </div>

        {/* Tabbed panel — 2/5 */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex flex-col">
          {/* Tab bar */}
          <div className="flex border-b border-gray-800 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-all relative ${
                  activePanel === tab.id
                    ? `text-white border-b-2 ${TAB_ACTIVE_BG[tab.id]} bg-gray-800/50`
                    : "text-gray-500 hover:text-gray-300"
                } ${glowTab === tab.id ? "animate-tab-glow" : ""}`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                    tab.id === "conflicts"
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-gray-700 text-gray-400"
                  }`}>
                    <AnimatedCount value={tab.badge} />
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto max-h-[420px]">
            {activePanel === "write" && (
              <ClaimWriter sources={sources} onWrite={fetchData} />
            )}
            {activePanel === "conflicts" && (
              <div className="p-3">
                <ConflictAlert clusters={conflicts} />
              </div>
            )}
            {activePanel === "sources" && (
              <div className="p-3">
                <CredibilityPanel sources={sources} />
                <div className="mt-3">
                  <SourceSelector sources={sources} />
                </div>
              </div>
            )}
            {activePanel === "validate" && (
              <div className="p-3">
                <ValidationPanel sources={sources} onValidate={fetchData} />
              </div>
            )}
            {activePanel === "live" && (
              <div className="p-3">
                <LiveDataButton onFetch={fetchData} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, onClick, children }: {
  color: PanelTab;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const dotColors: Record<PanelTab, string> = {
    write:     "bg-blue-400",
    conflicts: "bg-orange-400",
    sources:   "bg-green-400",
    validate:  "bg-purple-400",
    live:      "bg-cyan-400",
  };
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-left py-0.5 hover:text-white transition-colors group"
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColors[color]} group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-offset-gray-900 group-hover:ring-current`} />
      <span className="text-[11px]">{children}</span>
    </button>
  );
}
