import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl font-bold tracking-tight text-accent sm:text-9xl">404</p>
      <h1 className="mt-4 text-2xl sm:text-3xl">This one is not in the programme</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        The page you were after has moved or never existed. Head back and pick a programme instead.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button href="/">Back to home</Button>
        <Button href="/coaching" variant="secondary">
          See the coaching
        </Button>
      </div>
    </Container>
  );
}
