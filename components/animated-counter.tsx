'use client';

import { useAnimatedNumber } from '@/hooks/use-animated-number';

export function AnimatedCounter({
  value,
  suffix = '',
  className = '',
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const display = useAnimatedNumber(value);
  return (
    <span className={`tabular-nums ${className}`}>
      {display}
      {suffix}
    </span>
  );
}
