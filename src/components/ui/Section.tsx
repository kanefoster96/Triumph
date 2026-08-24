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
      className={cn("py-24 sm:py-36", tone === "raised" && "bg-surface/40", className)}
    >
      <Container>{children}</Container>
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Centred by default — the minimal layout leads with a centred header. */
  align?: "center" | "left";
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  action,
  className,
}: SectionHeaderProps) {
  const centred = align === "center";

  return (
    <Reveal
      className={cn(
        "mb-14 flex flex-col gap-5 sm:mb-20",
        centred ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", centred && "mx-auto")}>
        {eyebrow ? (
          // Tracked capitals, which the rest of the site does not use. A
          // section label is not read as a word so much as seen as a marker
          // for where one thing ends and the next begins, and at this size
          // sentence case does not carry that far.
          <p className="mb-4 text-[0.6875rem] font-semibold tracking-[0.18em] text-accent uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl text-balance sm:text-5xl">{title}</h2>
        {description ? (
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </Reveal>
  );
}
