"use client";

import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import type { Post } from "@/lib/types";
import { cn, compactNumber, initials, relativeDate } from "@/lib/utils";
import { coach } from "@/lib/data/coach";

const kindLabel: Record<Post["kind"], { label: string; className: string }> = {
  tip: { label: "Coaching note", className: "text-cool" },
  win: { label: "Client win", className: "text-accent" },
  session: { label: "Session", className: "text-heat" },
  note: { label: "Note", className: "text-success" },
};

/**
 * A feed post. The like button is local-only for now — when the app ships,
 * this becomes an optimistic update against the same shape.
 */
export function PostCard({ post, className }: { post: Post; className?: string }) {
  const [liked, setLiked] = useState(false);
  const kind = kindLabel[post.kind];

  return (
    <article className={cn("rounded-[var(--radius-card)] border border-line bg-surface p-5", className)}>
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-sm font-bold text-accent-ink">
          {initials(coach.name)}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{coach.name}</p>
          <p className="text-xs text-faint">
            <span className={kind.className}>{kind.label}</span> · {relativeDate(post.date)}
          </p>
        </div>
      </header>

      <h3 className="mt-4 text-lg leading-snug">{post.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{post.body}</p>

      {post.tags.length > 0 ? (
        <p className="mt-3 flex flex-wrap gap-2 text-xs text-accent">
          {post.tags.map((tag) => (
            <span key={tag}>#{tag.replace(/\s+/g, "")}</span>
          ))}
        </p>
      ) : null}

      <footer className="mt-4 flex items-center gap-5 border-t border-line pt-3 text-xs text-faint">
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          className={cn(
            "inline-flex items-center gap-1.5 transition-[color,transform] duration-200 active:scale-90",
            liked ? "text-heat" : "hover:text-text",
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-heat")} />
          {compactNumber(post.likes + (liked ? 1 : 0))}
        </button>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4" />
          {post.comments}
        </span>
        <Share2 className="ml-auto h-4 w-4" aria-hidden />
      </footer>
    </article>
  );
}
