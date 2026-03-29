import { useState } from "react";
import { api } from "../../api";
import type { AcquisitionSuggestion } from "../../types";
import LoadingSpinner from "../../components/LoadingSpinner";
import ScoreBar from "../../components/ScoreBar";

export default function ActiveLearning() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AcquisitionSuggestion[]>([]);
  const [budget, setBudget] = useState(5);

  const handleGetSuggestions = async () => {
    setLoading(true);
    try {
      const data = await api.get<AcquisitionSuggestion[]>(
        `/auditor/active-learning?budget=${budget}`
      );
      setSuggestions(data);
    } catch (err) {
      console.error("Failed to get suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "verify_claim":
        return "bg-blue-900/30 text-blue-400 border-blue-800/50";
      case "refresh_stale":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-800/50";
      case "low_confidence":
        return "bg-orange-900/30 text-orange-400 border-orange-800/50";
      case "high_utility":
        return "bg-green-900/30 text-green-400 border-green-800/50";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-800/50";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "verify_claim":
        return "Verify Claim";
      case "refresh_stale":
        return "Refresh Stale";
      case "low_confidence":
        return "Low Confidence";
      case "high_utility":
        return "High Utility";
      default:
        return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-100 mb-4">
          Active Learning Suggestions
        </h4>
        <p className="text-sm text-gray-400 mb-6">
          AI-guided suggestions for what to learn next to maximize knowledge improvement with minimal effort.
        </p>

        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Suggestion Budget: {budget}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#6366f1]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>20</span>
            </div>
          </div>

          <button
            onClick={handleGetSuggestions}
            disabled={loading}
            className="px-6 py-2 bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Loading..." : "Get Suggestions"}
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
      {!loading && suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-100">
              Suggestions ({suggestions.length})
            </h4>
            <span className="text-sm text-gray-400">
              Sorted by priority (highest first)
            </span>
          </div>

          {suggestions.map((suggestion, idx) => (
            <SuggestionCard
              key={idx}
              suggestion={suggestion}
              rank={idx + 1}
              getTypeColor={getTypeColor}
              getTypeLabel={getTypeLabel}
            />
          ))}
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Click "Get Suggestions" to receive active learning recommendations
        </div>
      )}
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: AcquisitionSuggestion;
  rank: number;
  getTypeColor: (type: string) => string;
  getTypeLabel: (type: string) => string;
}

function SuggestionCard({
  suggestion,
  rank,
  getTypeColor,
  getTypeLabel,
}: SuggestionCardProps) {
  const suggestionType = suggestion.type || "unknown";
  const description = suggestion.description || "No description available";
  const relatedNodeIds = suggestion.related_node_ids || [];
  const namespace = suggestion.namespace;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <div className="flex items-start gap-4">
        {/* Rank badge */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#6366f1]/20 border-2 border-[#6366f1]/50 flex items-center justify-center">
            <span className="text-lg font-bold text-[#6366f1]">#{rank}</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {/* Type badge */}
          <div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(suggestionType)}`}
            >
              {getTypeLabel(suggestionType)}
            </span>
          </div>

          {/* Priority score */}
          <div>
            <ScoreBar
              value={suggestion.priority}
              label="Priority"
              color="accent"
            />
          </div>

          {/* Description */}
          <div>
            <p className="text-gray-200 leading-relaxed">{description}</p>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {relatedNodeIds.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Related Nodes:</span>
                <span className="text-yellow-400 font-medium">
                  {relatedNodeIds.length}
                </span>
              </div>
            )}

            {namespace && (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Namespace:</span>
                <span className="text-blue-400 font-medium">{namespace}</span>
              </div>
            )}

          </div>

          {/* Related node IDs (collapsible if many) */}
          {relatedNodeIds.length > 0 && relatedNodeIds.length <= 5 && (
            <div className="mt-3">
              <details className="group">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 select-none">
                  Show related node IDs ({relatedNodeIds.length})
                </summary>
                <div className="mt-2 space-y-1">
                  {relatedNodeIds.map((nodeId, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-mono text-gray-500 bg-gray-800/30 px-2 py-1 rounded"
                    >
                      {nodeId}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {relatedNodeIds.length > 5 && (
            <div className="mt-3">
              <details className="group">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 select-none">
                  Show related node IDs ({relatedNodeIds.length})
                </summary>
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {relatedNodeIds.map((nodeId, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-mono text-gray-500 bg-gray-800/30 px-2 py-1 rounded"
                    >
                      {nodeId}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
