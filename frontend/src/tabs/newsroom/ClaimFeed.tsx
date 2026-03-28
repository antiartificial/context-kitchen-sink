import { useState } from "react";
import type { Claim } from "../../types";

interface ClaimFeedProps {
  claims: Claim[];
}

export default function ClaimFeed({ claims }: ClaimFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedClaims = [...claims].sort((a, b) => {
    const timeA = a.valid_from || a.created_at || "";
    const timeB = b.valid_from || b.created_at || "";
    return timeB.localeCompare(timeA);
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return "bg-green-600 text-green-100";
    if (confidence >= 0.4) return "bg-yellow-600 text-yellow-100";
    return "bg-red-600 text-red-100";
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">
        Claim Feed
        <span className="text-sm font-normal text-gray-400 ml-2">
          ({claims.length} claims)
        </span>
      </h3>
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {sortedClaims.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No claims yet</p>
        ) : (
          sortedClaims.map((claim) => (
            <div
              key={claim.id}
              className={`border-l-4 ${
                claim.admitted ? "border-green-500" : "border-red-500"
              } bg-gray-800 rounded-r-lg p-4 cursor-pointer hover:bg-gray-750 transition-colors`}
              onClick={() => toggleExpand(claim.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p
                    className={`text-gray-100 text-sm ${
                      !claim.admitted ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {claim.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-gray-400">
                      {claim.source_id}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(claim.confidence)}`}
                    >
                      {(claim.confidence * 100).toFixed(0)}%
                    </span>
                    {claim.labels &&
                      claim.labels.map((label) => (
                        <span
                          key={label}
                          className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                        >
                          {label}
                        </span>
                      ))}
                    {claim.conflict_ids && claim.conflict_ids.length > 0 && (
                      <span className="px-2 py-1 bg-orange-900 text-orange-300 text-xs rounded-full flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {claim.conflict_ids.length}
                      </span>
                    )}
                  </div>

                  {expandedId === claim.id && (
                    <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400 space-y-1">
                      <div>Type: {claim.epistemic_type}</div>
                      {claim.valid_from && (
                        <div>Valid From: {new Date(claim.valid_from).toLocaleString()}</div>
                      )}
                      {claim.valid_until && (
                        <div>Valid Until: {new Date(claim.valid_until).toLocaleString()}</div>
                      )}
                      {claim.created_at && (
                        <div>Created: {new Date(claim.created_at).toLocaleString()}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
