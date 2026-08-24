import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "onAccent" | "onAccentSoft";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  /*
   * The glow is the primary variant's, not the base's: a secondary button
   * lit the same way would be two "main" buttons side by side, which is the
   * problem it exists to solve.
   */
  primary:
    "lit bg-accent text-accent-ink shadow-glow hover:bg-accent-strong active:bg-accent-strong disabled:shadow-none",
  /** Filled rather than outlined — one less line on the page. */
  secondary: "lit bg-raised text-text hover:bg-overlay",
  ghost: "text-muted hover:text-text hover:bg-raised",
  /** For use inside a solid accent panel. */
  onAccent: "lit bg-accent-ink text-accent hover:bg-ink",
  /*
   * The secondary action inside that panel. It needs to be a variant rather
   * than a `className`, because `cn` is a plain join: passing `bg-accent-ink/10`
   * to a primary button leaves both backgrounds in the class list and the
   * stylesheet decides, so the "quiet" button came out lit.
   */
  onAccentSoft: "lit bg-accent-ink/10 text-accent-ink hover:bg-accent-ink/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap " +
  "transition-[background-color,color,border-color,transform,box-shadow] duration-200 ease-[var(--ease-out-app)] " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  fullWidth?: boolean;
}

type ButtonAsLink = CommonProps & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;
type ButtonAsButton = CommonProps & { href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">;

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", size = "md", className, children, fullWidth, ...rest } = props;
  const classes = cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);

  if (typeof rest === "object" && "href" in rest && rest.href) {
    const { href, ...linkProps } = rest as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as ButtonAsButton)}>
      {children}
    </button>
  );
}
