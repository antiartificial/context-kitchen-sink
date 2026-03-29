import type { ConflictCluster } from "../../types";

interface ConflictAlertProps {
  clusters: ConflictCluster[];
}

export default function ConflictAlert({ clusters }: ConflictAlertProps) {
  if (clusters.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-4">
        No conflicts detected
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {clusters.map((cluster, idx) => (
        <div
          key={idx}
          className="bg-orange-950/50 border border-orange-800/50 rounded p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-orange-300">
              Cluster {idx + 1}
            </span>
            <span className="text-[10px] font-medium text-orange-300 bg-orange-900/50 px-1.5 py-0.5 rounded">
              Gap: {cluster.credibility_gap.toFixed(2)}
            </span>
          </div>

          <div className="space-y-1.5">
            {cluster.nodes.map((node) => (
              <div key={node.id} className="bg-gray-900/80 rounded p-2 text-xs">
                <p className="text-gray-200 mb-1">{node.content}</p>
                <div className="flex items-center justify-between text-gray-500">
                  <span>{node.source_id}</span>
                  <span className={`font-mono ${
                    node.confidence >= 0.7 ? "text-green-400" :
                    node.confidence >= 0.4 ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {(node.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
