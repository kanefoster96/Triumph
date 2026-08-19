"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, TriangleAlert, X } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Avatar } from "./Avatar";

/** What the bucket accepts, said once so the input and the check agree. */
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * A face, uploaded.
 *
 * It used to be a URL field, which asked somebody to go and host a photo
 * somewhere first — so nobody had one. The file goes straight to Supabase
 * Storage from the browser, into a folder named after whoever owns it, and the
 * public URL travels with the surrounding form in a hidden input. That means
 * this component never has to know which form it is in or what saving means:
 * the page it sits on decides.
 *
 * Initials stay the fallback. Most people will not upload anything, and the
 * empty state has to look deliberate rather than broken.
 */
export function AvatarUpload({
  name,
  ownerId,
  initial,
  label = "Photo",
  hint = "Optional. A square one looks best.",
}: {
  /** For the initials, and the alt text. */
  name: string;
  /** Whose folder to write into — the storage policy checks this. */
  ownerId: string;
  initial?: string | null;
  label?: string;
  hint?: string;
}) {
  const [url, setUrl] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);

    if (!TYPES.includes(file.type)) {
      setError("That has to be a JPG, PNG, WEBP or GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That one is over 5MB. Try a smaller photo.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      // Demo mode has no storage behind it, and a preview that vanished on
      // save would be worse than saying so.
      setError("Photos need the database connected. This is demo mode.");
      return;
    }

    setBusy(true);
    // Named by time inside the owner's folder: a new upload never has to wait
    // for a cache to expire, and the policy only lets you write your own.
    const ext = file.name.split(".").pop()?.toLowerCase().slice(0, 5) || "jpg";
    const path = `${ownerId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setBusy(false);
      setError("That did not upload. Try again in a moment.");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setUrl(data.publicUrl);
    setBusy(false);
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-semibold tracking-[0.14em] text-faint uppercase">
        {label}
      </span>

      {/* The value the surrounding form actually submits. */}
      <input type="hidden" name="avatarUrl" value={url} />

      <div className="flex items-center gap-4">
        <Avatar name={name} src={url || null} size="lg" ring />

        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {busy ? "Uploading…" : url ? "Change photo" : "Upload a photo"}
          </button>

          {url ? (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-faint transition-colors hover:text-danger"
            >
              <X className="h-4 w-4" />
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept={TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          // Cleared so picking the same file twice still fires a change.
          event.target.value = "";
        }}
      />

      {error ? (
        <p className="mt-2 inline-flex items-start gap-2 text-xs text-danger">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-faint">{hint}</p>
      )}
    </div>
  );
}
