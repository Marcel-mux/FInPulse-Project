"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 35,
    stiffness: 120,
    mass: 0.8,
  });
  const isInView = useInView(ref, { once: true, margin: "-10px" });

  const safeValue = typeof value === "number" && !isNaN(value) ? value : 0;

  useEffect(() => {
    if (isInView) {
      motionValue.set(safeValue);
    }
  }, [motionValue, isInView, safeValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        const safeLatest = typeof latest === "number" && !isNaN(latest) ? latest : 0;
        const rounded = Math.round(safeLatest);
        const formatted = new Intl.NumberFormat("id-ID").format(rounded);
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      }
    });
  }, [springValue, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {new Intl.NumberFormat("id-ID").format(Math.round(safeValue))}
      {suffix}
    </span>
  );
}
