import type { VisualKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IconTile } from "./IconTile";

interface MediaFrameProps {
  visual: VisualKey;
  src?: string;
  alt?: string;
  className?: string;
  /** Shown under the icon when there is no photo. */
  caption?: string;
  /**
   * Which tone the empty frame sits at. `cn` here is a plain join rather than
   * a tailwind merge, so this cannot be overridden from `className` — a frame
   * inside a `bg-surface` card needs `raised` or it disappears into it.
   */
  tone?: "surface" | "raised";
  children?: React.ReactNode;
}

/**
 * Photo slot with a graceful empty state.
 *
 * With no `src` it renders a quiet placeholder rather than pretending to be an
 * image. Drop a file in /public and pass `src` to swap it out.
 */
export function MediaFrame({ visual, src, alt = "", className, caption, tone = "surface", children }: MediaFrameProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[var(--radius-sheet)]",
        tone === "raised" ? "bg-raised" : "bg-surface",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- dimensions come from the frame
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center gap-3 p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <IconTile visual={visual} size="lg" />
            {caption ? <p className="text-sm font-medium text-faint">{caption}</p> : null}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
