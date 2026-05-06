import { useState } from "react";
import { api } from "../../api";
import type { RetractResultDetailed } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";

interface RetractPanelProps {
  onRetract: () => void;
}

export default function RetractPanel({ onRetract }: RetractPanelProps) {
  const [sourceId, setSourceId] = useState("study:withdrawn-2023");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RetractResultDetailed | null>(null);

  const handleRetract = async () => {
    if (!sourceId.trim()) {
      alert("Please enter a source ID");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to retract all claims from source "${sourceId}"?\n\nThis action is IRREVERSIBLE and will cascade through the knowledge graph.`
    );

    if (!confirmed) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await api.post<RetractResultDetailed>("/auditor/retract", {
        source_id: sourceId,
        reason: reason || "Manual retraction",
      });
      setResult(data);
      onRetract();
    } catch (err) {
      console.error("Failed to retract source:", err);
      alert(`Retraction failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h5 className="text-sm font-semibold text-red-400 mb-1">
              Warning: Irreversible Action
            </h5>
            <p className="text-sm text-red-300/80">
              Source retraction permanently removes all claims and cascades through dependent nodes. This cannot be undone.
            </p>
          </div>
        </div>
      </div>

      {/* Retraction form */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-100 mb-2">
          Retract a Source
        </h4>
        <p className="text-xs text-gray-500 mb-2">
          When a source is discredited (a study retracted, a witness recants),
          every claim they contributed needs to be removed. This doesn't just delete
          the claims; it cascades through everything that depended on them, updating
          the picture automatically.
        </p>
        <p className="text-[11px] text-gray-600 mb-6">
          Technical: retracts all nodes from the source and propagates through dependent
          edges in the knowledge graph. Try retracting "study:withdrawn-2023"
          to see the cascade.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Source ID
            </label>
            <input
              type="text"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              placeholder="e.g., study:withdrawn-2023"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for retraction..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            onClick={handleRetract}
            disabled={loading || !sourceId.trim()}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? "Retracting..." : "Retract All Claims"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400 font-medium mb-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Retraction Completed
            </div>
            <p className="text-sm text-green-300/80">
              Source claims have been successfully retracted
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Nodes Retracted</div>
              <div className="text-3xl font-bold text-red-400">
                {result.nodes_retracted}
              </div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Cascade Depth</div>
              <div className="text-3xl font-bold text-yellow-400">
                {result.cascade_depth}
              </div>
            </div>
          </div>

          {result.node_ids.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h5 className="text-sm font-semibold text-gray-300 mb-3">
                Retracted Node IDs ({result.node_ids.length})
              </h5>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {result.node_ids.map((id) => (
                  <div
                    key={id}
                    className="text-xs font-mono text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded"
                  >
                    {id}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
