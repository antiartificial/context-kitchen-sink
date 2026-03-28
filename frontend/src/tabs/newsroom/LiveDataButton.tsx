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
      const res = await api.post<{ claims_added: number }>(
        "/newsroom/fetch-live"
      );
      setResult(res);
      await onFetch();

      // Clear result after 5 seconds
      setTimeout(() => setResult(null), 5000);
    } catch (err) {
      console.error("Failed to fetch live data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">
        Live Data
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Fetch real RSS headlines as live claims
      </p>

      <button
        onClick={handleFetch}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Fetching...
          </>
        ) : (
          "Fetch Live Headlines"
        )}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-green-950 border border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-400 font-medium">
              {result.claims_added} claims added
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
