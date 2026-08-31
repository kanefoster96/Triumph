# Dean's photos

Two files, for two different jobs.

| | `dean.jpg` | `dean-training.jpg` |
|---|---|---|
| **Used for** | The avatar — home page, `/about` header, the client app | The big shot on `/about`, next to the bio |
| **Shape** | Square. It is masked to a circle, so keep his face centred and leave a little room round the edges. | 4:5. Wide enough to show more than his face — mid-action is fine. |
| **Size** | 600 × 600 is plenty. It is drawn at 112px at the largest. | 1000px wide is plenty. |
| **Format** | `.jpg`, `.png` or `.webp` | `.jpg`, `.png` or `.webp` |

Then point the data at them — two lines in `src/lib/data/coach.ts`:

```ts
export const coach: Coach = {
  // ...
  photo: "/coach/dean.jpg",
  photoLarge: "/coach/dean-training.jpg",
};
```

The path starts at `/` and leaves `public` out: `public/coach/dean.jpg` is
served as `/coach/dean.jpg`.

Until `photo` exists the site draws his initials, and until `photoLarge`
exists `/about` draws a quiet placeholder — both are deliberate states, not
broken images, so nothing breaks while the folder is empty.
