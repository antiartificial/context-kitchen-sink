import { useState } from "react";
import { api } from "../../api";
import type { Source } from "../../types";

interface ValidationPanelProps {
  sources: Source[];
  onValidate: () => void;
}

export default function ValidationPanel({ sources, onValidate }: ValidationPanelProps) {
  const [sourceId, setSourceId] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<{
    validated: boolean;
    oldCredibility: number;
    newCredibility: number;
  } | null>(null);

  const handleValidate = async (validated: boolean) => {
    if (!sourceId) return;
    const source = sources.find((s) => (s.external_id || s.id) === sourceId);
    if (!source) return;

    setIsValidating(true);
    setResult(null);

    try {
      const oldCred = source.credibility;
      await api.post("/newsroom/validate", { source_id: sourceId, validated });
      await onValidate();
      const updated = sources.find((s) => (s.external_id || s.id) === sourceId);
      setResult({
        validated,
        oldCredibility: oldCred,
        newCredibility: updated?.credibility ?? oldCred,
      });
    } catch (err) {
      console.error("Failed to validate:", err);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">
        Validate or refute a source to update credibility via Bayesian update.
      </p>

      <select
        value={sourceId}
        onChange={(e) => { setSourceId(e.target.value); setResult(null); }}
        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Select source...</option>
        {sources.map((s) => (
          <option key={s.id} value={s.external_id || s.id}>
            {s.external_id || s.id}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={() => handleValidate(true)}
          disabled={!sourceId || isValidating}
          className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-xs font-medium"
        >
          Validate
        </button>
        <button
          onClick={() => handleValidate(false)}
          disabled={!sourceId || isValidating}
          className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-xs font-medium"
        >
          Refute
        </button>
      </div>

      {result && (
        <div className={`text-xs px-2 py-1.5 rounded ${
          result.validated ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"
        }`}>
          {result.validated ? "Validated" : "Refuted"}: credibility{" "}
          {(result.oldCredibility * 100).toFixed(1)}% → {(result.newCredibility * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
