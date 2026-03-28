import { useState } from "react";

interface NoiseButtonProps {
  onInject: () => void;
}

export default function NoiseButton({ onInject }: NoiseButtonProps) {
  const [count, setCount] = useState(5);
  const [isInjecting, setIsInjecting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleInject = async () => {
    setIsInjecting(true);
    setResult(null);
    try {
      const response = await fetch("/api/agent/add-noise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
        credentials: "include",
      });
      const data = await response.json();
      setResult(`Added ${data.added} random memories`);
      onInject();
    } catch (err) {
      setResult("Failed to inject noise");
      console.error("Noise injection failed:", err);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-1">
          Inject Random Memories
        </h3>
        <p className="text-xs text-gray-500">
          Adds random episodic memories to test decay behavior
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="number"
          min="1"
          max="20"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleInject}
          disabled={isInjecting}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
        >
          {isInjecting ? "Injecting..." : "Inject Noise"}
        </button>
      </div>

      {result && (
        <div className="text-xs text-green-400 bg-green-500/10 rounded px-3 py-2">
          {result}
        </div>
      )}
    </div>
  );
}
