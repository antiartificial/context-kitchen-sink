import { useState, useEffect, useRef } from "react";
import type { Scenario } from "./scenarioData";

interface BeforeAfterProps {
  scenario: Scenario;
}

const ITEM_COLORS = [
  "bg-blue-400", "bg-emerald-400", "bg-amber-400", "bg-purple-400",
  "bg-pink-400", "bg-cyan-400", "bg-orange-400", "bg-lime-400",
];

function stableColor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = ((hash << 5) - hash + label.charCodeAt(i)) | 0;
  return ITEM_COLORS[Math.abs(hash) % ITEM_COLORS.length];
}

export default function BeforeAfter({ scenario }: BeforeAfterProps) {
  const [showAfter, setShowAfter] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [barWidths, setBarWidths] = useState<number[]>([]);
  const prevView = useRef<"before" | "after">("before");
  const view = showAfter ? scenario.after : scenario.before;
  const viewKey = showAfter ? "after" : "before";

  useEffect(() => {
    setRendered(false);
    setBarWidths(view.items.map(() => 0));

    const showTimer = requestAnimationFrame(() => {
      setRendered(true);
      const staggerTimers: ReturnType<typeof setTimeout>[] = [];
      view.items.forEach((item, i) => {
        const t = setTimeout(() => {
          setBarWidths(prev => {
            const next = [...prev];
            next[i] = item.score * 100;
            return next;
          });
        }, 150 + i * 120);
        staggerTimers.push(t);
      });
      prevView.current = viewKey;
      return () => staggerTimers.forEach(clearTimeout);
    });

    return () => cancelAnimationFrame(showTimer);
  }, [viewKey]);

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAfter(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !showAfter
              ? "bg-red-500/20 text-red-300 border border-red-500/30"
              : "text-gray-500 hover:text-gray-300 border border-transparent"
          }`}
        >
          pgvector
        </button>
        <button
          onClick={() => setShowAfter(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            showAfter
              ? "bg-green-500/20 text-green-300 border border-green-500/30"
              : "text-gray-500 hover:text-gray-300 border border-transparent"
          }`}
        >
          contextdb
        </button>
        <span className="text-[10px] text-gray-600 ml-2">{view.caption}</span>
      </div>

      {/* Results */}
      <div className="space-y-1.5">
        {view.items.map((item, i) => {
          const dotColor = stableColor(item.label);
          return (
            <div
              key={`${viewKey}-${i}`}
              className={`flex items-start gap-3 px-3 py-2 rounded-lg border transition-all duration-500 ${
                item.dimmed
                  ? "border-gray-800/50 bg-gray-950/30 opacity-40"
                  : item.highlight
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-gray-800 bg-gray-900/50"
              }`}
              style={{
                opacity: rendered ? (item.dimmed ? 0.4 : 1) : 0,
                transform: rendered ? "translateY(0)" : "translateY(8px)",
                transition: `opacity 300ms ${i * 80}ms, transform 300ms ${i * 80}ms`,
              }}
            >
              {/* Color tracking dot */}
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dotColor}`} />

              {/* Score bar */}
              <div className="flex-shrink-0 w-10 pt-0.5">
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.dimmed ? "bg-gray-600" : item.highlight ? "bg-green-500" : "bg-blue-500"
                    }`}
                    style={{
                      width: `${barWidths[i] ?? 0}%`,
                      transition: "width 500ms ease-out",
                    }}
                  />
                </div>
                <span className="text-[9px] text-gray-600 font-mono">{item.score.toFixed(2)}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-relaxed ${item.dimmed ? "text-gray-600" : "text-gray-300"}`}>
                  {item.label}
                </p>
                {item.meta && (
                  <p className={`text-[10px] mt-0.5 font-mono ${
                    item.dimmed ? "text-gray-700" : "text-gray-500"
                  }`}>
                    {item.meta}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      {showAfter && (
        <div
          className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg px-3 py-2"
          style={{
            opacity: rendered ? 1 : 0,
            transition: `opacity 400ms ${view.items.length * 80 + 200}ms`,
          }}
        >
          <p className="text-[11px] text-indigo-300/80 leading-relaxed">
            {scenario.insight}
          </p>
        </div>
      )}
    </div>
  );
}
