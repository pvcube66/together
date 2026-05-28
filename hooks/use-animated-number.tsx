'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from its previous value to the target using
 * requestAnimationFrame for buttery-smooth transitions.
 * Duration defaults to 600ms with ease-out curve.
 */
export function useAnimatedNumber(
  target: number,
  duration = 600,
): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const delta = target - start;
    if (Math.abs(delta) < 0.5 || duration === 0) {
      setDisplay(target);
      prevRef.current = target;
      return;
    }

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + delta * eased);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        prevRef.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

/**
 * Component wrapper around useAnimatedNumber for inline use.
 * Renders a <span> with the animated value and an optional suffix.
 */
export function AnimatedNumber({
  value,
  duration = 600,
  suffix = '',
  className = '',
  formatter,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
  formatter?: (v: number) => string;
}) {
  const animated = useAnimatedNumber(value, duration);
  const display = formatter ? formatter(animated) : Math.round(animated * 10) / 10;

  return (
    <span className={`tabular-nums ${className}`}>
      {display}{suffix}
    </span>
  );
}
