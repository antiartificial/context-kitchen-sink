import { useState } from "react";

interface ResetButtonProps {
  onReset: () => Promise<void>;
  label?: string;
}

export default function ResetButton({
  onReset,
  label = "Reset",
}: ResetButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!window.confirm("Are you sure you want to reset? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      await onReset();
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 hover:border-red-700 text-red-400 hover:text-red-300 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Resetting..." : label}
    </button>
  );
}
