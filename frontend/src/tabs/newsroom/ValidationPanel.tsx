import { useState } from "react";
import { api } from "../../api";
import type { Source } from "../../types";

interface ValidationPanelProps {
  sources: Source[];
  onValidate: () => void;
}

export default function ValidationPanel({
  sources,
  onValidate,
}: ValidationPanelProps) {
  const [sourceId, setSourceId] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<{
    validated: boolean;
    oldAlpha: number;
    oldBeta: number;
    newAlpha: number;
    newBeta: number;
    oldCredibility: number;
    newCredibility: number;
  } | null>(null);

  const handleValidate = async (validated: boolean) => {
    if (!sourceId) return;

    const source = sources.find((s) => s.id === sourceId);
    if (!source) return;

    setIsValidating(true);
    setResult(null);

    try {
      await api.post("/newsroom/validate", {
        source_id: sourceId,
        validated,
      });

      // Store old values before refresh
      const oldAlpha = source.alpha;
      const oldBeta = source.beta;
      const oldCredibility = source.credibility;

      // Wait for data to refresh
      await onValidate();

      // Get updated source
      const updatedSource = sources.find((s) => s.id === sourceId);
      if (updatedSource) {
        setResult({
          validated,
          oldAlpha,
          oldBeta,
          newAlpha: updatedSource.alpha,
          newBeta: updatedSource.beta,
          oldCredibility,
          newCredibility: updatedSource.credibility,
        });
      }
    } catch (err) {
      console.error("Failed to validate:", err);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">
        Validation Panel
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Validate or refute claims to update source credibility via Bayesian updates
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Source
          </label>
          <select
            value={sourceId}
            onChange={(e) => {
              setSourceId(e.target.value);
              setResult(null);
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a source...</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.external_id || s.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleValidate(true)}
            disabled={!sourceId || isValidating}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            Validate
          </button>
          <button
            onClick={() => handleValidate(false)}
            disabled={!sourceId || isValidating}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            Refute
          </button>
        </div>

        {result && (
          <div
            className={`p-4 rounded-lg border ${
              result.validated
                ? "bg-green-950 border-green-800"
                : "bg-red-950 border-red-800"
            }`}
          >
            <div className="space-y-2 text-sm">
              <div
                className={`font-semibold ${
                  result.validated ? "text-green-400" : "text-red-400"
                }`}
              >
                {result.validated ? "Validated" : "Refuted"}
              </div>
              <div className="text-gray-300">
                <div>
                  Alpha: {result.oldAlpha.toFixed(1)} → {result.newAlpha.toFixed(1)}
                </div>
                <div>
                  Beta: {result.oldBeta.toFixed(1)} → {result.newBeta.toFixed(1)}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  Credibility:{" "}
                  {(result.oldCredibility * 100).toFixed(1)}% →{" "}
                  {(result.newCredibility * 100).toFixed(1)}%
                  <span
                    className={`ml-2 font-medium ${
                      result.newCredibility > result.oldCredibility
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    (
                    {result.newCredibility > result.oldCredibility ? "+" : ""}
                    {((result.newCredibility - result.oldCredibility) * 100).toFixed(1)}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
