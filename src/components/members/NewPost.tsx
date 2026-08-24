"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, TriangleAlert, X } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { createPost } from "@/lib/members/actions";
import { AUDIENCE_TAGS } from "@/lib/members/types";
import { field, submitButton } from "./ui";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 4;

/**
 * Putting something on the board.
 *
 * Photos go straight to the private bucket from the browser, into a folder
 * named after whoever uploaded them — which is exactly what the storage policy
 * checks — and the paths travel with the form in hidden inputs. Nothing here
 * ever holds a URL: the wall signs them when it renders.
 */
export function NewPost({
  authorId,
  asCoach,
  placeholder,
}: {
  authorId: string;
  asCoach: boolean;
  placeholder: string;
}) {
  const [paths, setPaths] = useState<Array<{ path: string; preview: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);

  async function upload(files: FileList) {
    setError(null);
    const room = MAX_FILES - paths.length;
    if (room <= 0) {
      setError(`Four photos is the most on one post.`);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Photos need the database connected. This is demo mode.");
      return;
    }

    setBusy(true);
    for (const file of Array.from(files).slice(0, room)) {
      if (!TYPES.includes(file.type)) {
        setError("Those have to be JPG, PNG, WEBP or GIF.");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is over 10MB.`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase().slice(0, 5) || "jpg";
      const path = `${authorId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("board")
        .upload(path, file, { contentType: file.type });
      if (uploadError) {
        setError("One of those did not upload. Try again in a moment.");
        continue;
      }
      setPaths((current) => [...current, { path, preview: URL.createObjectURL(file) }]);
    }
    setBusy(false);
  }

  return (
    <form
      ref={form}
      action={async (formData) => {
        await createPost(formData);
        form.current?.reset();
        setPaths([]);
      }}
      className="space-y-4"
    >
      <textarea
        name="body"
        rows={3}
        maxLength={2000}
        placeholder={placeholder}
        aria-label="What you want to say"
        className={field}
      />

      {paths.map((entry) => (
        <input key={entry.path} type="hidden" name="media" value={entry.path} />
      ))}

      {paths.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {paths.map((entry, index) => (
            <li key={entry.path} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local
                  object URL, gone the moment the post is made. */}
              <img
                src={entry.preview}
                alt={`Photo ${index + 1}`}
                className="aspect-square w-full rounded-2xl border border-line object-cover"
              />
              <button
                type="button"
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => setPaths((current) => current.filter((p) => p.path !== entry.path))}
                className="absolute top-1.5 right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 text-muted transition-colors hover:text-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="inline-flex items-start gap-2 text-xs text-danger">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {busy ? "Uploading…" : "Add a photo"}
        </button>
        <button type="submit" className={submitButton}>
          Post it
        </button>
      </div>

      <input
        ref={input}
        type="file"
        accept={TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) void upload(event.target.files);
          event.target.value = "";
        }}
      />

      {asCoach ? (
        <p className="text-xs text-faint">
          Type {AUDIENCE_TAGS.everyone}, {AUDIENCE_TAGS.online} or {AUDIENCE_TAGS.one_to_one} and
          they&rsquo;ll get a notification about it.
        </p>
      ) : null}
    </form>
  );
}
