import { useState } from "react";

const NODES = [
  { id: "p1", x: 20, y: 25, label: "Project\nStrawberry", group: "ai", r: 12 },
  { id: "p2", x: 35, y: 40, label: "Reasoning\nresearch", group: "ai", r: 10 },
  { id: "p3", x: 15, y: 50, label: "Multi-step\nLLM logic", group: "ai", r: 9 },
  { id: "r1", x: 75, y: 30, label: "Strawberry\nshortcake", group: "recipe", r: 12 },
  { id: "r2", x: 85, y: 50, label: "Berry jam\nrecipe", group: "recipe", r: 9 },
  { id: "r3", x: 65, y: 55, label: "Whipped\ncream", group: "recipe", r: 10 },
];

const EDGES = [
  { from: "p1", to: "p2", type: "supports" },
  { from: "p2", to: "p3", type: "derives_from" },
  { from: "r1", to: "r2", type: "relates_to" },
  { from: "r1", to: "r3", type: "relates_to" },
];

const COLORS = {
  ai: { fill: "rgb(99, 102, 241)", bg: "rgba(99, 102, 241, 0.15)", border: "rgba(99, 102, 241, 0.4)" },
  recipe: { fill: "rgb(244, 114, 182)", bg: "rgba(244, 114, 182, 0.15)", border: "rgba(244, 114, 182, 0.4)" },
};

export default function DisambiguationGraph() {
  const [filter, setFilter] = useState<"all" | "ai" | "recipe">("all");

  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-600">Filter:</span>
        {(["all", "ai", "recipe"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              filter === f
                ? f === "ai" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : f === "recipe" ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                : "bg-gray-700 text-gray-200 border border-gray-600"
                : "text-gray-500 hover:text-gray-300 border border-transparent"
            }`}
          >
            {f === "all" ? "All" : f === "ai" ? "labels:[ai]" : "labels:[recipe]"}
          </button>
        ))}
      </div>

      <div className="relative w-full aspect-[2/1] bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
        <svg viewBox="0 0 100 70" className="w-full h-full">
          {/* Cluster backgrounds */}
          <ellipse cx="23" cy="38" rx="22" ry="22"
            fill={COLORS.ai.bg}
            stroke={COLORS.ai.border}
            strokeWidth="0.3"
            strokeDasharray="2,2"
            opacity={filter === "recipe" ? 0.15 : 0.6}
            className="transition-opacity duration-300"
          />
          <ellipse cx="75" cy="42" rx="20" ry="20"
            fill={COLORS.recipe.bg}
            stroke={COLORS.recipe.border}
            strokeWidth="0.3"
            strokeDasharray="2,2"
            opacity={filter === "ai" ? 0.15 : 0.6}
            className="transition-opacity duration-300"
          />

          {/* Cluster labels */}
          <text x="23" y="65" textAnchor="middle" className="fill-indigo-400/40 text-[3px] font-medium"
            opacity={filter === "recipe" ? 0.15 : 0.8}>
            ai, openai, reasoning
          </text>
          <text x="75" y="67" textAnchor="middle" className="fill-pink-400/40 text-[3px] font-medium"
            opacity={filter === "ai" ? 0.15 : 0.8}>
            recipe, dessert, food
          </text>

          {/* Similarity zone */}
          {filter === "all" && (
            <>
              <line x1="40" y1="30" x2="55" y2="35" stroke="rgb(107, 114, 128)" strokeWidth="0.3" strokeDasharray="1.5,1.5" opacity="0.5" />
              <text x="47" y="28" textAnchor="middle" className="fill-gray-600 text-[2.5px]">similar vectors</text>
              <text x="47" y="31" textAnchor="middle" className="fill-gray-700 text-[2px]">different meaning</text>
            </>
          )}

          {/* Edges */}
          {EDGES.map((e, i) => {
            const from = nodeMap[e.from];
            const to = nodeMap[e.to];
            const group = from.group;
            const opacity = filter === "all" ? 0.6 : filter === group ? 0.8 : 0.1;
            return (
              <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={COLORS[group as keyof typeof COLORS].fill}
                strokeWidth="0.4"
                opacity={opacity}
                className="transition-opacity duration-300"
              />
            );
          })}

          {/* Nodes */}
          {NODES.map(node => {
            const colors = COLORS[node.group as keyof typeof COLORS];
            const active = filter === "all" || filter === node.group;
            const lines = node.label.split("\n");
            return (
              <g key={node.id} opacity={active ? 1 : 0.15} className="transition-opacity duration-300">
                <circle cx={node.x} cy={node.y} r={node.r / 2}
                  fill={colors.bg} stroke={colors.fill} strokeWidth="0.4" />
                {lines.map((line, li) => (
                  <text key={li} x={node.x} y={node.y + (li - (lines.length - 1) / 2) * 3}
                    textAnchor="middle" dominantBaseline="central"
                    className="fill-gray-300 text-[2.2px]"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-[10px] text-gray-600 text-center">
        Click the label filters above to see how contextdb isolates each concept cluster
      </p>
    </div>
  );
}
