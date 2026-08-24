import { cn } from "@/lib/utils";

/**
 * Who this is.
 *
 * Most people have no photo, so initials are the normal case rather than a
 * placeholder — they have to look deliberate. That also rules out tinting each
 * one a different colour: this app has one accent and no decorative hues, and
 * thirty differently-coloured circles would be the loudest thing on Dean's
 * screen. Identity comes from the letters; the accent ring is reserved for the
 * one that is *you*.
 */
const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
} as const;

export type AvatarSize = keyof typeof SIZES;

/** "Priya Raman" → "PR", "Dean" → "D". Two letters is all that fits. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = "sm",
  ring = false,
  className,
}: {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  /** Marks the signed-in person, or the client currently being worked on. */
  ring?: boolean;
  className?: string;
}) {
  const shell = cn(
    "grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold select-none",
    SIZES[size],
    ring && "ring-2 ring-accent/50",
    className,
  );

  if (src) {
    return (
      <span className={cn(shell, "bg-raised")}>
        {/* A pasted URL can point anywhere, so this stays a plain img rather
            than next/image — no remote host list to keep in step. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      </span>
    );
  }

  return (
    <span className={cn(shell, "bg-raised text-muted")} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
