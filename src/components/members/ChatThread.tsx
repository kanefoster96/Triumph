"use client";

import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { Loader2, Paperclip, Send, TriangleAlert, X } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import type { ChatMessage } from "@/lib/members/types";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024;

/** How often the poll runs when the socket has nothing to say. */
const POLL_MS = 5000;

export interface ChatThreadProps {
  threadId: string;
  /** Which side of the thread is looking, and so which side is on the right. */
  asCoach: boolean;
  viewerName: string;
  otherName: string;
  otherAvatarUrl?: string | null;
  initialMessages: ChatMessage[];
  /**
   * The writes, handed in rather than imported.
   *
   * Both sides of the conversation are the same component and the same server
   * actions — the actions work out who is asking from the session. Injecting
   * them keeps this file free of any import that would tie it to one screen,
   * which is what makes it the same component on the phone app later.
   */
  sendAction: (input: {
    threadId: string;
    body: string;
    attachmentPath?: string | null;
    attachmentType?: string | null;
    attachmentName?: string | null;
  }) => Promise<ChatMessage | null>;
  markReadAction: (threadId: string) => Promise<void>;
  fetchNewAction: (threadId: string, since: string | null) => Promise<ChatMessage[]>;
  attachmentUrlAction: (path: string) => Promise<string | null>;
}

/**
 * One conversation, both ways round.
 *
 * A message appears the instant it is sent, under a temporary id, and is
 * replaced by the real row when it comes back. That is worth the machinery
 * because the alternative — a message that hangs for a second and then jumps —
 * reads as an app that dropped it.
 *
 * Nothing arrives twice. `merge` is keyed on id and every path into the list
 * goes through it, so the socket delivering a message the poll already fetched
 * is a no-op rather than a double.
 */
