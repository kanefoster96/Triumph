"use client";

import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import type { Post } from "@/lib/types";
import { cn, compactNumber, initials, relativeDate } from "@/lib/utils";
import { coach } from "@/lib/data/coach";

const kindLabel: Record<Post["kind"], string> = {
  tip: "Coaching note",
  win: "Client win",
  session: "Session",
  note: "Note",
};

/**
 * A feed post. The like button is local-only for now — when the app ships,
 * this becomes an optimistic update against the same shape.
 */
export function PostCard({ post, className }: { post: Post; className?: string }) {
  const [liked, setLiked] = useState(false);

  return (
    <article
      className={cn("lit flex flex-col rounded-[var(--radius-sheet)] bg-surface p-6", className)}
    >
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-sm font-bold text-accent">
          {initials(coach.name)}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{coach.name}</p>
          <p className="text-xs text-faint">
            {kindLabel[post.kind]} · {relativeDate(post.date)}
          </p>
        </div>
      </header>

      <h3 className="mt-5 text-lg leading-snug">{post.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{post.body}</p>

      {post.tags.length > 0 ? (
        <p className="mt-4 flex flex-wrap gap-2 text-xs text-accent">
          {post.tags.map((tag) => (
            <span key={tag}>#{tag.replace(/\s+/g, "")}</span>
          ))}
        </p>
      ) : null}

      <footer className="mt-5 flex items-center gap-5 text-xs text-faint">
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          className={cn(
            "inline-flex items-center gap-1.5 transition-[color,transform] duration-200 active:scale-90",
            liked ? "text-accent" : "hover:text-text",
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-accent")} />
          {compactNumber(post.likes + (liked ? 1 : 0))}
        </button>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4" />
          {post.comments}
        </span>
      </footer>
    </article>
  );
}
