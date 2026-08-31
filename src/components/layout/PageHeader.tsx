import type { ReactNode } from "react";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

interface PageHeaderProps {
  eyebrow?: string;
  /** A small identity marker above the eyebrow — Dean's avatar on /about. */
  avatar?: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, avatar, title, description, children }: PageHeaderProps) {
  return (
    <Container className="pt-14 pb-14 text-center sm:pt-20 sm:pb-20">
      <Reveal>
        {avatar ? <div className="mb-5 flex justify-center">{avatar}</div> : null}
        {eyebrow ? (
          <p className="mb-4 text-xs font-semibold text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="mx-auto max-w-3xl text-4xl leading-[1.08] text-balance sm:text-5xl">{title}</h1>
        {description ? (
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </Reveal>
    </Container>
  );
}
