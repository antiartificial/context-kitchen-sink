import type { Memory } from "../../types";
import MemoryCard from "./MemoryCard";

const memoryTypeIcons = {
  episodic: "📅",
  semantic: "📚",
  procedural: "🔧",
  working: "💭",
};

const memoryTypeLabels = {
  episodic: "Episodic Memory",
  semantic: "Semantic Memory",
  procedural: "Procedural Memory",
  working: "Working Memory",
};

function MemorySection({
  type,
  memories,
}: {
  type: Memory["mem_type"];
  memories: Memory[];
}) {
  const sortedMemories = [...memories].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 sticky top-0 bg-gray-950 py-2 z-10">
        <span className="text-xl">{memoryTypeIcons[type]}</span>
        <h3 className="text-lg font-semibold text-gray-200">
          {memoryTypeLabels[type]}
        </h3>
        <span className="text-sm text-gray-500">({sortedMemories.length})</span>
      </div>

      {sortedMemories.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-4 text-center text-gray-500 text-sm">
          No memories surviving at this time point
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMemories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MemoryTimeline({ memories }: { memories: Memory[] }) {
  const episodic = memories.filter((m) => m.mem_type === "episodic");
  const semantic = memories.filter((m) => m.mem_type === "semantic");
  const procedural = memories.filter((m) => m.mem_type === "procedural");
  const working = memories.filter((m) => m.mem_type === "working");

  return (
    <div className="space-y-6">
      <MemorySection type="working" memories={working} />
      <MemorySection type="episodic" memories={episodic} />
      <MemorySection type="semantic" memories={semantic} />
      <MemorySection type="procedural" memories={procedural} />
    </div>
  );
}
