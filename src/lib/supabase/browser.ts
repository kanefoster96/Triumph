import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/** Supabase client for client components. Null until the project is connected. */
export function createClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
