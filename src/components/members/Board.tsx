"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { addBoardComment, deletePost, setLiked } from "@/lib/members/actions";
import type { BoardComment, BoardPost } from "@/lib/members/types";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";

function when(iso: string) {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days === 0) return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * The wall.
 *
 * Every post the reader is allowed to see, newest first — the select policy on
 * the table decided that, not this component. Likes and comments land on
 * screen before the server has answered, because a heart that waits half a
 * second for a page to come back does not feel like a heart.
 */
export function Board({
  posts,
  viewerId,
  isCoach,
}: {
  posts: BoardPost[];
  viewerId: string;
  isCoach: boolean;
}) {
  if (posts.length === 0) {
    return <p className="py-10 text-center text-sm text-faint">Nothing on the board yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} viewerId={viewerId} isCoach={isCoach} />
        </li>
      ))}
    </ul>
  );
}

function PostCard({
  post,
  viewerId,
  isCoach,
}: {
  post: BoardPost;
  viewerId: string;
  isCoach: boolean;
}) {
  const [comments, setComments] = useState<BoardComment[]>(post.comments);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [, startComment] = useTransition();

  return (
    <article className="rounded-[var(--radius-sheet)] border border-line bg-surface p-5">
      <header className="flex items-center gap-3">
        <Avatar name={post.authorName} src={post.authorAvatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-sm font-semibold">
            {post.authorName}
            {post.fromCoach ? (
              <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                Coach
              </span>
            ) : null}
          </p>
          <p className="text-xs text-faint">{when(post.createdAt)}</p>
        </div>
        {post.authorId === viewerId || isCoach ? (
          <form action={deletePost}>
            <input type="hidden" name="id" value={post.id} />
            <button
              type="submit"
              aria-label="Delete this post"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-faint transition-colors hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        ) : null}
      </header>

      <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>

      {post.media.length > 0 ? (
        <ul
          className={cn(
            "mt-4 grid gap-2",
            post.media.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {post.media.map((url, index) => (
            <li key={url} className="min-w-0">
              <a href={url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- a
                    signed URL that expires in an hour is not worth putting
                    through the optimiser and its cache. */}
                <img
                  src={url}
                  alt={`Photo ${index + 1} on ${post.authorName}'s post`}
                  className={cn(
                    "w-full rounded-2xl border border-line object-cover",
                    post.media.length === 1 ? "max-h-96" : "aspect-square",
                  )}
                />
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
        <LikeButton postId={post.id} liked={post.likedByMe} likes={post.likes} />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-muted transition-colors hover:text-text"
        >
          <MessageCircle className="h-4 w-4" />
          {comments.length > 0 ? comments.length : ""}
          <span className={comments.length > 0 ? "sr-only" : ""}>Comment</span>
        </button>
      </div>

      {open ? (
        <div className="mt-3 space-y-3 border-t border-line pt-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar
                name={comment.authorName}
                src={comment.authorAvatarUrl}
                size="xs"
                className="mt-0.5 shrink-0"
              />
              <p className="min-w-0 text-sm">
                <span className="font-semibold">{comment.authorName}</span>{" "}
                <span className="break-words text-muted">{comment.body}</span>
              </p>
            </div>
          ))}

          {/* Not a <form>: this card sits inside pages that already have one,
              and a form inside a form is dropped by the browser in silence. */}
          <div className="flex items-end gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Say something"
              aria-label="Your comment"
              maxLength={1000}
              className="min-h-11 w-full flex-1 rounded-2xl border border-line bg-ink px-4 text-sm text-text transition-colors placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              disabled={!draft.trim()}
              onClick={() => {
                const body = draft.trim();
                if (!body) return;
                setDraft("");
                startComment(async () => {
                  // The action hands back the row it wrote, so the thread grows
                  // by one instead of the whole wall being fetched again.
                  const saved = await addBoardComment(post.id, body);
                  if (saved) setComments((current) => [...current, saved]);
                });
              }}
              className="inline-flex h-11 shrink-0 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:bg-raised disabled:text-faint"
            >
              Send
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

/**
 * The heart.
 *
 * `useOptimistic` fills it in on the tap and puts it back if the write fails,
 * which is the only honest way to draw something this small: the alternative
 * is a control that looks broken for as long as the round trip takes.
 */
function LikeButton({
  postId,
  liked,
  likes,
}: {
  postId: string;
  liked: boolean;
  likes: number;
}) {
  const [state, setState] = useState({ liked, likes });
  const [optimistic, apply] = useOptimistic(
    state,
    (current, next: boolean) => ({
      liked: next,
      likes: current.likes + (next ? 1 : -1),
    }),
  );
  const [, start] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={optimistic.liked}
      onClick={() =>
        start(async () => {
          const next = !optimistic.liked;
          apply(next);
          const settled = await setLiked(postId, next);
          setState((current) => ({
            liked: settled,
            likes: current.likes + (settled === current.liked ? 0 : settled ? 1 : -1),
          }));
        })
      }
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors",
        optimistic.liked ? "text-accent" : "text-muted hover:text-text",
      )}
    >
      <Heart className={cn("h-4 w-4", optimistic.liked && "fill-current")} />
      {optimistic.likes > 0 ? optimistic.likes : ""}
      <span className={optimistic.likes > 0 ? "sr-only" : ""}>Like</span>
    </button>
  );
}
