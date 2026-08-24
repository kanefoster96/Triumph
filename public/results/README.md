# Before and afters

Two files per client — the same shot, months apart.

| | |
|---|---|
| **Name them** | `<id>-before.jpg` and `<id>-after.jpg`, where `<id>` is the entry's `id` in the data — so `tr-1-before.jpg`, `tr-1-after.jpg` |
| **Shape** | Portrait, 4:5. Anything else is cropped to fit from the centre. |
| **Size** | 800 × 1000. They are drawn about 300px wide. |
| **Format** | `.jpg` or `.webp` |

Then add both paths to that entry in `src/lib/data/transformations.ts`:

```ts
{
  id: "tr-1",
  name: "Tom",
  // ...
  before: "/results/tr-1-before.jpg",
  after: "/results/tr-1-after.jpg",
}
```

Both are optional and independent. A card with neither shows two labelled
empty frames, which is the honest state — the section's own copy promises
these are real people, so an invented pair is the one thing that must never
go here.

**Same framing, same lighting, same distance**, or the pair is doing the work
the coaching should be doing. And get the client's permission in writing
before publishing a photo of them.
