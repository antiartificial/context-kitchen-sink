interface ScoreBarProps {
  value: number; // 0-1
  label?: string;
  color?: "accent" | "success" | "warning" | "danger";
}

const colorClasses = {
  accent: "bg-[#6366f1]",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
};

export default function ScoreBar({
  value,
  label,
  color = "accent",
}: ScoreBarProps) {
  const percentage = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const colorClass = colorClasses[color];

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">{label}</span>
          <span className="text-gray-300 font-medium">{percentage}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
