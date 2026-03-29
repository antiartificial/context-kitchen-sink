import type { Source } from "../../types";

interface SourceSelectorProps {
  sources: Source[];
}

export default function SourceSelector({ sources }: SourceSelectorProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-300">Source Details</h4>
      <div className="space-y-2">
        {sources.map((source) => (
          <div key={source.id} className="bg-gray-800/50 rounded p-2 text-xs">
            <div className="font-medium text-gray-200 mb-1">{source.external_id || source.id}</div>
            <div className="grid grid-cols-3 gap-1 text-gray-400">
              <span>Var: {source.variance.toFixed(4)}</span>
              {source.labels && source.labels.length > 0 && (
                <span className="col-span-2 truncate">
                  {source.labels.join(", ")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
