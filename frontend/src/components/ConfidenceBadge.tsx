interface ConfidenceBadgeProps {
  value: number; // 0-1
}

export default function ConfidenceBadge({ value }: ConfidenceBadgeProps) {
  const percentage = Math.round(Math.max(0, Math.min(1, value)) * 100);

  let colorClasses = "";
  if (value >= 0.8) {
    colorClasses = "bg-green-900/30 text-green-400 border-green-800/50";
  } else if (value >= 0.5) {
    colorClasses = "bg-yellow-900/30 text-yellow-400 border-yellow-800/50";
  } else {
    colorClasses = "bg-red-900/30 text-red-400 border-red-800/50";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}
    >
      {percentage}%
    </span>
  );
}