export function ChatThread({
  threadId,
  asCoach,
  viewerName,
  otherName,
  otherAvatarUrl,
  initialMessages,
  sendAction,
  markReadAction,
  fetchNewAction,
  attachmentUrlAction,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<
    { path: string; type: string; name: string } | null
  >(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  /**
   * Sends that have not come back yet, by temporary id.
   *
   * Without it a slow send whose real row arrives on the socket first would
   * leave the placeholder sitting underneath it forever.
   */
  const pending = useRef(new Set<string>());
  // The header renders this component once for the page and once inside the
  // menu on some screens; two channels of the same name would be one
  // subscription and only one of them would ever receive anything.
  const channelId = useId();

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((current) => {
      const byId = new Map(current.map((message) => [message.id, message]));
      for (const message of incoming) byId.set(message.id, { ...message, pending: false });
      return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });
  }, []);

  // Read marks are a side effect of looking at the thread, not a button.
  useEffect(() => {
    void markReadAction(threadId);
  }, [threadId, markReadAction]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const latest = useCallback(
    () => messages.filter((m) => !m.pending).at(-1)?.createdAt ?? null,
    [messages],
  );

  // The socket is the fast path. The poll is the one that is always right: a
  // phone that has been in a pocket comes back with a dead connection and no
  // way of knowing it missed anything.
  useEffect(() => {
    const timer = setInterval(() => {
      void fetchNewAction(threadId, latest()).then(merge);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [threadId, latest, merge, fetchNewAction]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`chat:${threadId}:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          merge([
            {
              id: String(row.id),
              threadId: String(row.thread_id),
              senderId: String(row.sender_id),
              fromCoach: Boolean(row.from_coach),
              body: (row.body as string) ?? null,
              attachmentPath: (row.attachment_path as string) ?? null,
              attachmentType: (row.attachment_type as string) ?? null,
              attachmentName: (row.attachment_name as string) ?? null,
              createdAt: String(row.created_at),
            },
          ]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, channelId, merge]);

  async function upload(file: File) {
    setError(null);
    if (!TYPES.includes(file.type)) {
      setError("That has to be an image or a PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That one is over 10MB.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Files need the database connected. This is demo mode.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase().slice(0, 5) || "bin";
    // Filed under the thread, which is exactly the question the storage policy
    // asks: whoever may read the thread may read what is in it.
    const path = `${threadId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(path, file, { contentType: file.type });
    setUploading(false);

    if (uploadError) {
      setError("That did not upload. Try again in a moment.");
      return;
    }
    setAttachment({ path, type: file.type, name: file.name.slice(0, 80) });
  }

  function send() {
    const body = draft.trim();
    if (!body && !attachment) return;

    const tempId = `temp-${crypto.randomUUID()}`;
    pending.current.add(tempId);
    const optimistic: ChatMessage = {
      id: tempId,
      threadId,
      senderId: "me",
      fromCoach: asCoach,
      body: body || null,
      attachmentPath: attachment?.path ?? null,
      attachmentType: attachment?.type ?? null,
      attachmentName: attachment?.name ?? null,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((current) => [...current, optimistic]);
    setDraft("");
    const sent = attachment;
    setAttachment(null);

    startSending(async () => {
      const saved = await sendAction({
        threadId,
        body,
        attachmentPath: sent?.path ?? null,
        attachmentType: sent?.type ?? null,
        attachmentName: sent?.name ?? null,
      });
      pending.current.delete(tempId);
      setMessages((current) => {
        const without = current.filter((message) => message.id !== tempId);
        if (!saved) return [...without, { ...optimistic, pending: false }];
        if (without.some((message) => message.id === saved.id)) return without;
        return [...without, saved].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      });
      if (!saved) setError("That did not send. Try again.");
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-faint">
            {asCoach
              ? `Nothing here yet. Anything ${otherName.split(" ")[0]} sends lands here.`
              : "Say hello. I read everything that comes in here."}
          </p>
        ) : null}

        {messages.map((message) => {
          const mine = message.fromCoach === asCoach;
          return (
            <div
              key={message.id}
              className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}
            >
              {!mine ? (
                <Avatar name={otherName} src={otherAvatarUrl} size="xs" className="mb-1 shrink-0" />
              ) : null}
              <div
                className={cn(
                  "max-w-[78%] min-w-0 rounded-[var(--radius-sheet)] border px-4 py-2.5",
                  mine ? "border-accent/30 bg-accent/10" : "border-line bg-surface",
                  message.pending && "opacity-60",
                )}
              >
                {message.body ? (
                  <p className="text-sm break-words whitespace-pre-wrap">{message.body}</p>
                ) : null}
                {message.attachmentPath ? (
                  <Attachment
                    path={message.attachmentPath}
                    type={message.attachmentType}
                    name={message.attachmentName}
                    getUrl={attachmentUrlAction}
                  />
                ) : null}
                <p className="mt-1 text-[11px] text-faint">
                  {message.pending
                    ? "Sending…"
                    : new Date(message.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      {error ? (
        <p className="mb-2 inline-flex items-start gap-2 text-xs text-danger">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}

      {attachment ? (
        <div className="mb-2 flex items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2">
          <Paperclip className="h-4 w-4 shrink-0 text-faint" />
          <span className="min-w-0 flex-1 truncate text-xs text-muted">{attachment.name}</span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            aria-label="Remove attachment"
            className="text-faint transition-colors hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Deliberately not a <form>: this sits inside pages that already have
          one, and a form inside a form is dropped by the browser in silence. */}
      <div className="flex items-end gap-2 border-t border-line pt-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
          aria-label="Attach a file"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={TYPES.join(",")}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends on a keyboard; the phone keeps its return key for a
            // new line, because there is a send button an inch away.
            if (event.key === "Enter" && !event.shiftKey && !("ontouchstart" in window)) {
              event.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={asCoach ? `Message ${otherName.split(" ")[0]}` : "Message Dean"}
          aria-label="Your message"
          className="max-h-32 min-h-11 w-full flex-1 resize-none rounded-2xl border border-line bg-ink px-4 py-3 text-sm text-text transition-colors placeholder:text-faint focus:border-accent focus:outline-none"
        />

        <button
          type="button"
          onClick={send}
          disabled={sending || uploading || (!draft.trim() && !attachment)}
          aria-label="Send"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-colors hover:bg-accent-strong disabled:bg-raised disabled:text-faint"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <span className="sr-only">{viewerName}</span>
    </div>
  );
}

/**
 * A file in the thread.
 *
 * The URL is minted when the bubble renders and lasts an hour. Nothing in the
 * database is a link, so a page saved or a screenshot shared carries no way
 * back into somebody's conversation.
 */
function Attachment({
  path,
  type,
  name,
  getUrl,
}: {
  path: string;
  type: string | null;
  name: string | null;
  getUrl: (path: string) => Promise<string | null>;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void getUrl(path).then((signed) => {
      if (live) setUrl(signed);
    });
    return () => {
      live = false;
    };
  }, [path, getUrl]);

  if (!url) {
    return <p className="mt-2 text-xs text-faint">{name ?? "Attachment"}</p>;
  }

  if (type?.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-2 block">
        {/* eslint-disable-next-line @next/next/no-img-element -- a signed URL
            that expires in an hour is not something to run through the image
            optimiser and cache. */}
        <img
          src={url}
          alt={name ?? "Attachment"}
          className="max-h-64 w-full rounded-2xl border border-line object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-accent"
    >
      <Paperclip className="h-3.5 w-3.5" />
      {name ?? "Attachment"}
    </a>
  );
}
