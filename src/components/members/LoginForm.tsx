"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";

const field =
  "w-full rounded-2xl border border-line bg-ink px-4 py-3 text-sm text-text transition-colors placeholder:text-faint focus:border-accent focus:outline-none";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return;

    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    setPending(false);

    if (signInError) {
      setError("That email and password did not match. Try again, or ask Dean to resend your invite.");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="mb-2 block text-xs font-semibold tracking-[0.14em] text-faint uppercase">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={field} />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-xs font-semibold tracking-[0.14em] text-faint uppercase"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={field}
        />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Sign in
      </Button>
    </form>
  );
}
