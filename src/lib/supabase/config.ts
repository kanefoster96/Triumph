/**
 * Supabase is optional until the project is connected.
 *
 * With no credentials the members' area runs on the demo dataset in
 * `lib/members/demo.ts` so the interface can be reviewed. Set both variables
 * and every read and write switches to the real database — no code changes.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
}
