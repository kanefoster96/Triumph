import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChipProps {
  children: ReactNode;
  tone?: "default" | "accent" | "heat" | "success" | "cool";
  className?: string;
  size?: "sm" | "md";
}

const tones = {
  default: "bg-raised text-muted border-line",
  accent: "bg-accent/10 text-accent border-accent/25",
  heat: "bg-heat/10 text-heat border-heat/25",
  success: "bg-success/10 text-success border-success/25",
  cool: "bg-cool/10 text-cool border-cool/25",
} as const;

export function Chip({ children, tone = "default", className, size = "sm" }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
