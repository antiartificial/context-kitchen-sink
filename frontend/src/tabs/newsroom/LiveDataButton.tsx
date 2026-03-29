import { useState } from "react";
import { api } from "../../api";

interface LiveDataButtonProps {
  onFetch: () => void;
}

export default function LiveDataButton({ onFetch }: LiveDataButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ claims_added: number } | null>(null);

  const handleFetch = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await api.post<{ claims_added: number }>("/newsroom/fetch-live");
      setResult(res);
      await onFetch();
      setTimeout(() => setResult(null), 3000);
    } catch (err) {
      console.error("Failed to fetch live data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Fetch simulated RSS headlines as live claims from BBC source.</p>
      <button
        onClick={handleFetch}
        disabled={isLoading}
        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors text-sm font-medium"
      >
        {isLoading ? "Fetching..." : "Fetch Live Headlines"}
      </button>
      {result && (
        <div className="text-xs text-green-400 bg-green-500/10 rounded px-2 py-1.5">
          +{result.claims_added} claims added
        </div>
      )}
    </div>
  );
}
