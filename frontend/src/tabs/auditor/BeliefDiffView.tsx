import { useState } from "react";
import { api } from "../../api";
import type { BeliefDiffDetailed, BeliefConflict } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfidenceBadge from "../../components/ConfidenceBadge";

export default function BeliefDiffView() {
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState<BeliefDiffDetailed | null>(null);

  const handleCompute = async () => {
    setLoading(true);
    try {
      const result = await api.post<BeliefDiffDetailed>("/auditor/belief-diff", {});
      setDiff(result);
    } catch (err) {
      console.error("Failed to compute belief diff:", err);
    } finally {
      setLoading(false);
    }
  };

  const getGapColor = (gap: number) => {
    if (gap >= 0.4) return "text-red-400";
    if (gap >= 0.2) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-100 mb-2">
          Belief Diff
        </h4>
        <p className="text-xs text-gray-500 mb-2">
          Find every place where sources disagree. The trial says the drug is safe; the
          withdrawn study claimed side effects. This tool lays those contradictions
          side-by-side so you can see what&rsquo;s actually in dispute.
        </p>
        <p className="text-xs text-gray-500 mb-2">
          <strong className="text-gray-400">What the numbers mean:</strong>{" "}
          <em>Contradiction Weight</em> measures how directly two claims oppose each
          other (higher = stronger disagreement). <em>Credibility Gap</em> shows how
          far apart the sources are in trustworthiness &mdash; a large gap means a
          trusted source disagrees with a less trusted one, making the conflict easier
          to resolve. A small gap means both sides are equally credible, requiring
          more investigation.
        </p>
        <p className="text-[11px] text-gray-600 mb-4">
          Technical: compares epistemic states across the knowledge graph, surfacing
          contradiction edges with credibility-gap scoring.
        </p>
        <button
          onClick={handleCompute}
          disabled={loading}
          className="px-6 py-2 bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {loading ? "Computing..." : "Compute Belief Diff"}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Results */}
      {!loading && diff && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Conflicts"
              value={diff.total_conflicts.toString()}
              color="text-red-400"
            />
            <StatCard
              label="Namespace"
              value={diff.namespace}
              color="text-blue-400"
            />
            <StatCard
              label="Avg Credibility Gap"
              value={`${(diff.avg_credibility_gap * 100).toFixed(1)}%`}
              color={getGapColor(diff.avg_credibility_gap)}
            />
          </div>

          {/* Conflicts */}
          {diff.conflicts.length > 0 ? (
            <div className="space-y-4">
              {diff.conflicts.map((conflict, idx) => (
                <ConflictCard key={idx} conflict={conflict} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">No conflicts detected</p>
            </div>
          )}
        </div>
      )}

      {!loading && !diff && (
        <div className="text-center py-12 text-gray-500">
          Click "Compute Belief Diff" to analyze conflicts
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

interface ConflictCardProps {
  conflict: BeliefConflict;
}

function ConflictCard({ conflict }: ConflictCardProps) {
  const getWeightColor = (weight: number) => {
    if (weight >= 0.8) return "bg-red-500";
    if (weight >= 0.5) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800">
        {/* Claim A */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h5 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Claim A
            </h5>
            <ConfidenceBadge value={conflict.claim_a.confidence} />
          </div>
          <p className="text-gray-200 mb-4">{conflict.claim_a.content}</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>Source: {conflict.claim_a.source_id}</span>
            <span>Supporters: {conflict.claim_a.supporter_count}</span>
          </div>
        </div>

        {/* Claim B */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h5 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Claim B
            </h5>
            <ConfidenceBadge value={conflict.claim_b.confidence} />
          </div>
          <p className="text-gray-200 mb-4">{conflict.claim_b.content}</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>Source: {conflict.claim_b.source_id}</span>
            <span>Supporters: {conflict.claim_b.supporter_count}</span>
          </div>
        </div>
      </div>

      {/* Conflict metrics */}
      <div className="bg-gray-800/50 px-6 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Contradiction Weight:</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getWeightColor(conflict.contradiction_weight)} transition-all`}
                  style={{ width: `${conflict.contradiction_weight * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-300">
                {(conflict.contradiction_weight * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Credibility Gap:</span>
            <span className="text-sm font-semibold text-yellow-400">
              {(conflict.credibility_gap * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <p className="text-[11px] text-gray-500">
          {conflict.contradiction_weight >= 0.8
            ? "These claims directly contradict each other."
            : conflict.contradiction_weight >= 0.5
            ? "These claims partially conflict."
            : "Mild tension between these claims."
          }
          {" "}
          {conflict.credibility_gap >= 0.3
            ? "The large credibility gap suggests the more trusted source likely prevails."
            : conflict.credibility_gap >= 0.1
            ? "Both sources have similar credibility — this conflict needs more evidence to resolve."
            : "Both sources are equally credible — this is a genuine open question."
          }
        </p>
      </div>
    </div>
  );
}
