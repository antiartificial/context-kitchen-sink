const LEVELS = [
  {
    nodes: [{ label: "Compound X reduces inflammation by 40%", type: "claim" }],
    color: "rgb(99, 102, 241)",
  },
  {
    nodes: [
      { label: "Phase 2 trial (n=340)", type: "supports" },
      { label: "Chen et al. 2024 in-vitro", type: "supports" },
      { label: "Pilot study (n=28)", type: "contradicts" },
    ],
    color: "rgb(34, 197, 94)",
  },
  {
    nodes: [
      { label: "NIH Grant #R01-AR-07734", type: "source" },
      { label: "Beijing Medical Lab", type: "source" },
    ],
    color: "rgb(107, 114, 128)",
  },
];

const EDGE_LABELS = [
  { from: [0, 0], to: [1, 0], label: "supports", color: "rgb(34, 197, 94)" },
  { from: [0, 0], to: [1, 1], label: "supports", color: "rgb(34, 197, 94)" },
  { from: [0, 0], to: [1, 2], label: "contradicts", color: "rgb(239, 68, 68)" },
  { from: [1, 0], to: [2, 0], label: "derived_from", color: "rgb(107, 114, 128)" },
  { from: [1, 1], to: [2, 1], label: "derived_from", color: "rgb(107, 114, 128)" },
];

export default function ProvenanceGraph() {
  const levelY = [12, 40, 65];
  const levelLabels = ["Claim", "Evidence", "Sources"];

  function nodeX(levelIdx: number, nodeIdx: number): number {
    const count = LEVELS[levelIdx].nodes.length;
    const spacing = 80 / Math.max(count, 1);
    return 10 + spacing * nodeIdx + spacing / 2;
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-[2/1] bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
        <svg viewBox="0 0 100 80" className="w-full h-full">
          {/* Level labels */}
          {levelLabels.map((label, i) => (
            <text key={i} x="2" y={levelY[i] + 1} className="fill-gray-600 text-[2.5px]">
              {label}
            </text>
          ))}

          {/* Edges */}
          {EDGE_LABELS.map((edge, i) => {
            const x1 = nodeX(edge.from[0], edge.from[1]);
            const y1 = levelY[edge.from[0]] + 5;
            const x2 = nodeX(edge.to[0], edge.to[1]);
            const y2 = levelY[edge.to[0]] - 3;
            const midY = (y1 + y2) / 2;
            const isContra = edge.label === "contradicts";
            return (
              <g key={i}>
                <path
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  fill="none"
                  stroke={edge.color}
                  strokeWidth="0.4"
                  strokeDasharray={isContra ? "1.5,1" : "none"}
                  opacity={0.7}
                />
                <text x={(x1 + x2) / 2 + 1} y={midY} className="text-[1.8px]" fill={edge.color} opacity={0.6}>
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {LEVELS.map((level, li) =>
            level.nodes.map((node, ni) => {
              const x = nodeX(li, ni);
              const y = levelY[li];
              const isContra = node.type === "contradicts";
              return (
                <g key={`${li}-${ni}`}>
                  <rect
                    x={x - 16} y={y - 4} width={32} height={8} rx="1.5"
                    fill={isContra ? "rgba(239, 68, 68, 0.1)" : `${level.color}15`}
                    stroke={isContra ? "rgb(239, 68, 68)" : level.color}
                    strokeWidth="0.3"
                    strokeDasharray={isContra ? "1,1" : "none"}
                  />
                  <text x={x} y={y + 0.8} textAnchor="middle" dominantBaseline="central"
                    className={`text-[2px] ${isContra ? "fill-red-400" : "fill-gray-300"}`}>
                    {node.label.length > 30 ? node.label.slice(0, 28) + "..." : node.label}
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>
      <p className="text-[10px] text-gray-600 text-center">
        Every claim links back through evidence to original sources. Red dashed = contradiction.
      </p>
    </div>
  );
}
