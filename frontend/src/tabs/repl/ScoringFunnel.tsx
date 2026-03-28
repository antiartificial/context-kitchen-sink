import { ReplResult } from '../../types';

interface ScoringFunnelProps {
  result: ReplResult | null;
}

export function ScoringFunnel({ result }: ScoringFunnelProps) {
  if (!result || !result.results || result.results.length === 0) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-semibold mb-3 text-gray-300">Scoring Model</h3>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
          contextdb scores results using 4 weighted components:{' '}
          <span className="text-blue-400 font-semibold">Similarity</span> (vector cosine
          distance),{' '}
          <span className="text-green-400 font-semibold">Confidence</span> (source credibility
          × claim confidence),{' '}
          <span className="text-yellow-400 font-semibold">Recency</span> (temporal decay), and{' '}
          <span className="text-purple-400 font-semibold">Utility</span> (task-outcome
          feedback). Weights vary by namespace mode.
        </p>
      </div>
    );
  }

  const results = result.results;

  // Calculate statistics
  const scores = results.map((r) => r.score);
  const similarityScores = results.map((r) => r.similarity_score);
  const confidenceScores = results.map((r) => r.confidence_score);
  const recencyScores = results.map((r) => r.recency_score);
  const utilityScores = results.map((r) => r.utility_score);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const min = (arr: number[]) => Math.min(...arr);
  const max = (arr: number[]) => Math.max(...arr);

  const avgSimilarity = avg(similarityScores);
  const avgConfidence = avg(confidenceScores);
  const avgRecency = avg(recencyScores);
  const avgUtility = avg(utilityScores);

  const minScore = min(scores);
  const maxScore = max(scores);

  const uniqueSources = new Set(results.map((r) => r.source_id)).size;
  const uniqueLabels = new Set(results.flatMap((r) => r.labels)).size;

  // Sorted results for distribution chart
  const sortedResults = [...results].sort((a, b) => b.score - a.score);

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-300">Scoring Dashboard</h3>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Results" value={results.length.toString()} />
        <StatCard label="Unique Sources" value={uniqueSources.toString()} />
        <StatCard label="Unique Labels" value={uniqueLabels.toString()} />
        <StatCard
          label="Score Range"
          value={`${minScore.toFixed(3)} - ${maxScore.toFixed(3)}`}
        />
      </div>

      {/* Score component averages - Gauges */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-gray-400 mb-4">Average Score Components</h4>
        <div className="grid grid-cols-4 gap-6">
          <GaugeChart label="Similarity" value={avgSimilarity} color="#3b82f6" />
          <GaugeChart label="Confidence" value={avgConfidence} color="#22c55e" />
          <GaugeChart label="Recency" value={avgRecency} color="#eab308" />
          <GaugeChart label="Utility" value={avgUtility} color="#a855f7" />
        </div>
      </div>

      {/* Score distribution - Horizontal bars */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-gray-400 mb-4">
          Score Distribution (Top {Math.min(20, results.length)} Results)
        </h4>
        <div className="space-y-1">
          {sortedResults.slice(0, 20).map((r, i) => (
            <div key={r.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-6 text-right">{i + 1}</span>
              <div className="flex-1 h-6 bg-gray-800 rounded-sm overflow-hidden relative">
                {/* Similarity */}
                <div
                  className="absolute h-full bg-blue-500/80"
                  style={{
                    left: 0,
                    width: `${r.similarity_score * 100}%`,
                  }}
                />
                {/* Confidence */}
                <div
                  className="absolute h-full bg-green-500/80"
                  style={{
                    left: `${r.similarity_score * 100}%`,
                    width: `${r.confidence_score * 100 - r.similarity_score * 100}%`,
                  }}
                />
                {/* Recency */}
                <div
                  className="absolute h-full bg-yellow-500/80"
                  style={{
                    left: `${(r.similarity_score + r.confidence_score) * 50}%`,
                    width: `${r.recency_score * 100 - (r.similarity_score + r.confidence_score) * 50}%`,
                  }}
                />
                {/* Utility */}
                <div
                  className="absolute h-full bg-purple-500/80"
                  style={{
                    left: `${(r.similarity_score + r.confidence_score + r.recency_score) * 33.33}%`,
                    width: `${r.utility_score * 100 - (r.similarity_score + r.confidence_score + r.recency_score) * 33.33}%`,
                  }}
                />
                {/* Total score indicator */}
                <div
                  className="absolute h-full border-r-2 border-white"
                  style={{ left: `${r.score * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-gray-400 w-16 text-right">
                {r.score.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500/80 rounded-sm" />
            <span>Similarity</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500/80 rounded-sm" />
            <span>Confidence</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500/80 rounded-sm" />
            <span>Recency</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500/80 rounded-sm" />
            <span>Utility</span>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <div className="w-0.5 h-3 bg-white" />
            <span>Total Score</span>
          </div>
        </div>
      </div>

      {/* Score heatmap */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-gray-400 mb-4">
          Score Heatmap (Top {Math.min(15, results.length)} Results)
        </h4>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className="text-left text-gray-500 font-medium pb-2 pr-4">#</th>
                <th className="text-center text-gray-500 font-medium pb-2 px-2">Similarity</th>
                <th className="text-center text-gray-500 font-medium pb-2 px-2">Confidence</th>
                <th className="text-center text-gray-500 font-medium pb-2 px-2">Recency</th>
                <th className="text-center text-gray-500 font-medium pb-2 px-2">Utility</th>
                <th className="text-center text-gray-500 font-medium pb-2 px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.slice(0, 15).map((r, i) => (
                <tr key={r.id}>
                  <td className="text-gray-500 pr-4 py-1">{i + 1}</td>
                  <td className="px-2 py-1">
                    <HeatmapCell value={r.similarity_score} />
                  </td>
                  <td className="px-2 py-1">
                    <HeatmapCell value={r.confidence_score} />
                  </td>
                  <td className="px-2 py-1">
                    <HeatmapCell value={r.recency_score} />
                  </td>
                  <td className="px-2 py-1">
                    <HeatmapCell value={r.utility_score} />
                  </td>
                  <td className="px-2 py-1">
                    <HeatmapCell value={r.score} bold />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timing panel */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 mb-4">Query Timing</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-8 bg-gray-800 rounded overflow-hidden flex">
              <div
                className="bg-purple-600 flex items-center justify-center text-xs font-semibold"
                style={{
                  width: `${(result.parse_time_us / (result.parse_time_us + result.execute_time_us)) * 100}%`,
                }}
              >
                Parse
              </div>
              <div
                className="bg-blue-600 flex items-center justify-center text-xs font-semibold"
                style={{
                  width: `${(result.execute_time_us / (result.parse_time_us + result.execute_time_us)) * 100}%`,
                }}
              >
                Execute
              </div>
            </div>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Parse:</span>
              <span className="font-mono text-purple-400">
                {formatTime(result.parse_time_us)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Execute:</span>
              <span className="font-mono text-blue-400">
                {formatTime(result.execute_time_us)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Total:</span>
              <span className="font-mono text-white font-semibold">
                {formatTime(result.parse_time_us + result.execute_time_us)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

interface GaugeChartProps {
  label: string;
  value: number;
  color: string;
}

function GaugeChart({ label, value, color }: GaugeChartProps) {
  const percentage = value * 100;
  const angle = (percentage / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 80" className="w-full max-w-[120px]">
        {/* Background arc */}
        <path
          d="M 10 70 A 50 50 0 0 1 110 70"
          fill="none"
          stroke="#1f2937"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 10 70 A 50 50 0 0 1 110 70"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * 157} 157`}
        />
        {/* Needle */}
        <line
          x1="60"
          y1="70"
          x2="60"
          y2="25"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${angle} 60 70)`}
        />
        {/* Center dot */}
        <circle cx="60" cy="70" r="4" fill="white" />
        {/* Value text */}
        <text
          x="60"
          y="65"
          textAnchor="middle"
          className="text-xs font-mono fill-gray-300"
        >
          {value.toFixed(3)}
        </text>
      </svg>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
}

interface HeatmapCellProps {
  value: number;
  bold?: boolean;
}

function HeatmapCell({ value, bold }: HeatmapCellProps) {
  const getColor = (v: number) => {
    if (v >= 0.9) return 'bg-green-500';
    if (v >= 0.8) return 'bg-green-600';
    if (v >= 0.7) return 'bg-yellow-500';
    if (v >= 0.6) return 'bg-yellow-600';
    if (v >= 0.5) return 'bg-orange-500';
    if (v >= 0.4) return 'bg-orange-600';
    if (v >= 0.3) return 'bg-red-500';
    return 'bg-red-600';
  };

  return (
    <div
      className={`w-16 h-6 ${getColor(value)} rounded flex items-center justify-center text-white text-xs font-mono ${bold ? 'font-bold ring-2 ring-white' : ''}`}
    >
      {value.toFixed(3)}
    </div>
  );
}

function formatTime(us: number): string {
  if (us < 1000) return `${us}μs`;
  if (us < 1000000) return `${(us / 1000).toFixed(2)}ms`;
  return `${(us / 1000000).toFixed(2)}s`;
}
