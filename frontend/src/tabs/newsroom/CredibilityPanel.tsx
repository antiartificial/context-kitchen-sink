import type { Source } from "../../types";

interface CredibilityPanelProps {
  sources: Source[];
}

export default function CredibilityPanel({ sources }: CredibilityPanelProps) {
  const sortedSources = [...sources].sort(
    (a, b) => b.credibility - a.credibility
  );

  const getBarColor = (credibility: number) => {
    if (credibility >= 0.7) return "bg-green-500";
    if (credibility >= 0.4) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-300">Credibility</h4>
      {sortedSources.map((source) => (
        <div key={source.id}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-300 truncate">{source.external_id || source.id}</span>
            <span className="text-gray-200 font-mono tabular-nums">
              {(source.credibility * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full bar-animated ${getBarColor(source.credibility)}`}
              style={{ width: `${source.credibility * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
            <span>a={source.alpha.toFixed(1)} b={source.beta.toFixed(1)}</span>
            <span>[{(source.interval_lower * 100).toFixed(0)}-{(source.interval_upper * 100).toFixed(0)}%]</span>
          </div>
        </div>
      ))}
    </div>
  );
}
