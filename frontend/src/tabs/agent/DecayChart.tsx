import { useState } from "react";

const DECAY_CONSTANTS = {
  episodic: Math.log(2) / 8.7,
  semantic: Math.log(2) / 35,
  procedural: Math.log(2) / (29 * 24),
  working: Math.log(2) / 0.5,
};

const COLORS = {
  episodic: "rgb(59, 130, 246)",
  semantic: "rgb(34, 197, 94)",
  procedural: "rgb(168, 85, 247)",
  working: "rgb(249, 115, 22)",
};

type MemType = keyof typeof DECAY_CONSTANTS;

const SCENARIOS: { type: MemType; example: string; why: string }[] = [
  {
    type: "working",
    example: "\"Current variable name is tempResult\"",
    why: "Gone in 30 min. You don't need the variable name from 3 tasks ago cluttering retrieval.",
  },
  {
    type: "episodic",
    example: "\"Saw a null pointer crash in auth.go line 42\"",
    why: "Fades over hours. Yesterday's debug session is context; last week's is noise.",
  },
  {
    type: "semantic",
    example: "\"Auth tokens use RS256 signing\"",
    why: "Persists for days. Learned facts stay relevant until the codebase changes.",
  },
  {
    type: "procedural",
    example: "\"Deploy flow: build, test, stage, canary, prod\"",
    why: "Lasts weeks. How-to knowledge is slow to expire because processes rarely change overnight.",
  },
];

interface DecayChartProps {
  currentHoursAgo: number;
}

function computeDecayCurve(
  alpha: number,
  maxHours: number,
  points: number = 100
): string {
  const path: string[] = [];
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * maxHours;
    const score = Math.exp(-alpha * t);
    const x = (t / maxHours) * 100;
    const y = 100 - score * 100;
    if (i === 0) {
      path.push(`M ${x} ${y}`);
    } else {
      path.push(`L ${x} ${y}`);
    }
  }
  return path.join(" ");
}

function retentionAt(type: MemType, hours: number): number {
  return Math.exp(-DECAY_CONSTANTS[type] * hours);
}

export default function DecayChart({ currentHoursAgo }: DecayChartProps) {
  const maxHours = 168;
  const currentX = (currentHoursAgo / maxHours) * 100;
  const [hoveredType, setHoveredType] = useState<MemType | null>(null);

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-1">Why Decay Matters</h3>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Not all memories are equal. An agent that remembers everything retrieves
          stale noise alongside fresh signal. Decay automatically prioritizes recent,
          relevant memories while letting low-value ones fade, just like human cognition.
        </p>
      </div>

      <div className="relative w-full aspect-[2/1] bg-gray-950 rounded border border-gray-800">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line x1="0" y1="0" x2="100" y2="0" stroke="rgb(55, 65, 81)" strokeWidth="0.5" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="rgb(55, 65, 81)" strokeWidth="0.3" strokeDasharray="2,2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgb(55, 65, 81)" strokeWidth="0.3" strokeDasharray="2,2" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="rgb(55, 65, 81)" strokeWidth="0.3" strokeDasharray="2,2" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgb(55, 65, 81)" strokeWidth="0.5" />

          {/* Decay curves */}
          {(Object.keys(DECAY_CONSTANTS) as MemType[]).map((type) => (
            <path
              key={type}
              d={computeDecayCurve(DECAY_CONSTANTS[type], maxHours)}
              fill="none"
              stroke={COLORS[type]}
              strokeWidth={hoveredType === type ? "2" : "1"}
              opacity={hoveredType && hoveredType !== type ? 0.25 : 1}
              vectorEffect="non-scaling-stroke"
              className="transition-opacity duration-200"
            />
          ))}

          {/* Current time marker */}
          <line
            x1={currentX}
            y1="0"
            x2={currentX}
            y2="100"
            stroke="rgb(239, 68, 68)"
            strokeWidth="1"
            strokeDasharray="3,3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 -ml-8 pr-1">
          <span>1.0</span>
          <span>0.75</span>
          <span>0.5</span>
          <span>0.25</span>
          <span>0.0</span>
        </div>

        {/* X-axis labels */}
        <div className="absolute left-0 right-0 bottom-0 flex justify-between text-xs text-gray-500 -mb-6">
          <span>0h</span>
          <span>42h</span>
          <span>84h</span>
          <span>126h</span>
          <span>168h</span>
        </div>
      </div>

      {/* Interactive legend + retention at current time */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {(Object.keys(DECAY_CONSTANTS) as MemType[]).map((type) => {
          const halfLife = type === "working" ? "30min" : type === "episodic" ? "8.7h" : type === "semantic" ? "35h" : "29d";
          const ret = retentionAt(type, currentHoursAgo);
          return (
            <button
              key={type}
              className={`flex items-center gap-2 text-left rounded px-1.5 py-1 transition-colors ${
                hoveredType === type ? "bg-gray-800" : "hover:bg-gray-800/50"
              }`}
              onMouseEnter={() => setHoveredType(type)}
              onMouseLeave={() => setHoveredType(null)}
            >
              <div className="w-3 h-0.5 flex-shrink-0" style={{ backgroundColor: COLORS[type] }} />
              <span className="text-gray-400 capitalize">{type}</span>
              <span className="text-gray-600">({halfLife})</span>
              {currentHoursAgo > 0 && (
                <span className={`ml-auto font-mono ${ret > 0.5 ? "text-green-500" : ret > 0.1 ? "text-yellow-500" : "text-red-500"}`}>
                  {(ret * 100).toFixed(0)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scenario cards */}
      <div className="space-y-2 pt-1">
        <h4 className="text-[11px] text-gray-500 uppercase tracking-wider">Example: why each type decays differently</h4>
        {SCENARIOS.map((s) => {
          const ret = retentionAt(s.type, currentHoursAgo);
          return (
            <div
              key={s.type}
              className="bg-gray-950 border border-gray-800 rounded px-3 py-2 space-y-1 transition-colors hover:border-gray-700"
              onMouseEnter={() => setHoveredType(s.type)}
              onMouseLeave={() => setHoveredType(null)}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[s.type] }} />
                <span className="text-[11px] font-mono text-gray-300">{s.example}</span>
                {currentHoursAgo > 0 && (
                  <span className={`ml-auto text-[10px] font-mono ${ret > 0.5 ? "text-green-500/70" : ret > 0.1 ? "text-yellow-500/70" : "text-red-500/70"}`}>
                    {(ret * 100).toFixed(0)}% retained
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 pl-4">{s.why}</p>
            </div>
          );
        })}
      </div>

      {/* The "so what" */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded px-3 py-2">
        <p className="text-[11px] text-indigo-300/80 leading-relaxed">
          <strong className="text-indigo-300">Result:</strong> When the agent retrieves
          memories, fresh working context and lasting procedural knowledge surface
          naturally. Stale observations and old debug sessions don't compete for
          attention. Move the time slider to see retention change in real time.
        </p>
      </div>
    </div>
  );
}
