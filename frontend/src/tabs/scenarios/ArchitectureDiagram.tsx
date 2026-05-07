import { useState } from "react";
import { ARCHITECTURE_LAYERS, TRADEOFFS } from "./scenarioData";

export default function ArchitectureDiagram() {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);
  const [showTradeoffs, setShowTradeoffs] = useState(false);

  return (
    <div className="space-y-4">
      {/* Stack diagram */}
      <div className="flex flex-col items-center gap-0">
        {ARCHITECTURE_LAYERS.map((layer, i) => (
          <div key={layer.label} className="w-full max-w-md">
            <div
              className={`relative px-4 py-3 border-2 rounded-lg transition-all cursor-default ${
                hoveredLayer === i ? "scale-[1.02]" : ""
              }`}
              style={{
                borderColor: hoveredLayer === i ? layer.color : "rgb(55, 65, 81)",
                backgroundColor: hoveredLayer === i ? `${layer.color}10` : "transparent",
              }}
              onMouseEnter={() => setHoveredLayer(i)}
              onMouseLeave={() => setHoveredLayer(null)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">{layer.label}</span>
                <span className="text-[10px] text-gray-500">{layer.description}</span>
              </div>
            </div>
            {i < ARCHITECTURE_LAYERS.length - 1 && (
              <div className="flex justify-center py-1">
                <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* What contextdb adds */}
      <div className="bg-gray-950 border border-gray-800 rounded-lg px-4 py-3">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          contextdb sits between your application and the storage backend. Your app
          writes claims with sources, labels, and timestamps. contextdb handles
          credibility tracking, contradiction detection, temporal decay, and graph
          traversal. The storage backend (Postgres, SQLite, or in-process) just
          stores data -- contextdb adds the reasoning layer.
        </p>
      </div>

      {/* Tradeoffs toggle */}
      <button
        onClick={() => setShowTradeoffs(!showTradeoffs)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <svg className={`w-3.5 h-3.5 transition-transform ${showTradeoffs ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        What are the tradeoffs?
      </button>

      {showTradeoffs && (
        <div className="grid grid-cols-1 gap-1.5">
          {TRADEOFFS.map((t, i) => (
            <div key={i} className="flex items-start gap-3 text-[11px]">
              <div className="flex-1 flex items-start gap-1.5">
                <svg className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-gray-300">{t.gain}</span>
              </div>
              <div className="flex-1 flex items-start gap-1.5">
                <svg className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </svg>
                <span className="text-gray-500">{t.cost}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
