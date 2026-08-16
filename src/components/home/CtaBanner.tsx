import { ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/lib/data/site";

export function CtaBanner() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-sheet)] border border-line bg-gradient-to-br from-raised via-surface to-ink p-8 sm:p-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-accent/15 blur-[100px]"
            />
            <div className="grain absolute inset-0 opacity-30" aria-hidden />

            <div className="relative max-w-2xl">
              <h2 className="font-display text-4xl leading-[0.95] text-balance uppercase sm:text-6xl">
                Start with a conversation,
                <br />
                <span className="text-accent">not a contract</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
                Twenty minutes, no cost, no pressure. If I am not the right coach for what you want, I will
                tell you and point you at someone who is.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/contact" size="lg">
                  Book a free consult
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href={`mailto:${site.email}`} size="lg" variant="secondary">
                  <MessageSquare className="h-4 w-4" />
                  Email me directly
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
