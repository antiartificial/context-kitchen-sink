import type { Memory } from "../../types";

const memoryTypeColors = {
  episodic: "border-blue-500",
  semantic: "border-green-500",
  procedural: "border-purple-500",
  working: "border-orange-500",
};

const memoryTypeBadgeColors = {
  episodic: "bg-blue-500/20 text-blue-300",
  semantic: "bg-green-500/20 text-green-300",
  procedural: "bg-purple-500/20 text-purple-300",
  working: "bg-orange-500/20 text-orange-300",
};

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-16 text-right">{label}:</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
        />
      </div>
      <span className="text-gray-400 w-8">{value.toFixed(2)}</span>
    </div>
  );
}

export default function MemoryCard({ memory }: { memory: Memory }) {
  const borderColor = memoryTypeColors[memory.mem_type];
  const badgeColor = memoryTypeBadgeColors[memory.mem_type];
  const opacity = Math.max(0.3, Math.min(1, memory.score));
  const halfLife = (Math.log(2) / memory.decay_alpha).toFixed(1);

  return (
    <div
      className={`bg-gray-900 border-l-4 ${borderColor} rounded-lg p-4 space-y-3`}
      style={{ opacity }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-gray-200 text-sm flex-1">{memory.content}</p>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${badgeColor}`}
        >
          {memory.mem_type}
        </span>
      </div>

      <div className="space-y-1.5">
        <ScoreBar
          label="Similarity"
          value={memory.similarity_score}
          color="bg-blue-400"
        />
        <ScoreBar
          label="Confidence"
          value={memory.confidence_score}
          color="bg-green-400"
        />
        <ScoreBar
          label="Recency"
          value={memory.recency_score}
          color="bg-purple-400"
        />
        <ScoreBar
          label="Utility"
          value={memory.utility_score}
          color="bg-orange-400"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-800">
        <div className="flex items-center gap-4">
          <span>Score: {memory.score.toFixed(3)}</span>
          <span>Half-life: {halfLife}h</span>
        </div>
        <span>
          {new Date(memory.valid_from).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
