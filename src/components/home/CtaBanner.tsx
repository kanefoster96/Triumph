import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/lib/data/site";

/** Full-bleed accent band — the one saturated moment on the page. */
export function CtaBanner() {
  return (
    <section className="bg-accent text-accent-ink">
      <Container className="py-20 text-center sm:py-24">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-3xl text-balance sm:text-4xl">
            Start with a conversation, not a contract
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-accent-ink/75 sm:text-lg">
            Twenty minutes, no cost, no pressure. If I am not the right coach for what you want, I will tell
            you and point you at someone who is.
          </p>

          <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Button href="/contact" size="lg" variant="onAccent">
              Book a free consult
            </Button>
            <Button
              href={`mailto:${site.email}`}
              size="lg"
              className="border border-accent-ink/25 bg-transparent text-accent-ink hover:bg-accent-ink/10"
            >
              Email me directly
            </Button>
          </div>

          <p className="mt-7 text-sm text-accent-ink/70">
            No credit card required · Cancel anytime · Keep your programme forever
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
