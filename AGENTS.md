<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Triumph Training — project notes

Marketing website for a personal trainer. Next.js 16 App Router, React 19,
Tailwind v4, TypeScript. Fully static; no backend.

## Ground rules

- **Content is data, not markup.** All copy lives in `src/lib/data/`. Do not
  hard-code names, prices, or client stories into components.
- **`src/lib/` stays portable.** These features become a React Native app, so
  `lib/types.ts`, `lib/data/*`, `lib/services/*`, `lib/theme/tokens.ts` and
  `lib/utils.ts` must not import React or touch the DOM.
- **`src/lib/services/content.ts` is the only data seam.** Components call it;
  swapping mock data for an API should touch that file alone.
- **Tokens are mirrored** in `lib/theme/tokens.ts` and `app/globals.css`
  (`@theme`). Change both together.
- Prefer semantic colour utilities (`bg-surface`, `text-muted`, `border-line`)
  over raw hex.
- The look is minimal and dark: flat surfaces, hairline borders, generous
  whitespace, one cyan accent. No gradients, texture overlays, glows, or
  condensed/uppercase display type. The only saturated block on a page is the
  accent CTA band.
- Cards use `border border-line bg-surface` and `rounded-[var(--radius-sheet)]`;
  a card's visual identity comes from an `IconTile`, not from imagery.

## Navigation

The website navigates with the hamburger menu in `MobileMenu` (mobile) and the
inline links in `TopBar` (desktop). `BottomTabBar` is the **app's** navigation,
kept as a working reference and deliberately not mounted on the site — both it
and the header read the same `nav` array from `site.ts`.

## Members' area

`/app` (client) and `/admin` (Dean) are the logged-in product — see MEMBERS.md.
Reads go through `lib/members/service.ts`, writes through
`lib/members/actions.ts`, and both fall back to `lib/members/demo.ts` when
Supabase is not configured. Privacy is enforced by row level security in
`supabase/migrations/0001_init.sql`, not by UI checks: add a policy for every
new table.

Marketing pages live in the `(marketing)` route group with their own layout;
the root layout is only the document shell.

## Gotchas

- Custom utilities in `globals.css` sit in the same cascade layer as Tailwind's,
  so a custom class that sets `display` will beat `lg:hidden`. `.rail`
  deliberately omits `display` — pair it with `flex`.
- For the same reason, passing `hidden` to `<Button>` will not override its own
  `inline-flex`; toggle a child `<span>` instead.
- `Reveal` starts elements at `opacity: 0`. A `<noscript>` rule in `layout.tsx`
  pins them visible — keep it if you touch the reveal CSS.
- Reading the clock (`Date.now()`, `new Date()`) during a component render
  trips `react-hooks/purity`. Do it inside an async function in the service
  layer instead — see `partitionSessions`.
- Do not leave a fixed overlay parked off-screen (e.g. a drawer held at
  `translate-x-full`) in the DOM: it interferes with the page's
  scroll-into-view behaviour, and `visibility: hidden` does not help. Mount it
  only while in use. For the same reason, never leave a full-viewport
  `backdrop-filter` applied while the overlay is closed.

## Checks

`npm run build` and `npm run lint` should both pass clean before committing.
