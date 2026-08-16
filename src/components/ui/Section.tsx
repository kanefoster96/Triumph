import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>;
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Slightly lifted background to separate adjacent sections. */
  tone?: "base" | "raised";
}

export function Section({ children, className, id, tone = "base" }: SectionProps) {
  return (
    <section
      id={id}
      className={cn("py-16 sm:py-24", tone === "raised" && "bg-surface/60", className)}
    >
      <Container>{children}</Container>
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
}: SectionHeaderProps) {
  return (
    <Reveal
      className={cn(
        "mb-8 flex flex-col gap-4 sm:mb-12",
        align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-accent uppercase">{eyebrow}</p>
        ) : null}
        <h2 className="text-3xl text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </Reveal>
  );
}
