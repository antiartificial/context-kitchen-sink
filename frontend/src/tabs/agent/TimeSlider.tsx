import { useState, useEffect, useRef } from "react";

interface TimeSliderProps {
  value: number;
  onChange: (hoursAgo: number) => void;
}

const TICK_MARKS = [0, 24, 48, 72, 96, 120, 144, 168];

function formatTimeAgo(hours: number): string {
  if (hours === 0) return "Now";
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }
  return days === 1
    ? `1 day, ${remainingHours}h ago`
    : `${days} days, ${remainingHours}h ago`;
}

export default function TimeSlider({ value, onChange }: TimeSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: number) => {
    setLocalValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">
          Time Travel
        </label>
        <span className="text-sm text-gray-400">{formatTimeAgo(localValue)}</span>
      </div>

      <div className="relative">
        <input
          type="range"
          min="0"
          max="168"
          step="1"
          value={localValue}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          style={{
            background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${(localValue / 168) * 100}%, rgb(31 41 55) ${(localValue / 168) * 100}%, rgb(31 41 55) 100%)`,
          }}
        />

        <div className="flex justify-between mt-2">
          {TICK_MARKS.map((tick) => (
            <div key={tick} className="flex flex-col items-center">
              <div className="w-px h-2 bg-gray-700" />
              <span className="text-xs text-gray-500 mt-1">
                {tick === 0 ? "Now" : `${tick}h`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
