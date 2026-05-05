import { useState } from "react";
import { api } from "../../api";
import type { GapReportDetailed, KnowledgeGap } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import ScoreBar from "../../components/ScoreBar";

export default function GapsView() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<GapReportDetailed | null>(null);
  const [topK, setTopK] = useState(10);
  const [minGapSize, setMinGapSize] = useState(0.3);
  const [maxGaps, setMaxGaps] = useState(10);

  const handleDetect = async () => {
    setLoading(true);
    try {
      const result = await api.post<GapReportDetailed>("/auditor/knowledge-gaps", {
        top_k: topK,
        min_gap_size: minGapSize,
        max_gaps: maxGaps,
      });
      setReport(result);
    } catch (err) {
      console.error("Failed to detect gaps:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTemporalGap = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(0)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(0)}m`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
    return `${(seconds / 86400).toFixed(1)}d`;
  };

  const getCoverageColor = (score: number): "success" | "warning" | "danger" => {
    if (score >= 0.8) return "success";
    if (score >= 0.5) return "warning";
    return "danger";
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-100 mb-2">
          Knowledge Gaps
        </h4>
        <p className="text-xs text-gray-500 mb-2">
          Spot the blind spots. Maybe there&rsquo;s plenty of data on efficacy but almost
          nothing on long-term side effects, or the most recent evidence is months old.
          This tool finds areas where the knowledge base is thin, outdated, or uncertain
          &mdash; so you know where to look next.
        </p>
        <p className="text-xs text-gray-500 mb-2">
          <strong className="text-gray-400">Reading the results:</strong>{" "}
          <em>Coverage Score</em> is the overall completeness (higher is better; below 50%
          means major blind spots). Each gap shows a <em>Density Score</em> (how sparse
          the data is in that area &mdash; lower = emptier), a <em>Confidence Gap</em>
          (how uncertain existing claims are), and a <em>Temporal Gap</em> (how long since
          that topic was last updated).
        </p>
        <p className="text-[11px] text-gray-600 mb-6">
          Technical: analyzes vector-space density, temporal recency, and confidence
          distribution to locate sparse regions in the knowledge graph.
        </p>

        <p className="text-xs text-gray-500 mb-6">
          <strong className="text-gray-400">Adjusting the sliders:</strong>{" "}
          <em>Top K</em> controls how many claims to scan (higher = more thorough, slower).{" "}
          <em>Min Gap Size</em> sets the threshold for what counts as a gap &mdash; lower
          values surface smaller blind spots, higher values only show major ones.{" "}
          <em>Max Gaps</em> limits how many results to return.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Top K slider */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Top K: {topK}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#6366f1]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5</span>
              <span>50</span>
            </div>
          </div>

          {/* Min gap size slider */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Min Gap Size: {minGapSize.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              value={minGapSize}
              onChange={(e) => setMinGapSize(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#6366f1]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.1</span>
              <span>0.9</span>
            </div>
          </div>

          {/* Max gaps slider */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Gaps: {maxGaps}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={maxGaps}
              onChange={(e) => setMaxGaps(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#6366f1]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>20</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDetect}
          disabled={loading}
          className="px-6 py-2 bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {loading ? "Detecting..." : "Detect Gaps"}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Results */}
      {!loading && report && (
        <div className="space-y-6">
          {/* Coverage score */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-100 mb-2">
              Overall Coverage Score
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              {report.coverage_score >= 0.8
                ? "The knowledge base has strong coverage. Most topics have adequate data."
                : report.coverage_score >= 0.5
                ? "Moderate coverage — some areas are well-covered but others need attention."
                : "Significant gaps in coverage. Many topics lack sufficient data to draw reliable conclusions."
              }
            </p>
            <ScoreBar
              value={report.coverage_score}
              label="Coverage"
              color={getCoverageColor(report.coverage_score)}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Nodes</div>
              <div className="text-2xl font-bold text-blue-400">{report.total_nodes}</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Gaps Detected</div>
              <div className="text-2xl font-bold text-yellow-400">{report.gaps_detected}</div>
            </div>
          </div>

          {/* Gap cards */}
          {report.gaps.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-100">
                Knowledge Gaps
              </h4>
              <p className="text-xs text-gray-500">
                Each gap below represents a topic area where the system has identified
                insufficient, uncertain, or outdated information. These are the areas
                that would benefit most from new evidence.
              </p>
              {report.gaps.map((gap) => (
                <GapCard key={gap.id} gap={gap} formatTemporalGap={formatTemporalGap} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">No gaps detected with current parameters</p>
            </div>
          )}
        </div>
      )}

      {!loading && !report && (
        <div className="text-center py-12 text-gray-500">
          Configure parameters and click "Detect Gaps" to analyze
        </div>
      )}
    </div>
  );
}

interface GapCardProps {
  gap: KnowledgeGap;
  formatTemporalGap: (seconds: number) => string;
}

function GapCard({ gap, formatTemporalGap }: GapCardProps) {
  const confPct = gap.confidence_gap * 100;
  const densityPct = gap.density_score * 100;

  const confLabel = confPct >= 40
    ? "Claims in this area are highly uncertain"
    : confPct >= 20
    ? "Moderate uncertainty in existing claims"
    : "Existing claims are fairly confident";

  const temporalLabel = gap.temporal_gap_seconds >= 86400 * 30
    ? "No recent data — this area is going stale"
    : gap.temporal_gap_seconds >= 86400
    ? "Last updated days ago"
    : "Recently updated";

  const densityLabel = densityPct <= 20
    ? "Very few claims cover this topic"
    : densityPct <= 50
    ? "Some data exists but coverage is thin"
    : "Reasonable coverage, but gaps remain";

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h5 className="text-sm font-semibold text-gray-300 mb-2">
            Gap ID: {gap.id}
          </h5>
          {gap.nearest_topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {gap.nearest_topics.map((topic, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#6366f1]/20 text-[#6366f1] border border-[#6366f1]/30"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <ScoreBar
            value={gap.density_score}
            label="Density Score"
            color="accent"
          />
          <p className="text-[11px] text-gray-500 mt-1">{densityLabel}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Confidence Gap</div>
            <div className="text-lg font-semibold text-yellow-400">
              {confPct.toFixed(1)}%
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{confLabel}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Temporal Gap</div>
            <div className="text-lg font-semibold text-blue-400">
              {formatTemporalGap(gap.temporal_gap_seconds)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{temporalLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
