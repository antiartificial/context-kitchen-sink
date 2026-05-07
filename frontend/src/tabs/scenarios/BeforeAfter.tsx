import { useState } from "react";
import type { Scenario } from "./scenarioData";

interface BeforeAfterProps {
  scenario: Scenario;
}

export default function BeforeAfter({ scenario }: BeforeAfterProps) {
  const [showAfter, setShowAfter] = useState(false);
  const view = showAfter ? scenario.after : scenario.before;

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
        {view.items.map((item, i) => (
          <div
            key={`${showAfter}-${i}`}
            className={`flex items-start gap-3 px-3 py-2 rounded-lg border transition-all duration-300 ${
              item.dimmed
                ? "border-gray-800/50 bg-gray-950/30 opacity-50"
                : item.highlight
                ? "border-green-500/20 bg-green-500/5"
                : "border-gray-800 bg-gray-900/50"
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Score bar */}
            <div className="flex-shrink-0 w-10 pt-0.5">
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.dimmed ? "bg-gray-600" : item.highlight ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${item.score * 100}%` }}
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
        ))}
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
