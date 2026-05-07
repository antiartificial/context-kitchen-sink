import { useState, useRef, useLayoutEffect, useCallback } from "react";
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
  const [barWidths, setBarWidths] = useState<Map<string, number>>(new Map());
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevPositions = useRef<Map<string, number>>(new Map());
  const isFirstRender = useRef(true);

  const view = showAfter ? scenario.after : scenario.before;

  const handleToggle = useCallback((next: boolean) => {
    const positions = new Map<string, number>();
    itemRefs.current.forEach((el, key) => {
      positions.set(key, el.getBoundingClientRect().top);
    });
    prevPositions.current = positions;
    setBarWidths(new Map());
    setShowAfter(next);
  }, []);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const timers: ReturnType<typeof setTimeout>[] = [];
      view.items.forEach((item, i) => {
        timers.push(setTimeout(() => {
          setBarWidths(prev => new Map(prev).set(item.label, item.score * 100));
        }, 100 + i * 100));
      });
      return () => timers.forEach(clearTimeout);
    }

    const hasPrev = prevPositions.current.size > 0;

    itemRefs.current.forEach((el, key) => {
      if (!hasPrev) return;
      const prevTop = prevPositions.current.get(key);
      if (prevTop === undefined) {
        el.style.opacity = "0";
        el.style.transform = "translateY(12px)";
        el.style.transition = "none";
        el.offsetHeight;
        el.style.transition = "opacity 350ms 100ms, transform 350ms 100ms";
        el.style.opacity = "";
        el.style.transform = "translateY(0)";
        return;
      }

      const newTop = el.getBoundingClientRect().top;
      const delta = prevTop - newTop;

      if (Math.abs(delta) < 1) return;

      el.style.transform = `translateY(${delta}px)`;
      el.style.transition = "none";
      el.offsetHeight;
      el.style.transition = "transform 450ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      el.style.transform = "translateY(0)";
    });

    prevPositions.current = new Map();

    const timers: ReturnType<typeof setTimeout>[] = [];
    view.items.forEach((item, i) => {
      timers.push(setTimeout(() => {
        setBarWidths(prev => new Map(prev).set(item.label, item.score * 100));
      }, 200 + i * 100));
    });
    return () => timers.forEach(clearTimeout);
  }, [showAfter]);

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleToggle(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !showAfter
              ? "bg-red-500/20 text-red-300 border border-red-500/30"
              : "text-gray-500 hover:text-gray-300 border border-transparent"
          }`}
        >
          pgvector
        </button>
        <button
          onClick={() => handleToggle(true)}
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
        {view.items.map((item) => {
          const dotColor = stableColor(item.label);
          const barW = barWidths.get(item.label) ?? 0;
          return (
            <div
              key={item.label}
              ref={(el) => {
                if (el) itemRefs.current.set(item.label, el);
                else itemRefs.current.delete(item.label);
              }}
              className={`flex items-start gap-3 px-3 py-2 rounded-lg border transition-colors duration-400 ${
                item.dimmed
                  ? "border-gray-800/50 bg-gray-950/30 opacity-40"
                  : item.highlight
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-gray-800 bg-gray-900/50"
              }`}
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
                      width: `${barW}%`,
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
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg px-3 py-2">
          <p className="text-[11px] text-indigo-300/80 leading-relaxed">
            {scenario.insight}
          </p>
        </div>
      )}
    </div>
  );
}
