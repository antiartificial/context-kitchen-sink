import { useState, useEffect, useRef } from "react";

interface OdometerCountProps {
  value: number;
  className?: string;
}

export default function OdometerCount({ value, className = "" }: OdometerCountProps) {
  const digits = String(value).split("");
  const prevRef = useRef(value);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (value !== prevRef.current) {
      setChanging(true);
      const timer = setTimeout(() => setChanging(false), 400);
      prevRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span className={`inline-flex overflow-hidden ${className}`}>
      {digits.map((d, i) => (
        <OdometerDigit key={`${digits.length}-${i}`} digit={d} animate={changing} />
      ))}
    </span>
  );
}

function OdometerDigit({ digit, animate }: { digit: string; animate: boolean }) {
  const [prev, setPrev] = useState(digit);
  const [current, setCurrent] = useState(digit);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (digit !== current) {
      setPrev(current);
      setCurrent(digit);
      if (animate) {
        setRolling(true);
        const timer = setTimeout(() => setRolling(false), 350);
        return () => clearTimeout(timer);
      }
    }
  }, [digit, animate, current]);

  if (digit === ".") {
    return <span>.</span>;
  }

  return (
    <span className="relative inline-block w-[0.6em] h-[1.2em] overflow-hidden align-bottom">
      <span
        className={`absolute inset-x-0 flex flex-col items-center transition-transform ${
          rolling ? "duration-300 ease-out" : "duration-0"
        }`}
        style={{ transform: rolling ? "translateY(-50%)" : "translateY(0)" }}
      >
        {rolling && (
          <span className="h-[1.2em] flex items-center justify-center">{prev}</span>
        )}
        <span className="h-[1.2em] flex items-center justify-center">{current}</span>
      </span>
    </span>
  );
}
