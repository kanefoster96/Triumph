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
Tell him what you are after
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-accent-ink/75 sm:text-lg">
            Three short questions and no card. Dean reads every application himself and comes back to
            you with what he would do — and if he is not the right coach for it, he will say so.
          </p>

          <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Button href="/join" size="lg" variant="onAccent">
              Apply to train
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
No card needed · No contract · Cancel any time
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
