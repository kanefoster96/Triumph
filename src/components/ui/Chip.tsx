import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChipProps {
  children: ReactNode;
  tone?: "default" | "accent" | "amber" | "success";
  className?: string;
  size?: "sm" | "md";
}

/** Tint only — a chip is small enough that a fill reads without an outline. */
const tones = {
  default: "bg-raised text-muted",
  accent: "bg-accent/10 text-accent",
  amber: "bg-amber/10 text-amber",
  success: "bg-success/10 text-success",
} as const;

export function Chip({ children, tone = "default", className, size = "sm" }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
