import { useState, useEffect } from "react";
import { api } from "../../api";
import type { Memory, TimelinePoint } from "../../types";
import TimeSlider from "./TimeSlider";
import MemoryTimeline from "./MemoryTimeline";
import DecayChart from "./DecayChart";
import NoiseButton from "./NoiseButton";
import OdometerCount from "../../components/OdometerCount";

export default function AgentTab() {
  const [hoursAgo, setHoursAgo] = useState(0);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [_timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [fetchTick, setFetchTick] = useState(0);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const data = await api.get<{ points: TimelinePoint[] }>("/agent/timeline");
        setTimeline(data.points);
      } catch (err) {
        console.error("Failed to fetch timeline:", err);
      }
    };
    fetchTimeline();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchMemories = async () => {
      try {
        const asOf = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
        const queryParam = searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : "";
        const data = await api.get<{ memories: Memory[] }>(
          `/agent/memories?as_of=${asOf}${queryParam}`
        );
        if (!cancelled) {
          setMemories(data.memories);
          setInitialLoad(false);
        }
      } catch (err) {
        console.error("Failed to fetch memories:", err);
      }
    };
    fetchMemories();
    return () => { cancelled = true; };
  }, [hoursAgo, searchQuery, fetchTick]);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.post("/agent/reset");
      setHoursAgo(0);
      setSearchQuery("");
      const [timelineData, memoriesData] = await Promise.all([
        api.get<{ points: TimelinePoint[] }>("/agent/timeline"),
        api.get<{ memories: Memory[] }>("/agent/memories?as_of=" + new Date().toISOString()),
      ]);
      setTimeline(timelineData.points);
      setMemories(memoriesData.memories);
    } catch (err) {
      console.error("Failed to reset:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleInject = () => {
    setFetchTick((t) => t + 1);
  };

  const epCount = memories.filter((m) => m.mem_type === "episodic").length;
  const semCount = memories.filter((m) => m.mem_type === "semantic").length;
  const procCount = memories.filter((m) => m.mem_type === "procedural").length;
  const wkCount = memories.filter((m) => m.mem_type === "working").length;
  const avgScore = memories.length > 0
    ? (memories.reduce((sum, m) => sum + m.score, 0) / memories.length).toFixed(3)
    : "0.000";

  return (
    <div className="space-y-4">
      {/* Synopsis */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
        <p className="text-sm text-gray-400">
          <span className="text-gray-200 font-medium">Temporal memory decay visualization.</span>{" "}
          18 memories across 4 types simulate an AI agent's refactor task. Use the time slider to
          observe how working memory decays fastest, episodic fades over days, while semantic and
          procedural persist. Inject noise to see how low-confidence memories compete for retrieval.
        </p>
      </div>

      {/* Header + stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-100">Agent Memory</h2>
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="text-gray-500"><OdometerCount value={memories.length} /> total</span>
            <span className="text-blue-400"><OdometerCount value={epCount} /> ep</span>
            <span className="text-green-400"><OdometerCount value={semCount} /> sem</span>
            <span className="text-purple-400"><OdometerCount value={procCount} /> proc</span>
            <span className="text-orange-400"><OdometerCount value={wkCount} /> wk</span>
            <span className="text-gray-500">avg {avgScore}</span>
          </div>
        </div>
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
        >
          {isResetting ? "Resetting..." : "Reset"}
        </button>
      </div>

      {/* Time Slider + Search in row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TimeSlider value={hoursAgo} onChange={setHoursAgo} />
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <NoiseButton onInject={handleInject} />
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {initialLoad && memories.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-400">
              Loading memories...
            </div>
          ) : (
            <MemoryTimeline memories={memories} />
          )}
        </div>
        <div>
          <DecayChart currentHoursAgo={hoursAgo} />
        </div>
      </div>
    </div>
  );
}
