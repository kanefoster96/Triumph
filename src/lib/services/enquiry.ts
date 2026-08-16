import type { EnquiryDraft, EnquiryResult } from "@/lib/types";

/**
 * Enquiry validation and submission.
 *
 * Split out from `content.ts` so the client-side form does not pull the whole
 * content catalogue into the browser bundle. Shared verbatim with the app.
 */

export function validateEnquiry(draft: Partial<EnquiryDraft>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.name?.trim()) errors.name = "Please tell me your name.";
  if (!draft.email?.trim()) {
    errors.email = "I need an email to reply to.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
    errors.email = "That email does not look right.";
  }
  if (!draft.goal?.trim()) errors.goal = "Pick the goal that fits best.";
  return errors;
}

/**
 * Stand-in for the real submission. Swap the body for a POST to your CRM,
 * an email service, or a Supabase insert — the call sites do not change.
 */
export async function submitEnquiry(draft: EnquiryDraft): Promise<EnquiryResult> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const reference = `TRI-${draft.name.trim().slice(0, 2).toUpperCase()}${Date.now().toString().slice(-5)}`;
  return {
    ok: true,
    reference,
    message: "Thanks — I read every enquiry myself and reply within one working day.",
  };
}
