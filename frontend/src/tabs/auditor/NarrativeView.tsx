import { useState } from "react";
import { api } from "../../api";
import type { AuditorNode, NarrativeReportDetailed, CitedClaim } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfidenceBadge from "../../components/ConfidenceBadge";

interface NarrativeViewProps {
  nodes: AuditorNode[];
}

export default function NarrativeView({ nodes }: NarrativeViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [narrative, setNarrative] = useState<NarrativeReportDetailed | null>(null);

  const handleGenerate = async () => {
    if (!selectedNodeId) return;

    setLoading(true);
    try {
      const result = await api.post<NarrativeReportDetailed>("/auditor/narrative", {
        node_id: selectedNodeId,
      });
      setNarrative(result);
    } catch (err) {
      console.error("Failed to generate narrative:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Node selection and generation */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-100 mb-2">
          Narrative Explanation
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Pick any claim and get the full story behind it: who said it, what supports or
          contradicts it, and where it came from. Think of it as asking "why should
          I believe this?" and getting a sourced, structured answer.
        </p>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Node
            </label>
            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent"
            >
              <option value="">Choose a node...</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.content.slice(0, 80)}
                  {node.content.length > 80 ? "..." : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!selectedNodeId || loading}
            className="px-6 py-2 bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Generating..." : "Generate Narrative"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Narrative results */}
      {!loading && narrative && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-[#6366f1]/10 border border-[#6366f1]/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-[#6366f1] mb-3">
              Summary
            </h4>
            <p className="text-gray-200 leading-relaxed">{narrative.summary}</p>
          </div>

          {/* Main claim */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-100 mb-4">
              Main Claim
            </h4>
            <ClaimCard claim={narrative.claim} />
          </div>

          {/* Evidence */}
          {narrative.evidence.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-100 mb-4">
                Supporting Evidence ({narrative.evidence.length})
              </h4>
              <div className="space-y-3">
                {narrative.evidence.map((claim, idx) => (
                  <ClaimCard key={idx} claim={claim} />
                ))}
              </div>
            </div>
          )}

          {/* Contradictions */}
          {narrative.contradictions.length > 0 && (
            <div className="bg-red-900/10 border border-red-800/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-red-400 mb-4">
                Contradictions ({narrative.contradictions.length})
              </h4>
              <div className="space-y-3">
                {narrative.contradictions.map((claim, idx) => (
                  <ClaimCard key={idx} claim={claim} variant="danger" />
                ))}
              </div>
            </div>
          )}

          {/* Provenance chain */}
          {narrative.provenance.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-100 mb-4">
                Provenance Chain ({narrative.provenance.length})
              </h4>
              <div className="space-y-3">
                {narrative.provenance.map((claim, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/50 flex items-center justify-center text-xs font-medium text-[#6366f1]">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <ClaimCard claim={claim} compact />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence explanation */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-100 mb-3">
              Confidence Explanation
            </h4>
            <p className="text-gray-300 leading-relaxed">
              {narrative.confidence_explanation}
            </p>
          </div>
        </div>
      )}

      {!loading && !narrative && (
        <div className="text-center py-12 text-gray-500">
          Select a node and generate a narrative to see results
        </div>
      )}
    </div>
  );
}

interface ClaimCardProps {
  claim: CitedClaim;
  variant?: "default" | "danger";
  compact?: boolean;
}

function ClaimCard({ claim, variant = "default", compact = false }: ClaimCardProps) {
  const borderColor = variant === "danger" ? "border-red-800/50" : "border-gray-700";
  const bgColor = variant === "danger" ? "bg-red-900/10" : "bg-gray-800/50";

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 ${compact ? "p-3" : ""}`}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <p className={`text-gray-200 flex-1 ${compact ? "text-sm" : ""}`}>{claim.text}</p>
        <ConfidenceBadge value={claim.confidence} />
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Source: {claim.source_id}</span>
        <span>Node: {claim.node_id.slice(0, 8)}</span>
        {claim.relation && <span className="text-gray-400">Relation: {claim.relation}</span>}
      </div>
    </div>
  );
}
