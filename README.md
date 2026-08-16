# Triumph Training

Marketing website for a personal trainer, built to feel like an app rather than a
brochure — and structured so its features port cleanly to a React Native app later.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4. Every route is
statically generated; there is no backend yet.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Routes

| Route                 | What it is                                                       |
| --------------------- | ---------------------------------------------------------------- |
| `/`                   | Hero, programmes rail, process, coach, results, feed, reviews, FAQ |
| `/programmes`         | All programmes with a client-side format filter                   |
| `/programmes/[slug]`  | Programme detail — inclusions, outcomes, matching client results  |
| `/results`            | Transformations with metrics, plus the full review wall           |
| `/pricing`            | Three plans, pay-as-you-go, pricing FAQ                           |
| `/about`              | Coach bio, credentials, philosophy, studio                        |
| `/contact`            | Enquiry form and the weekly studio timetable                      |

## Editing the content

All copy and data lives in `src/lib/data/` — no content is hard-coded in components.

- `site.ts` — brand name, contact details, navigation, headline stats
- `coach.ts` — bio, credentials, specialties
- `programmes.ts` — the training blocks (drives `/programmes` and every detail page)
- `plans.ts` — pricing tiers
- `transformations.ts` / `testimonials.ts` — client results and reviews
- `posts.ts` — the coach feed
- `schedule.ts` — weekly timetable
- `faqs.ts` — questions

Renaming the business, changing the phone number, or adding a programme is a one-file
edit. Adding a programme automatically creates its detail page, sitemap entry, and an
option in the enquiry form.

### Photography

There are no image assets. Each programme and result carries a `visual` key that maps
to an icon in `IconTile`, so cards are complete with nothing to upload. The one real
photo slot — the coach portrait — uses `MediaFrame`, which shows a labelled placeholder
until you give it a `src`. To use real photos, drop them in `public/` and pass `src` to
`MediaFrame` (or add a `photo` path to `coach.ts`); the placeholder disappears on its own.

## How this maps to the React Native app

The code is split so the parts worth reusing carry no web dependencies:

| Layer                  | Reused in the app | Notes                                                      |
| ---------------------- | ----------------- | ---------------------------------------------------------- |
| `src/lib/types.ts`     | Verbatim          | Domain models, no React or DOM types                       |
| `src/lib/data/*`       | Verbatim          | Plain objects                                              |
| `src/lib/services/*`   | Verbatim          | Async accessors — the seam where a real API drops in       |
| `src/lib/theme/tokens.ts` | Verbatim       | Numeric spacing/radii and hex colours, ready for StyleSheet |
| `src/lib/utils.ts`     | Verbatim          | Formatting helpers                                         |
| `src/components/*`     | Rewritten         | Web markup; the props and composition carry over           |

Two more things were built with the app in mind:

- **`nav` in `site.ts`** drives the desktop header, the mobile tab bar, and the footer
  from one array — the same array a React Navigation tab navigator can consume.
- **`validateEnquiry` / `submitEnquiry`** in `services/enquiry.ts` are deliberately
  UI-free, so the native enquiry screen reuses the logic and only swaps the inputs.

### Connecting a real backend

`src/lib/services/content.ts` is the only module that knows where content comes from.
Replace the function bodies with `fetch`, Supabase, or a CMS client and nothing else
changes. `submitEnquiry` currently fakes a 700ms round-trip and returns a reference
number; point it at your CRM or an email service to go live.

## Design system

Tokens are defined twice on purpose and must be kept in step:

- `src/lib/theme/tokens.ts` — the portable source (used by the app)
- `src/app/globals.css` — the same values as Tailwind v4 `@theme` variables

Colours are semantic (`bg-surface`, `text-muted`, `border-line`, `text-accent`), so
changing the accent is a two-line edit — one in each file. The current accent is cyan
`#22D3EE`; `--color-accent-ink` is the dark tone that sits *on* the accent and must be
changed with it.

### App-like behaviour

- Bottom tab bar on mobile, standard nav on desktop, with a shared active state
- Snap-scrolling rails that bleed to the screen edge, instead of carousel JS
- Scroll-reveal via `IntersectionObserver`, disabled under `prefers-reduced-motion`
  and pinned visible for no-JS via a `<noscript>` rule
- Safe-area insets, no tap highlight, no overscroll chaining
- Instant client-side filtering on `/programmes` rather than a page load per filter

## Deployment

Static output, so any host works. Set `NEXT_PUBLIC_SITE_URL` so `sitemap.xml` and
`robots.txt` emit absolute URLs for the live domain.

## Placeholder content

The coach name, client stories, reviews, statistics, prices, and studio address are
realistic placeholders, not real claims. Replace them in `src/lib/data/` before the
site goes live — particularly the results and review numbers.
