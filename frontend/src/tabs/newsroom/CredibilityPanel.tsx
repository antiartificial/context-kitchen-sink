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
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">
        Credibility Comparison
      </h3>
      <div className="space-y-4">
        {sortedSources.map((source) => (
          <div key={source.id}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">
                {source.external_id || source.id}
              </span>
              <span className="text-sm font-semibold text-gray-100">
                {(source.credibility * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${getBarColor(source.credibility)} transition-all duration-300`}
                style={{ width: `${source.credibility * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
              <span>α={source.alpha.toFixed(1)}</span>
              <span>β={source.beta.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
