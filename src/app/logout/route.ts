import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEMO_ROLE_COOKIE } from "@/lib/members/service";

export async function GET(request: Request) {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();

  // Also ends a demo session, so signing out works before Supabase exists.
  (await cookies()).delete(DEMO_ROLE_COOKIE);

  return NextResponse.redirect(new URL("/login", request.url));
}
