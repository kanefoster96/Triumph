import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { secondaryNav, site } from "@/lib/data/site";
import { Container } from "@/components/ui/Section";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mb-tabbar border-t border-line bg-surface/60 pt-14 md:mb-0">
      <Container>
        <div className="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent font-display text-lg font-extrabold text-accent-ink">
                T
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight">{site.name}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{site.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {site.social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full border border-line px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-[0.18em] text-faint uppercase">Explore</h3>
            <ul className="space-y-2.5">
              {secondaryNav.map((item) => (
                <li key={item.href + item.label}>
                  <Link href={item.href} className="text-sm text-muted transition-colors hover:text-text">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-[0.18em] text-faint uppercase">Studio</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
                <span>{site.studio}</span>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
                <a href={`mailto:${site.email}`} className="transition-colors hover:text-text">
                  {site.email}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="transition-colors hover:text-text">
                  {site.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-line py-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. Personal training in {site.location}.
          </p>
          <p>Built to move — website today, app next.</p>
        </div>
      </Container>
    </footer>
  );
}
