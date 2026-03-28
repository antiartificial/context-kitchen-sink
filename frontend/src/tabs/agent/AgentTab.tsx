import { useState, useEffect } from "react";
import { api } from "../../api";
import type { Memory, TimelinePoint } from "../../types";
import TimeSlider from "./TimeSlider";
import MemoryTimeline from "./MemoryTimeline";
import DecayChart from "./DecayChart";
import NoiseButton from "./NoiseButton";

export default function AgentTab() {
  const [hoursAgo, setHoursAgo] = useState(0);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch timeline data once on mount
  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const data = await api.get<{ points: TimelinePoint[] }>(
          "/agent/timeline"
        );
        setTimeline(data.points);
      } catch (err) {
        console.error("Failed to fetch timeline:", err);
      }
    };
    fetchTimeline();
  }, []);

  // Fetch memories whenever hoursAgo or searchQuery changes
  useEffect(() => {
    const fetchMemories = async () => {
      setIsLoading(true);
      try {
        const asOf = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
        const queryParam = searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : "";
        const data = await api.get<{ memories: Memory[] }>(
          `/agent/memories?as_of=${asOf}${queryParam}`
        );
        setMemories(data.memories);
      } catch (err) {
        console.error("Failed to fetch memories:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemories();
  }, [hoursAgo, searchQuery]);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.post("/agent/reset");
      // Refetch data
      setHoursAgo(0);
      setSearchQuery("");
      const [timelineData, memoriesData] = await Promise.all([
        api.get<{ points: TimelinePoint[] }>("agent/timeline"),
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

  const handleInject = async () => {
    // Refetch memories after injection
    const asOf = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
    const queryParam = searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : "";
    try {
      const data = await api.get<{ memories: Memory[] }>(
        `/agent/memories?as_of=${asOf}${queryParam}`
      );
      setMemories(data.memories);
    } catch (err) {
      console.error("Failed to refetch memories:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Agent Memory</h2>
          <p className="text-sm text-gray-400 mt-1">
            Temporal memory decay across episodic, semantic, procedural, and working memory
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

      {/* Time Slider */}
      <TimeSlider value={hoursAgo} onChange={setHoursAgo} />

      {/* Search Box */}
      <div className="bg-gray-900 rounded-lg p-4">
        <input
          type="text"
          placeholder="Search memories by content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Memory Timeline */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-400">
              Loading memories...
            </div>
          ) : (
            <MemoryTimeline memories={memories} />
          )}
        </div>

        {/* Right Column - Decay Chart + Noise Button */}
        <div className="space-y-4">
          <DecayChart currentHoursAgo={hoursAgo} />
          <NoiseButton onInject={handleInject} />

          {/* Timeline Stats */}
          {timeline.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Memory Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Total Memories:</span>
                  <span className="text-gray-200 ml-2 font-medium">
                    {memories.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Episodic:</span>
                  <span className="text-blue-400 ml-2 font-medium">
                    {memories.filter((m) => m.mem_type === "episodic").length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Semantic:</span>
                  <span className="text-green-400 ml-2 font-medium">
                    {memories.filter((m) => m.mem_type === "semantic").length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Procedural:</span>
                  <span className="text-purple-400 ml-2 font-medium">
                    {memories.filter((m) => m.mem_type === "procedural").length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Working:</span>
                  <span className="text-orange-400 ml-2 font-medium">
                    {memories.filter((m) => m.mem_type === "working").length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Avg Score:</span>
                  <span className="text-gray-200 ml-2 font-medium">
                    {memories.length > 0
                      ? (
                          memories.reduce((sum, m) => sum + m.score, 0) /
                          memories.length
                        ).toFixed(3)
                      : "0.000"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
