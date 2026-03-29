import { useState, useRef, useEffect } from "react";
import type { Claim } from "../../types";
import AnimatedCount from "../../components/AnimatedCount";

interface ClaimFeedProps {
  claims: Claim[];
}

export default function ClaimFeed({ claims }: ClaimFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  // Track new claim IDs for enter animation
  useEffect(() => {
    const currentIds = new Set(claims.map((c) => c.id));
    const fresh = new Set<string>();
    for (const id of currentIds) {
      if (!prevIdsRef.current.has(id)) {
        fresh.add(id);
      }
    }
    if (fresh.size > 0) {
      setNewIds(fresh);
      // Clear "new" flag after animation completes
      const timer = setTimeout(() => setNewIds(new Set()), 2400);
      prevIdsRef.current = currentIds;
      return () => clearTimeout(timer);
    }
    prevIdsRef.current = currentIds;
  }, [claims]);

  const sortedClaims = [...claims].sort((a, b) => {
    const timeA = a.valid_from || a.created_at || "";
    const timeB = b.valid_from || b.created_at || "";
    return timeB.localeCompare(timeA);
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const confColor = (c: number) =>
    c >= 0.7 ? "text-green-400" : c >= 0.4 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-200">
          Claims{" "}
          <span className="text-gray-500 font-normal">
            (<AnimatedCount value={claims.length} />)
          </span>
        </span>
      </div>
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-800/50">
        {sortedClaims.length === 0 ? (
          <p className="text-gray-500 text-center py-6 text-sm">No claims yet</p>
        ) : (
          sortedClaims.map((claim) => {
            const isNew = newIds.has(claim.id);
            return (
              <div
                key={claim.id}
                className={`px-3 py-2 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                  isNew ? "animate-claim-enter" : ""
                }`}
                onClick={() => toggleExpand(claim.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Admitted indicator */}
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                    claim.admitted ? "bg-green-500" : "bg-red-500"
                  }`} />

                  {/* Content */}
                  <p className={`text-sm truncate flex-1 min-w-0 ${
                    claim.admitted ? "text-gray-200" : "line-through text-gray-500"
                  }`}>
                    {claim.content}
                  </p>

                  {/* Confidence */}
                  <span className={`text-xs font-mono flex-shrink-0 transition-colors ${confColor(claim.confidence)}`}>
                    {(claim.confidence * 100).toFixed(0)}%
                  </span>

                  {/* Source */}
                  <span className="text-xs text-gray-500 flex-shrink-0 hidden sm:inline w-28 truncate text-right">
                    {claim.source_id}
                  </span>

                  {/* Conflict indicator */}
                  {claim.conflict_ids && claim.conflict_ids.length > 0 && (
                    <span className="text-orange-400 flex-shrink-0" title="Has conflicts">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Expanded details */}
                {expandedId === claim.id && (
                  <div className="mt-2 ml-4 pl-2 border-l border-gray-700 text-xs text-gray-400 space-y-0.5">
                    <div className="flex gap-4">
                      <span>Source: {claim.source_id}</span>
                      <span>Type: {claim.epistemic_type}</span>
                    </div>
                    {claim.labels && claim.labels.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {claim.labels.map((l) => (
                          <span key={l} className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">{l}</span>
                        ))}
                      </div>
                    )}
                    {claim.valid_from && <div>Valid: {new Date(claim.valid_from).toLocaleString()}</div>}
                    {claim.conflict_ids && claim.conflict_ids.length > 0 && (
                      <div className="text-orange-400">Conflicts: {claim.conflict_ids.length}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
