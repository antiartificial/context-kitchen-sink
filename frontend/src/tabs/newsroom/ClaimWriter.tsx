import { useState } from "react";
import { api } from "../../api";
import type { Source, WriteResult } from "../../types";

interface ClaimWriterProps {
  sources: Source[];
  onWrite: () => void;
}

const TOPICS = ["performance", "reliability", "pricing", "security"];

export default function ClaimWriter({ sources, onWrite }: ClaimWriterProps) {
  const [sourceId, setSourceId] = useState("");
  const [content, setContent] = useState("");
  const [confidence, setConfidence] = useState(0.8);
  const [topic, setTopic] = useState("performance");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<WriteResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !content.trim()) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await api.post<WriteResult>("/newsroom/write", {
        content: content.trim(),
        source_id: sourceId,
        confidence,
        labels: [topic],
        topic,
      });
      setResult(res);
      setContent("");
      onWrite();
      setTimeout(() => setResult(null), 3000);
    } catch (err) {
      console.error("Failed to write claim:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        >
          <option value="">Source...</option>
          {sources.map((s) => (
            <option key={s.id} value={s.external_id || s.id}>
              {s.external_id || s.id}
            </option>
          ))}
        </select>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[60px] resize-none"
        placeholder="Claim content..."
        required
      />

      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0" max="1" step="0.05"
          value={confidence}
          onChange={(e) => setConfidence(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs text-gray-400 w-10 text-right font-mono">{confidence.toFixed(2)}</span>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !sourceId || !content.trim()}
        className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors text-xs font-medium"
      >
        {isSubmitting ? "Submitting..." : "Submit Claim"}
      </button>

      {result && (
        <div className={`text-xs px-2 py-1.5 rounded ${
          result.admitted
            ? "text-green-400 bg-green-500/10"
            : "text-red-400 bg-red-500/10"
        }`}>
          {result.admitted ? "Admitted" : "Rejected"}
          {result.reason && `: ${result.reason}`}
          {result.conflict_ids && result.conflict_ids.length > 0 && (
            <span className="text-orange-400 ml-1">({result.conflict_ids.length} conflicts)</span>
          )}
        </div>
      )}
    </form>
  );
}
