import type { ConflictCluster } from "../../types";

interface ConflictAlertProps {
  clusters: ConflictCluster[];
}

export default function ConflictAlert({ clusters }: ConflictAlertProps) {
  if (clusters.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Conflicts
        </h3>
        <p className="text-gray-500 text-sm text-center py-4">
          No conflicts detected
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">
        Conflicts
        <span className="text-sm font-normal text-gray-400 ml-2">
          ({clusters.length} clusters)
        </span>
      </h3>
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {clusters.map((cluster, idx) => (
          <div
            key={idx}
            className="bg-orange-950 border border-orange-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-orange-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold text-orange-300">
                  Conflict Cluster
                </span>
              </div>
              <span className="text-xs font-medium text-orange-300 bg-orange-900 px-2 py-1 rounded">
                Gap: {cluster.credibility_gap.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2">
              {cluster.nodes.map((node) => (
                <div
                  key={node.id}
                  className="bg-gray-900 border border-gray-700 rounded p-3"
                >
                  <p className="text-sm text-gray-200 mb-2">{node.content}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{node.source_id}</span>
                    <span
                      className={`px-2 py-1 rounded font-medium ${
                        node.confidence >= 0.7
                          ? "bg-green-900 text-green-300"
                          : node.confidence >= 0.4
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-red-900 text-red-300"
                      }`}
                    >
                      {(node.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {cluster.nodes.length > 1 && (
              <div className="mt-3 pt-3 border-t border-orange-800">
                <p className="text-xs text-orange-300">
                  {cluster.nodes.length} conflicting claims detected
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
