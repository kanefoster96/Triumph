# Client photos

The faces on the reviews. One file per person.

| | |
|---|---|
| **Name them** | after the person, lowercase, no spaces — `priya.jpg`, `danny.jpg` |
| **Shape** | Square. Masked to a circle, so keep the face centred. |
| **Size** | 400 × 400 is plenty. They are drawn at 44px. |
| **Format** | `.jpg`, `.png` or `.webp` |

Then add a `photo` to that person's entry in `src/lib/data/testimonials.ts`:

```ts
{
  id: "t-1",
  name: "Priya R.",
  // ...
  photo: "/clients/priya.jpg",
}
```

`photo` is optional. Anybody without one shows their initials instead — that
is the normal case, not a missing state, so you can add them one at a time.

**Only real clients, and only with their permission.** A stock face on a
review is a fake review.
