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

export default function DecayChart({ currentHoursAgo }: DecayChartProps) {
  const maxHours = 168;
  const currentX = (currentHoursAgo / maxHours) * 100;

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-medium text-gray-300">Decay Curves</h3>

      <div className="relative w-full aspect-[2/1] bg-gray-950 rounded border border-gray-800">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line
            x1="0"
            y1="0"
            x2="100"
            y2="0"
            stroke="rgb(55, 65, 81)"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="25"
            x2="100"
            y2="25"
            stroke="rgb(55, 65, 81)"
            strokeWidth="0.3"
            strokeDasharray="2,2"
          />
          <line
            x1="0"
            y1="50"
            x2="100"
            y2="50"
            stroke="rgb(55, 65, 81)"
            strokeWidth="0.3"
            strokeDasharray="2,2"
          />
          <line
            x1="0"
            y1="75"
            x2="100"
            y2="75"
            stroke="rgb(55, 65, 81)"
            strokeWidth="0.3"
            strokeDasharray="2,2"
          />
          <line
            x1="0"
            y1="100"
            x2="100"
            y2="100"
            stroke="rgb(55, 65, 81)"
            strokeWidth="0.5"
          />

          {/* Decay curves */}
          <path
            d={computeDecayCurve(DECAY_CONSTANTS.working, maxHours)}
            fill="none"
            stroke={COLORS.working}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={computeDecayCurve(DECAY_CONSTANTS.episodic, maxHours)}
            fill="none"
            stroke={COLORS.episodic}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={computeDecayCurve(DECAY_CONSTANTS.semantic, maxHours)}
            fill="none"
            stroke={COLORS.semantic}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={computeDecayCurve(DECAY_CONSTANTS.procedural, maxHours)}
            fill="none"
            stroke={COLORS.procedural}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />

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

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-0.5"
            style={{ backgroundColor: COLORS.working }}
          />
          <span className="text-gray-400">Working (30min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-0.5"
            style={{ backgroundColor: COLORS.episodic }}
          />
          <span className="text-gray-400">Episodic (8.7h)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-0.5"
            style={{ backgroundColor: COLORS.semantic }}
          />
          <span className="text-gray-400">Semantic (35h)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-0.5"
            style={{ backgroundColor: COLORS.procedural }}
          />
          <span className="text-gray-400">Procedural (29d)</span>
        </div>
      </div>
    </div>
  );
}
