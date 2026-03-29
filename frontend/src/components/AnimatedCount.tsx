import { useState, useEffect, useRef } from "react";

interface AnimatedCountProps {
  value: number;
  className?: string;
}

export default function AnimatedCount({ value, className = "" }: AnimatedCountProps) {
  const [display, setDisplay] = useState(value);
  const [animating, setAnimating] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setAnimating(true);
      const prev = prevRef.current;
      const diff = value - prev;
      const steps = Math.min(Math.abs(diff), 20);
      const stepTime = Math.max(30, 400 / steps);
      let step = 0;

      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(prev + diff * eased));

        if (step >= steps) {
          clearInterval(timer);
          setDisplay(value);
          setAnimating(false);
        }
      }, stepTime);

      prevRef.current = value;
      return () => clearInterval(timer);
    }
  }, [value]);

  return (
    <span className={`${className} ${animating ? "animate-pulse-soft" : ""}`}>
      {display}
    </span>
  );
}
