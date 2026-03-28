import { useState } from "react";
import { usePolling } from "../../hooks/usePolling";
import { api } from "../../api";
import type { Source, Claim, ConflictCluster } from "../../types";
import ClaimWriter from "./ClaimWriter";
import ClaimFeed from "./ClaimFeed";
import SourceSelector from "./SourceSelector";
import CredibilityPanel from "./CredibilityPanel";
import ConflictAlert from "./ConflictAlert";
import ValidationPanel from "./ValidationPanel";
import LiveDataButton from "./LiveDataButton";

export default function NewsroomTab() {
  const [sources, setSources] = useState<Source[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [conflicts, setConflicts] = useState<ConflictCluster[]>([]);
  const [isResetting, setIsResetting] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">
            Newsroom
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Multi-source credibility tracking with conflict detection
          </p>
        </div>
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
        >
          {isResetting ? "Resetting..." : "Reset"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <ClaimWriter sources={sources} onWrite={fetchData} />
          <ClaimFeed claims={claims} />
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          <SourceSelector sources={sources} />
          <CredibilityPanel sources={sources} />
          <ConflictAlert clusters={conflicts} />
          <ValidationPanel sources={sources} onValidate={fetchData} />
          <LiveDataButton onFetch={fetchData} />
        </div>
      </div>
    </div>
  );
}
