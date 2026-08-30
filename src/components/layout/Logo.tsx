import Link from "next/link";
import { site } from "@/lib/data/site";
import { cn } from "@/lib/utils";

/**
 * Wordmark. The mark is solid white — one flat fill, no gradient — matching
 * the brand mark used everywhere else the T stands alone (favicon included).
 */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label={`${site.name} home`}>
      <svg viewBox="0 0 25.53 28.05" className="h-6 w-[21.9px] shrink-0 text-text" aria-hidden focusable="false">
        <path
          fill="currentColor"
          d="M0.01,0.03 l-0.01,0.03 l0.29,0.31 c0.16,0.17 1.07,1.08 2.02,2.04 l1.73,1.73 l0.21,0.01 c0.12,0.01 1.63,0.01 3.35,0.01 l3.14,-0.00 l0.02,0.03 l0.02,0.03 l0.01,3.33 l0.01,3.33 l2.01,2.01 l2.01,2.01 l0.05,-0.00 l0.05,-0.00 l0.01,-5.36 l0.01,-5.35 l0.03,-0.01 c0.01,-0.00 1.47,-0.01 3.24,-0.01 l3.21,-0.01 l0.10,-0.07 c0.09,-0.07 2.98,-2.95 3.68,-3.68 l0.34,-0.35 l-0.02,-0.02 l-0.02,-0.02 l-12.73,-0.01 l-12.73,-0.01 l-0.01,0.03 Z M10.83,15.11 l-0.02,0.05 l-0.01,4.41 l-0.01,4.41 l0.05,0.08 c0.04,0.07 2.80,2.83 3.75,3.75 l0.26,0.25 l0.04,-0.03 l0.04,-0.03 l-0.01,-4.47 l-0.01,-4.46 l-2.00,-1.99 c-1.09,-1.09 -2.01,-1.99 -2.03,-2.00 l-0.03,-0.01 l-0.02,0.05 Z"
        />
      </svg>
      <span className="font-display text-[15px] leading-tight font-bold tracking-tight">
        Triumph
        <span className="block text-[15px] font-bold text-muted">Training</span>
      </span>
    </Link>
  );
}
