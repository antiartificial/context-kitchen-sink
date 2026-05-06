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
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
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
            <h4 className="text-lg font-semibold text-[#6366f1] mb-3 inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
              Summary
            </h4>
            <p className="text-gray-200 leading-relaxed">{narrative.summary}</p>
          </div>

          {/* Main claim */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-100 mb-4 inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Main Claim
            </h4>
            <ClaimCard claim={narrative.claim} />
          </div>

          {/* Evidence */}
          {narrative.evidence.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-100 mb-4 inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
              <h4 className="text-lg font-semibold text-red-400 mb-4 inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
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
              <h4 className="text-lg font-semibold text-gray-100 mb-4 inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.086-9.086a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 006.364 6.364l1.757-1.757" />
                </svg>
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
            <h4 className="text-lg font-semibold text-gray-100 mb-3 inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
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
