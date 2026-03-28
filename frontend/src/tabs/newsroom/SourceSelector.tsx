import type { Source } from "../../types";

interface SourceSelectorProps {
  sources: Source[];
}

export default function SourceSelector({ sources }: SourceSelectorProps) {
  const getCredibilityColor = (credibility: number) => {
    if (credibility >= 0.7) return "text-green-400";
    if (credibility >= 0.4) return "text-yellow-400";
    return "text-red-400";
  };

  const getCredibilityBg = (credibility: number) => {
    if (credibility >= 0.7) return "bg-green-600";
    if (credibility >= 0.4) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Sources</h3>
      <div className="space-y-4">
        {sources.map((source) => (
          <div
            key={source.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-100">
                {source.external_id || source.id}
              </h4>
              <span
                className={`text-sm font-medium ${getCredibilityColor(source.credibility)}`}
              >
                {(source.credibility * 100).toFixed(1)}%
              </span>
            </div>

            {source.labels && source.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {source.labels.map((label) => (
                  <span
                    key={label}
                    className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Alpha: {source.alpha.toFixed(1)}</span>
                <span>Beta: {source.beta.toFixed(1)}</span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Credibility</span>
                  <span>{(source.credibility * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getCredibilityBg(source.credibility)}`}
                    style={{ width: `${source.credibility * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Interval</span>
                  <span>
                    [{(source.interval_lower * 100).toFixed(0)}% -{" "}
                    {(source.interval_upper * 100).toFixed(0)}%]
                  </span>
                </div>
                <div className="relative w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="absolute h-2 bg-blue-500 rounded-full"
                    style={{
                      left: `${source.interval_lower * 100}%`,
                      width: `${(source.interval_upper - source.interval_lower) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-400">
                Variance: {source.variance.toFixed(4)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
