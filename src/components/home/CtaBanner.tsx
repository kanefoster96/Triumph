import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

/** Full-bleed accent band — the one saturated moment on the page. */
export function CtaBanner() {
  return (
    <section className="bg-accent text-accent-ink">
      <Container className="py-20 text-center sm:py-24">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-3xl text-balance sm:text-4xl">
Two ways to start
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-accent-ink/75 sm:text-lg">
            Ask for a free consultation and Dean will come back to you with what he would do. Or
            just ask a question — he answers those himself too.
          </p>

          <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Button href="/join" size="lg" variant="onAccent">
              Request a free consultation
            </Button>
            <Button
              href="/contact"
              size="lg"
              className="border border-accent-ink/25 bg-transparent text-accent-ink hover:bg-accent-ink/10"
            >
              Ask a question
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
