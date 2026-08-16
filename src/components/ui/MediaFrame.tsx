import type { VisualKey } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Stands in for photography.
 *
 * Every programme/result carries a `VisualKey` rather than an image path, so
 * the site looks intentional with no assets at all. Drop a real photo in
 * /public and pass `src` to swap any one of these out.
 */
const gradients: Record<VisualKey, string> = {
  strength: "from-[#2b2f3a] via-[#171a21] to-[#0c0e12]",
  conditioning: "from-[#3a2b26] via-[#1d181a] to-[#0c0e12]",
  hybrid: "from-[#22323d] via-[#161d24] to-[#0c0e12]",
  online: "from-[#2a2b3d] via-[#191a24] to-[#0c0e12]",
  mobility: "from-[#25382f] via-[#161f1b] to-[#0c0e12]",
  nutrition: "from-[#3a3527] via-[#1f1d17] to-[#0c0e12]",
};

const glows: Record<VisualKey, string> = {
  strength: "bg-accent/20",
  conditioning: "bg-heat/25",
  hybrid: "bg-cool/20",
  online: "bg-[#8f7bff]/20",
  mobility: "bg-success/20",
  nutrition: "bg-accent/15",
};

interface MediaFrameProps {
  visual: VisualKey;
  src?: string;
  alt?: string;
  className?: string;
  /** Large watermark text, e.g. a programme name. */
  caption?: string;
  children?: React.ReactNode;
}

export function MediaFrame({ visual, src, alt = "", className, caption, children }: MediaFrameProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[var(--radius-card)] border border-line",
        "bg-gradient-to-br",
        gradients[visual],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- decorative, dimensions come from the frame
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <div className={cn("absolute -top-1/3 -right-1/4 h-2/3 w-2/3 rounded-full blur-3xl", glows[visual])} />
          <div className="grain absolute inset-0 opacity-40" />
          {caption ? (
            <span className="pointer-events-none absolute bottom-2 left-4 font-display text-5xl font-extrabold tracking-tight text-white/[0.06] uppercase select-none sm:text-6xl">
              {caption}
            </span>
          ) : null}
        </>
      )}
      {children}
    </div>
  );
}
