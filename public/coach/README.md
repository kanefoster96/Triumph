# Dean's photo

Drop one file in here.

| | |
|---|---|
| **Name it** | `dean.jpg` |
| **Shape** | Square. It is masked to a circle, so keep his face centred and leave a little room round the edges. |
| **Size** | 600 × 600 is plenty. It is drawn at 112px at the largest. |
| **Format** | `.jpg`, `.png` or `.webp` |

Then point the data at it — one line in `src/lib/data/coach.ts`:

```ts
export const coach: Coach = {
  // ...
  photo: "/coach/dean.jpg",
};
```

The path starts at `/` and leaves `public` out: `public/coach/dean.jpg` is
served as `/coach/dean.jpg`.

Until that line exists the site draws his initials, which is a deliberate
state and not a broken image — so nothing breaks while the folder is empty.
