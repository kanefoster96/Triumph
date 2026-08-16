import type { ReactNode } from "react";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/3 h-80 w-[32rem] rounded-full bg-accent/10 blur-[110px]"
      />
      <Container className="relative py-12 sm:py-20">
        <Reveal>
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-accent uppercase">{eyebrow}</p>
          ) : null}
          <h1 className="max-w-3xl font-display text-4xl leading-[0.95] text-balance uppercase sm:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{description}</p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </Reveal>
      </Container>
    </div>
  );
}
