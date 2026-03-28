interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-3",
  lg: "w-12 h-12 border-4",
};

export default function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  const sizeClass = sizeClasses[size];

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClass} border-gray-700 border-t-[#6366f1] rounded-full animate-spin`}
        style={{
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
