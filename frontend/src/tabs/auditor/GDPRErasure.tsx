import { useState } from "react";
import { api } from "../../api";
import type { ErasureReportDetailed } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";

interface GDPRErasureProps {
  onErase: () => void;
}

export default function GDPRErasure({ onErase }: GDPRErasureProps) {
  const [sourceId, setSourceId] = useState("patient:user-789");
  const [reason, setReason] = useState("GDPR Article 17 right to erasure");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ErasureReportDetailed | null>(null);

  const handleErase = async () => {
    if (!sourceId.trim()) {
      alert("Please enter a source ID");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to process GDPR erasure for source "${sourceId}"?\n\nThis will permanently remove:\n- All nodes from this source\n- Associated vectors\n- Related edges\n- Event logs (redacted)\n\nThis action is IRREVERSIBLE.`
    );

    if (!confirmed) return;

    setLoading(true);
    setReport(null);
    try {
      const data = await api.post<ErasureReportDetailed>("/auditor/gdpr-erase", {
        source_id: sourceId,
        reason: reason || "GDPR Article 17 right to erasure",
      });
      setReport(data);
      onErase();
    } catch (err) {
      console.error("Failed to process GDPR erasure:", err);
      alert(`GDPR erasure failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* GDPR info banner */}
      <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="w-5 h-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h5 className="text-sm font-semibold text-blue-400 mb-1">
              GDPR Compliance
            </h5>
            <p className="text-sm text-blue-300/80">
              Right to erasure (Article 17) — complete removal of personal data while maintaining audit trail compliance.
            </p>
          </div>
        </div>
      </div>

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
              Warning: Permanent Data Removal
            </h5>
            <p className="text-sm text-red-300/80">
              GDPR erasure permanently deletes all data associated with the source. This operation cannot be undone.
            </p>
          </div>
        </div>
      </div>

      {/* Erasure form */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-100 mb-4">
          Process GDPR Erasure
        </h4>
        <p className="text-sm text-gray-400 mb-6">
          Completely remove all data associated with a source in compliance with GDPR Article 17.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Source ID (Data Subject)
            </label>
            <input
              type="text"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              placeholder="e.g., patient:user-789, user:customer-123"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Legal Basis
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="GDPR Article 17 right to erasure"
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            onClick={handleErase}
            disabled={loading || !sourceId.trim()}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? "Processing Erasure..." : "Process Erasure"}
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
      {!loading && report && (
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
              GDPR Erasure Completed
            </div>
            <p className="text-sm text-green-300/80">
              All data for source "{report.source_id}" has been successfully erased from namespace "{report.namespace}"
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Nodes Retracted</div>
              <div className="text-2xl font-bold text-red-400">
                {report.nodes_retracted}
              </div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Vectors Deleted</div>
              <div className="text-2xl font-bold text-orange-400">
                {report.vectors_deleted}
              </div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Edges Invalidated</div>
              <div className="text-2xl font-bold text-yellow-400">
                {report.edges_invalidated}
              </div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Events Redacted</div>
              <div className="text-2xl font-bold text-blue-400">
                {report.events_redacted}
              </div>
            </div>
          </div>

          {/* Compliance notice */}
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-blue-400 mb-2">
              Compliance Notice
            </h5>
            <p className="text-sm text-blue-300/80">
              A redacted audit trail entry has been preserved for compliance purposes. The entry records that erasure occurred without retaining any personal data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
