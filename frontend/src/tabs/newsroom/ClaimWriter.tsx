import { useState } from "react";
import { api } from "../../api";
import type { Source, WriteResult } from "../../types";

interface ClaimWriterProps {
  sources: Source[];
  onWrite: () => void;
}

const TOPICS = ["economics", "health", "space", "energy"];

export default function ClaimWriter({ sources, onWrite }: ClaimWriterProps) {
  const [sourceId, setSourceId] = useState("");
  const [content, setContent] = useState("");
  const [confidence, setConfidence] = useState(0.8);
  const [topic, setTopic] = useState("economics");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<WriteResult | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !content.trim()) return;

    setIsSubmitting(true);
    setResult(null);
    setShowFlash(false);

    try {
      const res = await api.post<WriteResult>("/newsroom/write", {
        content: content.trim(),
        source_id: sourceId,
        confidence,
        labels: { topic },
        topic,
      });

      setResult(res);
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 2000);

      // Reset form on success
      setContent("");
      setConfidence(0.8);

      onWrite();
    } catch (err) {
      console.error("Failed to write claim:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">
        Write New Claim
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Source
          </label>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a source...</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.external_id || s.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
            placeholder="Enter claim content..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confidence: {confidence.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={confidence}
            onChange={(e) => setConfidence(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Topic
          </label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !sourceId || !content.trim()}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isSubmitting ? "Submitting..." : "Submit Claim"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg border ${
            result.admitted
              ? "bg-green-950 border-green-800"
              : "bg-red-950 border-red-800"
          } ${showFlash ? "animate-pulse" : ""}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`font-semibold ${
                result.admitted ? "text-green-400" : "text-red-400"
              }`}
            >
              {result.admitted ? "Admitted" : "Rejected"}
            </span>
          </div>
          {result.reason && (
            <p className="text-sm text-gray-300 mb-2">{result.reason}</p>
          )}
          {result.conflict_ids && result.conflict_ids.length > 0 && (
            <p className="text-sm text-orange-400">
              Conflicts detected: {result.conflict_ids.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
