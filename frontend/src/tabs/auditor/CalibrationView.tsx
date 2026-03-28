import { useState } from "react";
import { api } from "../../api";
import type { CalibrationResultDetailed } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function CalibrationView() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalibrationResultDetailed | null>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const data = await api.post<CalibrationResultDetailed>("/auditor/calibration");
      setResult(data);
    } catch (err) {
      console.error("Failed to run calibration:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMetricColor = (value: number, lower: number, upper: number) => {
    if (value < lower) return "text-green-400 bg-green-900/20 border-green-800/50";
    if (value < upper) return "text-yellow-400 bg-yellow-900/20 border-yellow-800/50";
    return "text-red-400 bg-red-900/20 border-red-800/50";
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-100 mb-4">
          Calibration Analysis
        </h4>
        <p className="text-sm text-gray-400 mb-4">
          Evaluate how well predicted confidence scores match actual outcomes.
        </p>
        <button
          onClick={handleRun}
          disabled={loading}
          className="px-6 py-2 bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {loading ? "Running..." : "Run Calibration"}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="space-y-6">
          {/* Headline metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Brier Score"
              value={result.brier_score.toFixed(4)}
              description="Lower is better"
              colorClass={getMetricColor(result.brier_score, 0.1, 0.25)}
            />
            <MetricCard
              label="ECE"
              value={result.ece.toFixed(4)}
              description="Expected Calibration Error"
              colorClass={getMetricColor(result.ece, 0.1, 0.25)}
            />
            <MetricCard
              label="MCE"
              value={result.mce.toFixed(4)}
              description="Maximum Calibration Error"
              colorClass={getMetricColor(result.mce, 0.1, 0.25)}
            />
          </div>

          {/* Sample count */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Sample Count</span>
              <span className="text-lg font-semibold text-gray-100">
                {result.sample_count.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Calibration plot */}
          {result.bins.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-100 mb-4">
                Calibration Plot
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                Points should lie on the diagonal for perfect calibration
              </p>
              <CalibrationChart bins={result.bins} />
            </div>
          )}

          {/* Platt scaler info */}
          {result.platt.fitted && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-100 mb-4">
                Platt Scaler Parameters
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Parameter A</div>
                  <div className="text-xl font-semibold text-blue-400">
                    {result.platt.a.toFixed(4)}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Parameter B</div>
                  <div className="text-xl font-semibold text-blue-400">
                    {result.platt.b.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Isotonic info */}
          {result.isotonic.fitted && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-300">
                  Isotonic regression calibration fitted
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !result && (
        <div className="text-center py-12 text-gray-500">
          Click "Run Calibration" to analyze model calibration
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  colorClass: string;
}

function MetricCard({ label, value, description, colorClass }: MetricCardProps) {
  return (
    <div className={`border rounded-lg p-4 ${colorClass}`}>
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-75">{description}</div>
    </div>
  );
}

interface CalibrationChartProps {
  bins: Array<{
    bin_start: number;
    bin_end: number;
    avg_predicted: number;
    avg_actual: number;
    count: number;
  }>;
}

function CalibrationChart({ bins }: CalibrationChartProps) {
  const width = 400;
  const height = 400;
  const padding = 40;
  const plotWidth = width - 2 * padding;
  const plotHeight = height - 2 * padding;

  const maxCount = Math.max(...bins.map((b) => b.count));

  return (
    <svg width={width} height={height} className="mx-auto">
      {/* Background */}
      <rect
        x={padding}
        y={padding}
        width={plotWidth}
        height={plotHeight}
        fill="#1f2937"
        stroke="#374151"
        strokeWidth="2"
      />

      {/* Perfect calibration diagonal */}
      <line
        x1={padding}
        y1={padding + plotHeight}
        x2={padding + plotWidth}
        y2={padding}
        stroke="#6366f1"
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.5"
      />

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((val) => {
        const x = padding + val * plotWidth;
        const y = padding + (1 - val) * plotHeight;
        return (
          <g key={val}>
            <line
              x1={x}
              y1={padding}
              x2={x}
              y2={padding + plotHeight}
              stroke="#374151"
              strokeWidth="1"
              opacity="0.3"
            />
            <line
              x1={padding}
              y1={y}
              x2={padding + plotWidth}
              y2={y}
              stroke="#374151"
              strokeWidth="1"
              opacity="0.3"
            />
          </g>
        );
      })}

      {/* Data points */}
      {bins.map((bin, idx) => {
        const x = padding + bin.avg_predicted * plotWidth;
        const y = padding + (1 - bin.avg_actual) * plotHeight;
        const radius = 3 + (bin.count / maxCount) * 8;

        return (
          <g key={idx}>
            <circle
              cx={x}
              cy={y}
              r={radius}
              fill="#6366f1"
              stroke="#8b87f3"
              strokeWidth="2"
              opacity="0.8"
            />
            <title>
              Predicted: {(bin.avg_predicted * 100).toFixed(1)}%{"\n"}
              Actual: {(bin.avg_actual * 100).toFixed(1)}%{"\n"}
              Count: {bin.count}
            </title>
          </g>
        );
      })}

      {/* Axis labels */}
      <text
        x={width / 2}
        y={height - 10}
        textAnchor="middle"
        fill="#9ca3af"
        fontSize="12"
      >
        Predicted Probability
      </text>
      <text
        x={15}
        y={height / 2}
        textAnchor="middle"
        fill="#9ca3af"
        fontSize="12"
        transform={`rotate(-90, 15, ${height / 2})`}
      >
        Actual Frequency
      </text>

      {/* Tick labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((val) => (
        <g key={val}>
          <text
            x={padding + val * plotWidth}
            y={height - padding + 20}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="10"
          >
            {val.toFixed(2)}
          </text>
          <text
            x={padding - 10}
            y={padding + (1 - val) * plotHeight + 4}
            textAnchor="end"
            fill="#9ca3af"
            fontSize="10"
          >
            {val.toFixed(2)}
          </text>
        </g>
      ))}
    </svg>
  );
}
