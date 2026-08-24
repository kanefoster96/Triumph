"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/data/site";
import { AUDIENCE_TAGS, CHANGE_LABELS, CHANGE_MINE, changeValueLabel } from "./types";
import {
  demoCheckIns,
  demoExercises,
  demoMeals,
  demoProfiles,
  demoSessions,
} from "./demo";
import {
  DEMO_THREAD_ID,
  demoPeople,
  demoSocial,
  packRevision,
  writeDemoData,
  writeDemoPeople,
  writeDemoSocial,
  type PackedRevision,
} from "./demo-store";
import {
  DEMO_ROLE_COOKIE,
  getClients,
  getCurrentProfile,
  getDayProgress,
  getMeal,
  getPlanDay,
  getPlanDays,
  findLastLike,
  getMealLogs,
  getLearnedOrder,
  getShoppingList,
  getShoppingListById,
  getThreadMessages,
  getWorkoutFor,
  hasBoardAccess,
  SIGNED_URL_SECONDS,
  scaleMeal,
  shiftDate,
  today,
  weekdayOf,
  type RawRevision,
} from "./service";
import type {
  Application,
  BoardAudience,
  BoardComment,
  ChangeField,
  ChangeRequest,
  ChatMessage,
  CommentTarget,
  EditScope,
  FoodMode,
  MealTag,
  PlanDay,
  CoachingMode,
  GoalType,
  PlanKind,
  Profile,
  Question,
  SwapRequest,
} from "./types";

/**
 * Writes for the members' area and Dean's admin.
 *
 * Each one hits Supabase when connected and the in-memory demo dataset when
 * not. Demo edits live for the lifetime of the server process — enough to try
 * the interactions, not a substitute for the database.
 */

/** The fields a client may ask about, as a set the action can check against. */
const CHANGE_FIELDS = new Set<ChangeField>(Object.keys(CHANGE_LABELS) as ChangeField[]);

function refresh() {
  revalidatePath("/app", "layout");
  revalidatePath("/admin", "layout");
}



// ---------------------------------------------------------------------------
// Client actions
// ---------------------------------------------------------------------------

export async function toggleWorkoutItem(itemId: string, done: boolean) {
  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      data.itemEdits[itemId] = {
        ...data.itemEdits[itemId],
        done,
        doneAt: done ? new Date().toISOString() : null,
      };
    });
  } else {
    await supabase
      .from("workout_items")
      .update({ done, done_at: done ? new Date().toISOString() : null })
      .eq("id", itemId);
  }

  refresh();
}

export async function saveWorkoutNote(workoutId: string, note: string) {
  const supabase = await createClient();
  const value = note.trim() || null;

  if (!supabase) {
    await writeDemoData((data) => {
      data.workoutEdits[workoutId] = { ...data.workoutEdits[workoutId], clientNote: value };
    });
  } else {
    await supabase.from("workouts").update({ client_note: value }).eq("id", workoutId);
  }

  refresh();
}

export async function setWorkoutComplete(workoutId: string, complete: boolean) {
  const supabase = await createClient();
  const completedAt = complete ? new Date().toISOString() : null;

  if (!supabase) {
    await writeDemoData((data) => {
      data.workoutEdits[workoutId] = { ...data.workoutEdits[workoutId], completedAt };
    });
  } else {
    await supabase.from("workouts").update({ completed_at: completedAt }).eq("id", workoutId);
  }

  refresh();
}

export async function logFood(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const clientId = String(formData.get("clientId") ?? profile.id);
  const calories = Number(formData.get("calories"));
  if (!Number.isFinite(calories) || calories <= 0) return;

  const note = String(formData.get("note") ?? "").trim() || null;
  const loggedFor = String(formData.get("date") ?? today());

  // Optional: someone who knows the macros keeps the ring honest, someone who
  // does not still gets to log the calories.
  const macro = (key: string) => {
    const value = Number(formData.get(key));
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  };
  const proteinG = macro("protein");
  const carbsG = macro("carbs");
  const fatG = macro("fat");

  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      data.foodLogs.push({
        id: crypto.randomUUID(),
        clientId,
        loggedFor,
        calories: Math.round(calories),
        proteinG,
        carbsG,
        fatG,
        note,
        createdAt: new Date().toISOString(),
      });
    });
  } else {
    await supabase.from("food_logs").insert({
      client_id: clientId,
      logged_for: loggedFor,
      calories: Math.round(calories),
      protein_g: proteinG,
      carbs_g: carbsG,
      fat_g: fatG,
      note,
    });
  }

  refresh();
}

export async function deleteFoodLog(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      data.foodLogs = data.foodLogs.filter((l) => l.id !== id);
      // A seeded log cannot be spliced out of the seed, so it is remembered
      // as deleted instead.
      if (!data.deletedFoodLogs.includes(id)) data.deletedFoodLogs.push(id);
    });
  } else {
    await supabase.from("food_logs").delete().eq("id", id);
  }

  refresh();
}

export async function logWeight(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const clientId = String(formData.get("clientId") ?? profile.id);
  const weightKg = Number(formData.get("weight"));
  if (!Number.isFinite(weightKg) || weightKg <= 0) return;

  const note = String(formData.get("note") ?? "").trim() || null;
  const loggedFor = String(formData.get("date") ?? today());
  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      const existing = data.weightEntries.find(
        (w) => w.clientId === clientId && w.loggedFor === loggedFor,
      );
      if (existing) {
        existing.weightKg = weightKg;
        existing.note = note;
      } else {
        data.weightEntries.push({ id: crypto.randomUUID(), clientId, loggedFor, weightKg, note });
      }
    });
  } else {
    await supabase
      .from("weight_entries")
      .upsert(
        { client_id: clientId, logged_for: loggedFor, weight_kg: weightKg, note },
        { onConflict: "client_id,logged_for" },
      );
  }

  refresh();
}

export async function markCommentsRead() {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const supabase = await createClient();
  const now = new Date().toISOString();

  if (!supabase) {
    await writeDemoData((data) => {
      for (const comment of data.comments) {
        if (comment.clientId === profile.id && comment.readAt === null) comment.readAt = now;
      }
    });
  } else {
    await supabase.from("comments").update({ read_at: now }).eq("client_id", profile.id).is("read_at", null);
  }

  refresh();
}

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------

export async function addComment(
  clientId: string,
  targetType: CommentTarget,
  targetId: string,
  body: string,
) {
  const author = await getCurrentProfile();
  if (!author || !body.trim()) return;

  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      data.comments.push({
        id: crypto.randomUUID(),
        clientId,
        authorId: author.id,
        authorName: author.fullName,
        authorRole: author.role,
        targetType,
        targetId,
        body: body.trim(),
        readAt: null,
        createdAt: new Date().toISOString(),
      });
    });
  } else {
    await supabase.from("comments").insert({
      client_id: clientId,
      author_id: author.id,
      target_type: targetType,
      target_id: targetId,
      body: body.trim(),
    });
  }

  refresh();
}



/** Schedule a session, or edit one that already exists. */
export async function saveSession(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "");
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const startsAtLocal = String(formData.get("startsAt") ?? "") || (date && time ? `${date}T${time}` : "");
  if (!clientId || !startsAtLocal) return;

  const startsAt = new Date(startsAtLocal).toISOString();
  const durationMinutes = Number(formData.get("duration") ?? 60) || 60;
  // The picker offers presets; "locationOther" wins when it is filled in.
  const other = String(formData.get("locationOther") ?? "").trim();
  const location = other || String(formData.get("location") ?? "").trim() || site.inPersonArea;
  const coachNotes = String(formData.get("coachNotes") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "scheduled") as "scheduled" | "completed" | "cancelled";

  const supabase = await createClient();

  if (!supabase) {
    const existing = demoSessions.find((s) => s.id === id);
    if (existing) {
      Object.assign(existing, { startsAt, durationMinutes, location, coachNotes, status });
    } else {
      demoSessions.push({
        id: crypto.randomUUID(),
        clientId,
        startsAt,
        durationMinutes,
        location,
        status,
        coachNotes,
      });
    }
  } else {
    const payload = {
      client_id: clientId,
      starts_at: startsAt,
      duration_minutes: durationMinutes,
      location,
      coach_notes: coachNotes,
      status,
    };
    if (id) await supabase.from("sessions").update(payload).eq("id", id);
    else await supabase.from("sessions").insert(payload);
  }

  refresh();
}

export async function deleteSession(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    const index = demoSessions.findIndex((s) => s.id === id);
    if (index >= 0) demoSessions.splice(index, 1);
  } else {
    await supabase.from("sessions").delete().eq("id", id);
  }

  refresh();
}

// ---------------------------------------------------------------------------
// Demo only
// ---------------------------------------------------------------------------

/** Switches between the client and admin view while there is no real auth. */
export async function setDemoRole(role: "client" | "admin") {
  const supabase = await createClient();
  if (supabase) return; // Real auth decides the role once connected.

  const store = await cookies();
  store.set(DEMO_ROLE_COOKIE, role, { path: "/", httpOnly: false, sameSite: "lax" });
  refresh();
}

/** "Signs in" as a demo client or coach and lands on the right home screen. */
// ---------------------------------------------------------------------------
// Public signup — apply to train, and the account it creates
// ---------------------------------------------------------------------------

/**
 * A word about passwords in demo mode.
 *
 * The wizard and the sign-in page ask for one, because the flow is the thing
 * being looked at and a signup with no password is not the flow. Nothing is
 * stored: there is no hashing here, no credential in the cookie, and sign-in
 * matches on the email alone. Writing a password — however scrambled — into a
 * store that travels with the browser would be teaching the wrong lesson, and
 * Supabase Auth is what replaces this the moment it is connected.
 *
 * Both screens say so on the page rather than only here.
 */
const normalise = (email: string) => email.trim().toLowerCase();

/** Everybody signed up in this demo, seeded cast included. */
async function demoAccountFor(email: string): Promise<Profile | null> {
  const target = normalise(email);
  if (!target) return null;
  const { profiles } = await demoPeople();
  return (
    profiles.find((profile) => normalise(profile.email ?? "") === target) ??
    demoProfiles.find((profile) => normalise(profile.email ?? "") === target) ??
    null
  );
}

/** An optional weight from the wizard: a positive number, or nothing. */
function readNumber(formData: FormData, key: string): number | null {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? Number(value.toFixed(1)) : null;
}

function readGoal(formData: FormData): GoalType {
  const goals: GoalType[] = ["muscle", "lose", "fitness", "other"];
  return goals.find((goal) => goal === formData.get("goalType")) ?? "fitness";
}

function readGoalOther(formData: FormData): string | null {
  if (readGoal(formData) !== "other") return null;
  return String(formData.get("goalOther") ?? "").trim().slice(0, 120) || null;
}

/**
 * Whether they said they have a gym.
 *
 * Three states, not two: an application sent before the question existed
 * answered neither way, and null is what says so.
 */
function readHasGym(formData: FormData): boolean | null {
  const value = formData.get("hasGym");
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function readGymName(formData: FormData): string | null {
  if (readHasGym(formData) !== true) return null;
  return String(formData.get("gymName") ?? "").trim().slice(0, 80) || null;
}

/** Starts a demo session as a particular account rather than a demo role. */
async function signInAs(profileId: string) {
  const store = await cookies();
  store.set(DEMO_ROLE_COOKIE, profileId, { path: "/", httpOnly: false, sameSite: "lax" });
}

/**
 * Apply to train, and get an account on the way through.
 *
 * One action rather than two screens: somebody who has just filled in three
 * steps about their goals should not then be asked to sign up before any of it
 * counts. The account and the application are written together, and they are
 * signed in when it returns.
 *
 * No plan and no price is collected because there are none to collect — Dean
 * reads this and builds them something, which is the whole shape of the
 * business. Payment is a separate step he takes later; see `lib/services/payments.ts`.
 */
export async function submitApplication(formData: FormData) {
  const email = normalise(String(formData.get("email") ?? ""));
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return;

  const supabase = await createClient();
  const existing = await getCurrentProfile();

  if (supabase) {
    /*
     * Two ways in. Somebody already signed in — a basic account deciding they
     * want coaching after all — keeps the account they have; anybody else gets
     * one made here. Either way an application is written and the profile
     * moves to 'applicant', which is what puts them in Dean's inbox.
     */
    if (!existing) {
      if (!email) return;
      const { error } = await supabase.auth.signUp({
        email,
        password: String(formData.get("password") ?? ""),
        options: { data: { full_name: fullName } },
      });

      if (error) {
        const taken = error.message.toLowerCase().includes("registered");
        if (!taken) console.error("[apply] signUp failed:", error.message);
        redirect(`/join?e=${taken ? "taken" : "1"}`);
      }
    }

    const { data: session } = await supabase.auth.getUser();
    if (!session.user) {
      console.error("[apply] no session after signUp");
      redirect("/join?e=1");
    }

    // A coach who fills this in is still a coach, and is not his own
    // applicant.
    const profile = existing ?? (await getCurrentProfile());
    if (profile?.role === "admin") {
      refresh();
      redirect("/admin");
    }

    const { error: appError } = await supabase.from("applications").insert({
      account_id: session.user.id,
      full_name: fullName,
      email: email || profile?.email || session.user.email,
      current_weight_kg: readNumber(formData, "currentWeightKg"),
      goal_weight_kg: readNumber(formData, "goalWeightKg"),
      goal_type: readGoal(formData),
      goal_other: readGoalOther(formData),
      has_gym: readHasGym(formData),
      gym_name: readGymName(formData),
    });
    if (appError) console.error("[apply] application insert failed:", appError.message);

    // Waiting on Dean now, which is what his inbox and their dashboard read.
    await supabase
      .from("profiles")
      .update({ full_name: fullName, status: "applicant" })
      .eq("id", session.user.id);

    refresh();
    redirect("/join/thanks");
  }

  // --- Demo mode ------------------------------------------------------------
  if (existing) {
    await writeDemoPeople((people) => {
      const mine = people.profiles.find((entry) => entry.id === existing.id);
      if (mine) Object.assign(mine, { fullName, status: "applicant" as const });
      people.applications.push(demoApplication(existing.id, fullName, existing.email ?? email, formData));
    });
    refresh();
    redirect("/join/thanks");
  }

  if (!email) return;
  const already = await demoAccountFor(email);
  if (already) {
    await signInAs(already.id);
    refresh();
    redirect("/app");
  }

  const accountId = crypto.randomUUID();
  const profile: Profile = {
    id: accountId,
    fullName,
    email,
    role: "client",
    // An account, not a client. They are in nobody's list until Dean enrols
    // them, and the requests inbox is the only place they show up.
    status: "applicant",
    goal: null,
    startedOn: new Date().toISOString().slice(0, 10),
    foodMode: "coach",
    // Online until Dean says otherwise — he picks when he enrols them.
    coachingMode: "online",
    avatarUrl: null,
  };

  await writeDemoPeople((people) => {
    people.profiles.push(profile);
    people.applications.push(demoApplication(accountId, fullName, email, formData));
  });

  await signInAs(accountId);
  refresh();
  redirect("/join/thanks");
}

/** One application, built the same way whichever demo path wrote it. */
function demoApplication(
  accountId: string,
  fullName: string,
  email: string,
  formData: FormData,
): Application {
  return {
    id: crypto.randomUUID(),
    accountId,
    fullName,
    email,
    avatarUrl: null,
    currentWeightKg: readNumber(formData, "currentWeightKg"),
    goalWeightKg: readNumber(formData, "goalWeightKg"),
    goalType: readGoal(formData),
    goalOther: readGoalOther(formData),
    hasGym: readHasGym(formData),
    gymName: readGymName(formData),
    status: "pending",
    createdAt: new Date().toISOString(),
    decidedAt: null,
  };
}

/**
 * A one-off question from the website.
 *
 * Open to anybody, signed in or not — somebody wanting to know whether Dean
 * coaches runners should not have to make an account to ask. It lands in his
 * inbox beside the applications but in its own list, because answering a
 * question and enrolling somebody are not the same job.
 */
export async function askQuestion(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().slice(0, 120);
  const body = String(formData.get("body") ?? "").trim().slice(0, 600);
  if (!name || !email.includes("@") || !body) redirect("/contact?e=1");

  const question: Question = {
    id: crypto.randomUUID(),
    name,
    email,
    body,
    createdAt: new Date().toISOString(),
    answeredAt: null,
  };

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoPeople((people) => {
      people.questions.push(question);
    });
  } else {
    await supabase.from("questions").insert({ name, email, body });
  }

  refresh();
  redirect("/contact?sent=1");
}

/** Mark a question dealt with, so the inbox only shows what is outstanding. */
export async function markQuestionAnswered(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoPeople((people) => {
      const question = people.questions.find((entry) => entry.id === id);
      if (question) question.answeredAt = new Date().toISOString();
    });
  } else {
    await supabase
      .from("questions")
      .update({ answered_at: new Date().toISOString() })
      .eq("id", id);
  }

  refresh();
  redirect("/admin/requests");
}

/** Sign in to an account made through the signup. */
/**
 * Make an account. Email, password, in.
 *
 * No approval, no confirmation and nothing to wait for: somebody who wants to
 * look round should be looking round. Their name and their face are asked for
 * afterwards, on their own profile, where they are optional — a signup that
 * demands four fields before it will let you see anything is a signup people
 * abandon.
 *
 * Applying to train is a different thing and lives at /join. This does not
 * make anybody Dean's client; the allowlist still decides who is a coach.
 */
export async function createAccount(formData: FormData) {
  const email = normalise(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6) redirect("/signup?e=short");

  const supabase = await createClient();

  if (supabase) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const taken = error.message.toLowerCase().includes("registered");
      if (!taken) console.error("[signup] createAccount failed:", error.message);
      redirect(`/signup?e=${taken ? "taken" : "1"}`);
    }

    // Straight in, and to the right side of the app: the allowlist may have
    // made this a coach, and a coach does not want a client's dashboard.
    const profile = await getCurrentProfile();
    refresh();
    redirect(profile?.role === "admin" ? "/admin" : "/app");
  }

  // Demo mode: the same shape, minus the database.
  const existing = await demoAccountFor(email);
  if (existing) {
    await signInAs(existing.id);
    refresh();
    redirect(existing.role === "admin" ? "/admin" : "/app");
  }

  const accountId = crypto.randomUUID();
  await writeDemoPeople((people) => {
    people.profiles.push({
      id: accountId,
      fullName: "",
      email,
      role: "client",
      status: "basic",
      goal: null,
      startedOn: new Date().toISOString().slice(0, 10),
      foodMode: "coach",
      coachingMode: "online",
      avatarUrl: null,
    });
  });

  await signInAs(accountId);
  refresh();
  redirect("/app");
}

/**
 * Their own name and face, set after the fact.
 *
 * Optional on purpose — the account works without either — and writable only
 * by the person it belongs to.
 */
export async function saveMyProfile(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const fullName = String(formData.get("fullName") ?? "").trim().slice(0, 80);
  const raw = String(formData.get("avatarUrl") ?? "").trim();
  const avatarUrl = raw.length <= 512 && /^https?:\/\//i.test(raw) ? raw : null;

  const supabase = await createClient();
  if (supabase) {
    await supabase
      .from("profiles")
      .update({ full_name: fullName, avatar_url: avatarUrl })
      .eq("id", profile.id);
  } else {
    await writeDemoData((data) => {
      if (avatarUrl) data.avatars[profile.id] = avatarUrl;
      else delete data.avatars[profile.id];
    });
    await writeDemoPeople((people) => {
      const mine = people.profiles.find((entry) => entry.id === profile.id);
      if (mine) Object.assign(mine, { fullName, avatarUrl });
    });
  }

  refresh();
  redirect("/app/profile?saved=1");
}

export async function signIn(formData: FormData) {
  const email = normalise(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Deliberately one message for both a wrong password and an unknown
    // address: saying which is which tells a stranger whose email is here.
    if (error) redirect("/login?e=1");

    // Where they land is what they are, and only the profile knows that.
    const profile = await getCurrentProfile();
    refresh();
    redirect(profile?.role === "admin" ? "/admin" : "/app");
  }

  const account = await demoAccountFor(email);
  if (!account) redirect("/login?e=1");

  await signInAs(account.id);
  refresh();
  redirect(account.role === "admin" ? "/admin" : "/app");
}

/**
 * Enrol an applicant, or turn them down.
 *
 * Approving flips the account from applicant to client, which is what puts
 * them in Dean's list and lets a plan be built for them. Payment is not part
 * of it — see the placeholder on the request itself.
 */
/** The goal every screen shows, in their words where they gave some. */
const GOAL_FOR: Record<GoalType, string> = {
  muscle: "Build muscle",
  lose: "Lose weight",
  fitness: "Get fitter",
  other: "Get started",
};

/**
 * Take somebody on, or turn them down.
 *
 * Approving is two writes that have to agree: the application is decided, and
 * the profile becomes an actual client — status, how they are coached, and the
 * goal carried across from what they applied with. Without the second one the
 * inbox empties and nothing else changes, which is exactly how it read.
 */
export async function decideApplication(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const id = String(formData.get("id") ?? "");
  const approve = formData.get("decision") === "approve";
  const coaching: CoachingMode = formData.get("coaching") === "one_to_one" ? "one_to_one" : "online";
  if (!id) return;

  let accountId: string | null = null;
  const supabase = await createClient();

  if (supabase) {
    const { data: application } = await supabase
      .from("applications")
      .update({ status: approve ? "approved" : "declined", decided_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending")
      .select("account_id, goal_type, goal_other")
      .maybeSingle();

    if (application) {
      accountId = application.account_id;

      if (approve) {
        await supabase
          .from("profiles")
          .update({
            status: "active",
            // Online or 1-to-1 is Dean's call and he makes it here. Either way
            // they get the whole app; 1-to-1 adds sessions in his diary.
            coaching_mode: coaching,
            goal: application.goal_other ?? GOAL_FOR[application.goal_type as GoalType],
          })
          .eq("id", application.account_id);
      }
    }
  } else {
    await writeDemoPeople((people) => {
      const application = people.applications.find((entry) => entry.id === id);
      if (!application || application.status !== "pending") return;

      application.status = approve ? "approved" : "declined";
      application.decidedAt = new Date().toISOString();
      accountId = application.accountId;

      const profile = people.profiles.find((entry) => entry.id === application.accountId);
      if (profile && approve) {
        profile.status = "active";
        profile.coachingMode = coaching;
        profile.goal = application.goalOther ?? GOAL_FOR[application.goalType];
      }
    });
  }

  refresh();
  // Straight into building their week, which is the next thing he does.
  if (approve && accountId) redirect(`/admin/clients/${accountId}/plan`);
  redirect("/admin/requests");
}

export async function enterDemoAs(role: "client" | "admin") {
  const supabase = await createClient();
  if (supabase) redirect("/login"); // Real auth once connected.

  const store = await cookies();
  store.set(DEMO_ROLE_COOKIE, role, { path: "/", httpOnly: false, sameSite: "lax" });
  refresh();
  redirect(role === "admin" ? "/admin" : "/app");
}

/** Clears the demo session. Paired with the real sign-out in /logout. */
export async function exitDemo() {
  const store = await cookies();
  store.delete(DEMO_ROLE_COOKIE);
  refresh();
  redirect("/login");
}

export async function getDemoClients() {
  return demoProfiles.filter((p) => p.role === "client");
}

// ---------------------------------------------------------------------------
// Reusable plans, and assigning them across days
// ---------------------------------------------------------------------------









// ---------------------------------------------------------------------------
// Check-ins
// ---------------------------------------------------------------------------

export async function recordCheckIn(formData: FormData) {
  const coach = await getCurrentProfile();
  if (!coach || coach.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!clientId || !note) return;

  const outcome = formData.get("outcome") === "adjusted" ? "adjusted" : "continued";
  const reviewInDays = Math.min(28, Math.max(1, Number(formData.get("reviewInDays") ?? 7) || 7));

  const periodEnd = today();
  const periodStart = shiftDate(periodEnd, -6);
  const nextReviewOn = shiftDate(periodEnd, reviewInDays);

  /*
   * Nothing to write forward. A weekday's plan stands until Dean changes it,
   * so "carry on" is exactly that: the note goes out and the plan is already
   * where it needs to be. Changing it means opening the day and editing it,
   * which is what this card's links are for.
   */
  const weeksPlanned = 0;

  const supabase = await createClient();
  let checkInId: string;

  if (!supabase) {
    checkInId = crypto.randomUUID();
    demoCheckIns.push({
      id: checkInId,
      clientId,
      coachId: coach.id,
      periodStart,
      periodEnd,
      outcome,
      note,
      weeksPlanned,
      nextReviewOn,
      createdAt: new Date().toISOString(),
    });
  } else {
    const { data } = await supabase
      .from("check_ins")
      .insert({
        client_id: clientId,
        coach_id: coach.id,
        period_start: periodStart,
        period_end: periodEnd,
        outcome,
        note,
        weeks_planned: weeksPlanned,
        next_review_on: nextReviewOn,
      })
      .select("id")
      .single();
    if (!data) return;
    checkInId = data.id;
  }

  // The client reads the note where they read everything else from Dean.
  await addComment(clientId, "check_in", checkInId, note);

  refresh();
}

// ---------------------------------------------------------------------------
// Libraries
// ---------------------------------------------------------------------------

/**
 * Ingredients arrive as three parallel lists, one entry per row.
 *
 * A quantity without a unit cannot be scaled or merged, so it is dropped back
 * to null rather than stored as a bare number the shopping list would have to
 * guess at. The form marks the unit required, so this is the backstop.
 */
function readIngredients(formData: FormData) {
  const names = formData.getAll("ingName").map(String);
  const quantities = formData.getAll("ingQuantity").map(String);
  const units = formData.getAll("ingUnit").map(String);

  return names
    .map((name, index) => {
      const amount = Number(quantities[index]);
      const unit = (units[index] ?? "").trim() || null;
      const quantity = Number.isFinite(amount) && quantities[index] !== "" ? amount : null;
      return {
        name: name.trim(),
        quantity: unit ? quantity : null,
        unit,
      };
    })
    .filter((entry) => entry.name !== "")
    .map((entry, position) => ({ position, ...entry }));
}

export async function saveExercise(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const fields = {
    name,
    muscleGroup: String(formData.get("muscleGroup") ?? "").trim() || null,
    equipment: String(formData.get("equipment") ?? "").trim() || null,
    howTo: String(formData.get("howTo") ?? "").trim() || null,
  };

  const supabase = await createClient();

  if (!supabase) {
    const existing = id ? demoExercises.find((e) => e.id === id) : null;
    if (existing) Object.assign(existing, fields);
    else demoExercises.push({ id: crypto.randomUUID(), ...fields, archivedAt: null });
  } else {
    const row = {
      name: fields.name,
      muscle_group: fields.muscleGroup,
      equipment: fields.equipment,
      how_to: fields.howTo,
    };
    if (id) await supabase.from("exercises").update(row).eq("id", id);
    else await supabase.from("exercises").insert(row);
  }

  refresh();
}

/**
 * Archive rather than delete. Past logs keep their snapshot either way, but a
 * plan still using it needs to stay readable so it can be flagged.
 */
export async function archiveExercise(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const archivedAt = new Date().toISOString();

  if (!supabase) {
    const existing = demoExercises.find((e) => e.id === id);
    if (existing) existing.archivedAt = existing.archivedAt ? null : archivedAt;
  } else {
    const { data } = await supabase.from("exercises").select("archived_at").eq("id", id).single();
    await supabase
      .from("exercises")
      .update({ archived_at: data?.archived_at ? null : archivedAt })
      .eq("id", id);
  }

  refresh();
}

export async function saveMeal(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const number = (key: string) => {
    const value = Number(formData.get(key));
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  };

  const tag = String(formData.get("tag") ?? "lunch") as MealTag;
  const ingredients = readIngredients(formData);
  const method = String(formData.get("method") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const fields = {
    name,
    tag,
    calories: number("calories"),
    proteinG: number("protein"),
    carbsG: number("carbs"),
    fatG: number("fat"),
  };

  const supabase = await createClient();

  if (!supabase) {
    const existing = id ? demoMeals.find((m) => m.id === id) : null;
    const built = {
      ...fields,
      ingredients: ingredients.map((i) => ({ id: crypto.randomUUID(), ...i })),
      method,
    };
    if (existing) Object.assign(existing, built);
    else demoMeals.push({ id: crypto.randomUUID(), ...built, archivedAt: null });
  } else {
    const row = {
      name: fields.name,
      tag: fields.tag,
      calories: fields.calories,
      protein_g: fields.proteinG,
      carbs_g: fields.carbsG,
      fat_g: fields.fatG,
    };

    const mealId = id
      ? ((await supabase.from("meals").update(row).eq("id", id).select("id").single()).data?.id ?? null)
      : ((await supabase.from("meals").insert(row).select("id").single()).data?.id ?? null);
    if (!mealId) return;

    await supabase.from("meal_ingredients").delete().eq("meal_id", mealId);
    if (ingredients.length > 0) {
      await supabase.from("meal_ingredients").insert(ingredients.map((i) => ({ meal_id: mealId, ...i })));
    }

    await supabase.from("meal_steps").delete().eq("meal_id", mealId);
    if (method.length > 0) {
      await supabase
        .from("meal_steps")
        .insert(method.map((body, position) => ({ meal_id: mealId, position, body })));
    }
  }

  refresh();
}

export async function archiveMeal(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const archivedAt = new Date().toISOString();

  if (!supabase) {
    const existing = demoMeals.find((m) => m.id === id);
    if (existing) existing.archivedAt = existing.archivedAt ? null : archivedAt;
  } else {
    const { data } = await supabase.from("meals").select("archived_at").eq("id", id).single();
    await supabase
      .from("meals")
      .update({ archived_at: data?.archived_at ? null : archivedAt })
      .eq("id", id);
  }

  refresh();
}

// ---------------------------------------------------------------------------
// Training
// ---------------------------------------------------------------------------

/**
 * Turn a planned day into a logged one.
 *
 * The plan generates; this is the moment it becomes a record. Names, muscle
 * groups and equipment are snapshotted here, so renaming a library exercise
 * later tidies future days without rewriting this one. Idempotent — opening a
 * workout twice does not start it twice.
 */
export async function startWorkout(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const clientId = String(formData.get("clientId") ?? profile.id);
  const date = String(formData.get("date") ?? today());

  const existing = await getWorkoutFor(clientId, date);
  if (!existing || !existing.fromPlan) return;

  const supabase = await createClient();

  if (!supabase) {
    // No copy: the plan already generates this day with stable ids, so
    // starting it is just a note that they have begun. Copying the whole
    // workout would put several kilobytes of sets into a cookie to say one
    // boolean, and would orphan every tick keyed to the original ids.
    await writeDemoData((data) => {
      if (!data.startedWorkouts.includes(existing.id)) data.startedWorkouts.push(existing.id);
    });
  } else {
    const { data: workout } = await supabase
      .from("workouts")
      .upsert(
        {
          client_id: clientId,
          scheduled_for: date,
          title: existing.title,
          suggested_time: existing.suggestedTime,
          coach_notes: existing.coachNotes,
        },
        { onConflict: "client_id,scheduled_for" },
      )
      .select("id")
      .single();
    if (!workout) return;

    for (const item of existing.items) {
      const { data: row } = await supabase
        .from("workout_items")
        .insert({
          workout_id: workout.id,
          position: item.position,
          label: item.label,
          exercise_id: item.exerciseId,
          muscle_group: item.muscleGroup,
          equipment: item.equipment,
        })
        .select("id")
        .single();
      if (!row || item.sets.length === 0) continue;

      await supabase.from("workout_sets").insert(
        item.sets.map((set) => ({
          workout_item_id: row.id,
          position: set.position,
          target_weight_kg: set.targetWeightKg,
          target_reps: set.targetReps,
        })),
      );
    }
  }

  refresh();
}

/** Record what they actually lifted on one set. */
export async function logSet(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const setId = String(formData.get("setId") ?? "");
  if (!setId) return;

  const number = (key: string) => {
    const value = Number(formData.get(key));
    return Number.isFinite(value) && value >= 0 ? value : null;
  };
  const actualWeightKg = number("weight");
  const actualReps = number("reps");
  const doneAt = new Date().toISOString();

  const supabase = await createClient();

  if (!supabase) {
    const itemId = String(formData.get("itemId") ?? "");
    const siblings = formData.getAll("siblingSetId").map(String);

    await writeDemoData((data) => {
      data.setEdits[setId] = { actualWeightKg, actualReps, doneAt };
      if (!itemId) return;
      // An exercise counts as done once every one of its sets has been logged.
      const allDone = siblings.every((id) => id === setId || data.setEdits[id]?.doneAt);
      data.itemEdits[itemId] = {
        ...data.itemEdits[itemId],
        done: allDone,
        doneAt: allDone ? doneAt : null,
      };
    });
  } else {
    await supabase
      .from("workout_sets")
      .update({ actual_weight_kg: actualWeightKg, actual_reps: actualReps, done_at: doneAt })
      .eq("id", setId);

    const { data: set } = await supabase
      .from("workout_sets")
      .select("workout_item_id")
      .eq("id", setId)
      .single();
    if (set) {
      const { data: siblings } = await supabase
        .from("workout_sets")
        .select("done_at")
        .eq("workout_item_id", set.workout_item_id);
      const done = (siblings ?? []).every((s) => s.done_at);
      await supabase
        .from("workout_items")
        .update({ done, done_at: done ? doneAt : null })
        .eq("id", set.workout_item_id);
    }
  }

  refresh();
}

/** Pass on an exercise, with the reason so Dean sees why. */
export async function skipExercise(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const itemId = String(formData.get("itemId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "Skipped";
  if (!itemId) return;

  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      data.itemEdits[itemId] = { ...data.itemEdits[itemId], skippedReason: reason, done: false };
    });
  } else {
    await supabase.from("workout_items").update({ skipped_reason: reason, done: false }).eq("id", itemId);
  }

  refresh();
}

/** "How did that go?" — the rating and note Dean reads at the weekly review. */
export async function finishWorkout(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const workoutId = String(formData.get("workoutId") ?? "");
  if (!workoutId) return;

  const feelingValue = Number(formData.get("feeling"));
  const feeling = feelingValue >= 1 && feelingValue <= 5 ? Math.round(feelingValue) : null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const completedAt = new Date().toISOString();

  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      data.workoutEdits[workoutId] = { feeling, clientNote: note, completedAt };
    });
  } else {
    await supabase
      .from("workouts")
      .update({ feeling, client_note: note, completed_at: completedAt })
      .eq("id", workoutId);
  }

  refresh();
  redirect("/app/workouts");
}

// ---------------------------------------------------------------------------
// The repeating plan
// ---------------------------------------------------------------------------

/**
 * Exercises come back as IDs from the library picker, never as typed names, so
 * a plan can never reference something that does not exist.
 *
 * Sets are flat lists — every set on the day in order — with one `setCount`
 * per exercise saying how many belong to it. That keeps a nested structure
 * expressible in a plain form post without smuggling JSON through a field.
 */
function readPlanExercises(formData: FormData) {
  const ids = formData.getAll("exerciseId").map(String);
  const notes = formData.getAll("exerciseNotes").map(String);
  const counts = formData.getAll("setCount").map((value) => Number(value) || 0);
  const weights = formData.getAll("setWeight").map(String);
  const reps = formData.getAll("setReps").map(String);

  let cursor = 0;
  return ids
    .map((exerciseId, index) => {
      const count = counts[index] ?? 0;
      const sets = Array.from({ length: count }, (_, offset) => {
        const weight = Number(weights[cursor + offset]);
        const repCount = Number(reps[cursor + offset]);
        return {
          position: offset,
          targetWeightKg: Number.isFinite(weight) && weights[cursor + offset] !== "" ? weight : null,
          targetReps: Number.isFinite(repCount) && reps[cursor + offset] !== "" ? repCount : null,
        };
      });
      cursor += count;
      return { position: index, exerciseId, notes: notes[index]?.trim() || null, sets };
    })
    .filter((entry) => entry.exerciseId !== "");
}

/** Meals likewise: a library ID, a slot and a multiplier. */
function readPlanMeals(formData: FormData) {
  const slots = formData.getAll("mealSlot").map(String);
  const ids = formData.getAll("mealId").map(String);
  const multipliers = formData.getAll("mealMultiplier").map((value) => Number(value));
  const valid: MealTag[] = ["breakfast", "lunch", "dinner", "snack"];
  const counters = new Map<MealTag, number>();

  return ids
    .map((mealId, index) => {
      const slot = valid.find((entry) => entry === slots[index]);
      if (!slot || !mealId) return null;

      const position = counters.get(slot) ?? 0;
      counters.set(slot, position + 1);
      const multiplier = multipliers[index];

      return {
        slot,
        position,
        mealId,
        multiplier: Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

/**
 * Insert one revision with its exercises and meals. Every plan edit goes
 * through here, so "insert, never rewrite" holds in one place.
 */
/**
 * Whether a stored revision is completely replaced by a new one.
 *
 * Two ways that happens: another day written for the same date, or another
 * standing day for the same weekday coming into force on the same date. In
 * both cases `pickRevision` would take the newer one every time, so the older
 * is bytes nothing can ever read.
 */
function supersededBy(packed: PackedRevision, next: RawRevision): boolean {
  const [clientId, weekday, kind, effectiveFrom, onlyOn] = packed;
  if (clientId !== next.clientId) return false;
  if ((kind === 1 ? "food" : "workout") !== next.kind) return false;

  if (next.onlyOn) return onlyOn === next.onlyOn;
  // A standing day also clears the pin on the date it is saved from, or the
  // day being edited would be the only one that did not change.
  if (onlyOn) return onlyOn === next.effectiveFrom && weekday === next.weekday;
  return weekday === next.weekday && effectiveFrom === next.effectiveFrom;
}

async function writeRevision(
  clientId: string,
  weekday: number,
  kind: "workout" | "food",
  effectiveFrom: string,
  onlyOn: string | null,
  body: {
    title: string | null;
    suggestedTime: string | null;
    coachNotes: string | null;
    calorieTarget: number | null;
    proteinTarget: number | null;
    isRest: boolean;
    exercises: Array<{
      position: number;
      exerciseId: string;
      notes: string | null;
      sets: Array<{ position: number; targetWeightKg: number | null; targetReps: number | null }>;
    }>;
    meals: Array<{ slot: MealTag; position: number; mealId: string; multiplier: number }>;
  },
) {
  const supabase = await createClient();

  if (!supabase) {
    const revision = {
      id: crypto.randomUUID(),
      clientId,
      weekday,
      kind,
      effectiveFrom,
      onlyOn,
      title: body.title,
      suggestedTime: body.suggestedTime,
      coachNotes: body.coachNotes,
      calorieTarget: body.calorieTarget,
      proteinTarget: body.proteinTarget,
      isRest: body.isRest,
      exercises: body.exercises.map((entry) => ({
        id: crypto.randomUUID(),
        position: entry.position,
        exerciseId: entry.exerciseId,
        notes: entry.notes,
        sets: entry.sets.map((set) => ({ id: crypto.randomUUID(), ...set })),
      })),
      meals: body.meals.map((entry) => ({ id: crypto.randomUUID(), ...entry })),
    };
    /*
     * Appended, never reordered — the newest edit to a date is the one that
     * counts, and that is decided by position in this list.
     *
     * Anything this revision completely replaces goes first, though. The
     * cookie is a few kilobytes, and a superseded revision is bytes spent on
     * something no read will ever pick: once the plan cookie is full the
     * pruner starts dropping the *oldest* edits, so dead weight at the front
     * is paid for by a day Dean built last week quietly reverting.
     */
    await writeDemoData((data) => {
      data.planRevisions = data.planRevisions.filter((packed) => !supersededBy(packed, revision));
      data.planRevisions.push(packRevision(revision));
    });
    return;
  }

  /*
   * Same clear-out as the demo path, so the table does not accumulate rows no
   * read can reach — and, for a standing day, so the pin on the date it is
   * saved from actually goes.
   */
  const dead = supabase.from("plan_day_revisions").delete().eq("client_id", clientId).eq("kind", kind);
  if (onlyOn) await dead.eq("only_on", onlyOn);
  else {
    await supabase
      .from("plan_day_revisions")
      .delete()
      .eq("client_id", clientId)
      .eq("kind", kind)
      .eq("weekday", weekday)
      .eq("only_on", effectiveFrom);
    await supabase
      .from("plan_day_revisions")
      .delete()
      .eq("client_id", clientId)
      .eq("kind", kind)
      .eq("weekday", weekday)
      .is("only_on", null)
      .eq("effective_from", effectiveFrom);
  }

  const { data: revision } = await supabase
    .from("plan_day_revisions")
    .insert({
      client_id: clientId,
      weekday,
      kind,
      effective_from: effectiveFrom,
      only_on: onlyOn,
      title: body.title,
      suggested_time: body.suggestedTime,
      coach_notes: body.coachNotes,
      calorie_target: body.calorieTarget,
      protein_target: body.proteinTarget,
      is_rest: body.isRest,
    })
    .select("id")
    .single();
  if (!revision) return;

  for (const entry of body.exercises) {
    const { data: planExercise } = await supabase
      .from("plan_exercises")
      .insert({
        revision_id: revision.id,
        exercise_id: entry.exerciseId,
        position: entry.position,
        notes: entry.notes,
      })
      .select("id")
      .single();
    if (!planExercise || entry.sets.length === 0) continue;

    await supabase.from("plan_sets").insert(
      entry.sets.map((set) => ({
        plan_exercise_id: planExercise.id,
        position: set.position,
        target_weight_kg: set.targetWeightKg,
        target_reps: set.targetReps,
      })),
    );
  }

  if (body.meals.length > 0) {
    await supabase.from("plan_meal_slots").insert(
      body.meals.map((entry) => ({
        revision_id: revision.id,
        slot: entry.slot,
        position: entry.position,
        meal_id: entry.mealId,
        multiplier: entry.multiplier,
      })),
    );
  }
}

/**
 * Write one day.
 *
 * Scope is the whole of the recurrence rule, and it is one question: "just
 * this day" pins a day to its date, "all future Mondays" makes it the standing
 * plan for that weekday from this date on. A future Monday that was already
 * pinned to its own date keeps what it has — pinned always beats standing —
 * so applying forward can never quietly overwrite a week somebody made
 * special. Nothing is ever backdated, which is what keeps past days as they
 * were.
 */
export async function savePlanDay(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!clientId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  /*
   * A day that has been and gone is never rewritten. The screen does not offer
   * it, but a pinned revision for a past date would resolve — `pickRevision`
   * takes a pinned day whatever its effective date — so the rule is kept here
   * rather than only in the UI that usually enforces it.
   */
  if (date < today()) return;

  /*
   * "both" is one save for the whole day — the editor shows the training and
   * the food together, and asking for two presses to commit one screen is how
   * half a day ends up saved.
   */
  const requestedKind = String(formData.get("kind") ?? "");
  const kinds: PlanKind[] =
    requestedKind === "both" ? ["workout", "food"] : [requestedKind === "food" ? "food" : "workout"];

  const scope: EditScope = formData.get("scope") === "weekday" ? "weekday" : "date";
  // Never backdate: an edit reaches forward from today at the earliest.
  const from = date < today() ? today() : date;
  const weekday = weekdayOf(date);

  const isRest = formData.get("isRest") === "on";
  const title = String(formData.get("title") ?? "").trim() || null;
  const suggestedTime = String(formData.get("suggestedTime") ?? "").trim() || null;
  const coachNotes = String(formData.get("coachNotes") ?? "").trim() || null;
  const calorieTarget = Number(formData.get("calorieTarget")) || null;
  const proteinTarget = Number(formData.get("proteinTarget")) || null;

  const exercises = isRest ? [] : readPlanExercises(formData);
  const meals = isRest ? [] : readPlanMeals(formData);

  for (const kind of kinds) {
    const body = {
      title,
      suggestedTime,
      coachNotes,
      calorieTarget,
      proteinTarget,
      isRest,
      // A rest day is a training idea. It empties the exercises and leaves
      // the food alone — nobody stops eating because they are not lifting.
      exercises: kind === "workout" ? exercises : [],
      meals: kind === "food" ? meals : [],
    };

    /*
     * "All future Mondays" has to include the Monday he is looking at, and
     * this date may already carry a pin of its own from a weight nudge or an
     * earlier one-off. `writeRevision` clears that pin rather than writing a
     * second copy over the top of it: the day stops being an exception, which
     * is what he asked for, and it costs no extra room in the store.
     */
    await writeRevision(clientId, weekday, kind, from, scope === "date" ? date : null, body);
  }

  refresh();
  // Came in from the weekly review, so go back to the card he was working
  // through rather than leaving him to find his place in a list of thirty.
  if (formData.get("review") === "1") redirect(`/admin/checkin#client-${clientId}`);
}

/**
 * Swap an ingredient out for one client.
 *
 * The alternative Dean had was to edit the meal in the library, which changes
 * it for everyone, or to replace the whole meal and lose the rest of it. This
 * changes one line of one recipe, for one person.
 *
 * Scope is the same idea as a plan edit and deliberately the same words: a
 * date-pinned swap changes that day alone, anything else applies from the date
 * onwards. Nothing is ever backdated, so a week they have already shopped and
 * cooked for stays as it was.
 */
export async function swapIngredient(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  const replaces = String(formData.get("replaces") ?? "").trim();
  if (!clientId || !replaces) return;

  // "Everywhere" is a real answer to "they do not like salmon", so an empty
  // meal id is meaningful rather than missing.
  const mealId = String(formData.get("mealId") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim() || null;

  const number = (key: string) => {
    const value = Number(formData.get(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  };
  const quantity = number("quantity");
  const unit = String(formData.get("unit") ?? "").trim() || null;

  const requested = String(formData.get("from") ?? today());
  const from = requested < today() ? today() : requested;
  const onlyOn = formData.get("scope") === "date" ? from : null;

  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      data.mealSwaps.push({
        id: crypto.randomUUID(),
        clientId,
        mealId,
        replaces,
        name,
        quantity,
        unit,
        effectiveFrom: from,
        onlyOn,
        createdAt: new Date().toISOString(),
      });
    });
  } else {
    await supabase.from("client_meal_swaps").insert({
      client_id: clientId,
      meal_id: mealId,
      replaces,
      name,
      quantity,
      unit,
      effective_from: from,
      only_on: onlyOn,
    });
  }

  refresh();
  if (formData.get("review") === "1") redirect(`/admin/checkin#client-${clientId}`);
}

/** Undo a swap. The meal goes back to whatever the library says. */
export async function removeSwap(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const id = String(formData.get("swapId") ?? "");
  if (!id) return;

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoData((data) => {
      data.mealSwaps = data.mealSwaps.filter((s) => s.id !== id);
    });
  } else {
    await supabase.from("client_meal_swaps").delete().eq("id", id);
  }

  refresh();
}

/**
 * Set (or clear) a client's photo.
 *
 * A URL rather than an upload: Supabase Storage is not wired up, and a field
 * that takes a link works today and becomes a storage path later without
 * anything above it changing. Blank clears it back to initials.
 */
export async function setAvatar(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return;

  const raw = String(formData.get("avatarUrl") ?? "").trim();
  // Only http(s): a data: or javascript: URL has no business in an img src.
  // The length cap is about the demo cookie rather than the URL — a handful of
  // signed links would be most of the budget, and truncating one would leave a
  // broken image, so an over-long paste is refused outright.
  const avatarUrl = raw.length <= 512 && /^https?:\/\//i.test(raw) ? raw : null;

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoData((data) => {
      if (avatarUrl) data.avatars[clientId] = avatarUrl;
      else delete data.avatars[clientId];
    });
  } else {
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", clientId);
  }

  refresh();
}

/**
 * Who plans this client's food. Dean's call, and only Dean's.
 *
 * Switching mode changes who may edit from here on and nothing else. The plan
 * already written stays exactly as it is — nobody's week is cleared or
 * regenerated, because a client who has shopped for Thursday should still be
 * cooking on Thursday whichever way the switch went.
 */
export async function setFoodMode(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  const mode: FoodMode = formData.get("foodMode") === "self" ? "self" : "coach";
  if (!clientId) return;

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoData((data) => {
      data.foodModes[clientId] = mode;
    });
  } else {
    await supabase.from("profiles").update({ food_mode: mode }).eq("id", clientId);
  }

  refresh();
}

/**
 * A self-planning client writing one of their own days.
 *
 * Deliberately not `savePlanDay` with the role check loosened. This can only
 * ever write food, only for the person signed in, only on a date that has not
 * happened, and only when Dean has put them in self-planned mode — none of
 * which are things a shared function should be trusted to remember. The
 * targets are read from the plan rather than the form, so a posted field
 * cannot move the goalposts Dean set.
 */
export async function saveMyFoodDay(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "client" || profile.foodMode !== "self") return;

  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today()) return;

  const existing = await getPlanDay(profile.id, date, "food");

  await writeRevision(profile.id, weekdayOf(date), "food", date, date, {
    title: existing.title,
    suggestedTime: existing.suggestedTime,
    coachNotes: existing.coachNotes,
    calorieTarget: existing.calorieTarget,
    proteinTarget: existing.proteinTarget,
    isRest: false,
    exercises: [],
    meals: readPlanMeals(formData),
  });

  refresh();
}

/**
 * Nudge every target on a day, or across the whole block.
 *
 * Written as a new revision like any other edit, so the week before the bump
 * still reads as what it was.
 */
/**
 * One day's plan turned back into something writable.
 *
 * `getPlanDay` joins the library on for display; writing wants the ids back.
 * Shared by copy, move and repeat-week so all three produce identical rows.
 */
function toWritable(day: PlanDay | null) {
  return {
    title: day?.title ?? null,
    suggestedTime: day?.suggestedTime ?? null,
    coachNotes: day?.coachNotes ?? null,
    calorieTarget: day?.calorieTarget ?? null,
    proteinTarget: day?.proteinTarget ?? null,
    isRest: day?.isRest ?? false,
    exercises: (day?.exercises ?? []).map((exercise) => ({
      position: exercise.position,
      exerciseId: exercise.exerciseId,
      notes: exercise.notes,
      sets: exercise.sets.map((set) => ({
        position: set.position,
        targetWeightKg: set.targetWeightKg,
        targetReps: set.targetReps,
      })),
    })),
    meals: (day?.meals ?? []).map((slot) => ({
      position: slot.position,
      slot: slot.slot,
      mealId: slot.meal.id,
      multiplier: slot.multiplier,
    })),
  };
}

/**
 * The same day, on another date — copied or moved.
 *
 * Dragging a card between days is the desktop gesture, and it is a poor one on
 * a phone, so this is the tap-friendly version behind "Copy to…" and "Move
 * to…". Both write one-offs pinned to the target date: the repeating shape of
 * the week is the Plan's business, and moving Thursday's session to Friday
 * this once should not quietly rewrite every Thursday from now on.
 */
export async function copyPlanDay(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  const move = formData.get("mode") === "move";
  if (!clientId || !from || !to || from === to) return;

  // Days already gone are never rewritten — the same rule every other edit
  // follows, and the reason a finished week stays finished.
  const now = today();
  if (to < now) return;

  for (const kind of ["workout", "food"] as PlanKind[]) {
    const source = await getPlanDay(clientId, from, kind);
    await writeRevision(clientId, weekdayOf(to), kind, to, to, toWritable(source));
  }

  if (move && from >= now) {
    // Moved, not duplicated: the day it came from becomes a rest day rather
    // than reverting to that weekday's standing plan, which would put the
    // session straight back where it was.
    await writeRevision(clientId, weekdayOf(from), "workout", from, from, {
      ...toWritable(null),
      isRest: true,
    });
  }

  refresh();
  if (formData.get("review") === "1") redirect(`/admin/checkin#client-${clientId}`);
}

/**
 * "Can I do Monday's session on Tuesday?"
 *
 * Raised by the client, decided by Dean. It is a request rather than a change
 * because the plan is coaching — but the alternative was a note in a comment
 * thread that Dean had to read, interpret and then act on by hand, so the week
 * the client was actually having drifted away from the week on the plan.
 */
export async function requestDaySwap(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 200) || null;
  if (!from || !to || from === to) return;

  // Only forwards, and only into days that have not happened. Asking to have
  // trained last Tuesday is not something an approval could deliver.
  const now = today();
  if (from < now || to < now) return;

  const day = await getPlanDay(profile.id, from, "workout");

  const request: SwapRequest = {
    id: crypto.randomUUID(),
    clientId: profile.id,
    fromDate: from,
    toDate: to,
    title: day.title,
    reason,
    status: "pending",
    createdAt: new Date().toISOString(),
    decidedAt: null,
  };

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoData((data) => {
      // One open request per day. Asking twice is a correction, not a queue.
      data.swapRequests = data.swapRequests.filter(
        (entry) =>
          !(entry.clientId === profile.id && entry.fromDate === from && entry.status === "pending"),
      );
      data.swapRequests.push(request);
    });
  } else {
    await supabase.from("day_swap_requests").insert({
      client_id: profile.id,
      from_date: from,
      to_date: to,
      title: request.title,
      reason,
    });
  }

  refresh();
}

/** Withdraw a request that has not been answered yet. */
export async function cancelDaySwap(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoData((data) => {
      data.swapRequests = data.swapRequests.filter(
        (entry) => !(entry.id === id && entry.clientId === profile.id && entry.status === "pending"),
      );
    });
  } else {
    await supabase
      .from("day_swap_requests")
      .delete()
      .eq("id", id)
      .eq("client_id", profile.id)
      .eq("status", "pending");
  }

  refresh();
}

/**
 * Dean's answer, in one tap.
 *
 * Approving does the move rather than telling him to go and do it: the whole
 * point is that the plan and the week the client is having stay the same
 * thing. It writes onto the two dates only — a session moved this week is not
 * a decision about every Monday from now on.
 */
export async function decideDaySwap(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const id = String(formData.get("id") ?? "");
  const approve = formData.get("decision") === "approve";
  if (!id) return;

  const supabase = await createClient();
  let request: SwapRequest | null = null;

  if (!supabase) {
    await writeDemoData((data) => {
      const found = data.swapRequests.find((entry) => entry.id === id);
      if (!found || found.status !== "pending") return;
      found.status = approve ? "approved" : "declined";
      found.decidedAt = new Date().toISOString();
      request = { ...found };
    });
  } else {
    const { data } = await supabase
      .from("day_swap_requests")
      .update({ status: approve ? "approved" : "declined", decided_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .single();
    if (data) {
      request = {
        id: data.id,
        clientId: data.client_id,
        fromDate: data.from_date,
        toDate: data.to_date,
        title: data.title ?? null,
        reason: data.reason ?? null,
        status: data.status,
        createdAt: data.created_at,
        decidedAt: data.decided_at ?? null,
      };
    }
  }

  if (approve && request) {
    const moved = request as SwapRequest;
    const now = today();

    if (moved.toDate >= now) {
      const source = await getPlanDay(moved.clientId, moved.fromDate, "workout");
      await writeRevision(
        moved.clientId,
        weekdayOf(moved.toDate),
        "workout",
        moved.toDate,
        moved.toDate,
        toWritable(source),
      );

      // The day it came from becomes a rest day. Left alone it would still
      // carry the session, and the client would have been given two.
      if (moved.fromDate >= now) {
        await writeRevision(
          moved.clientId,
          weekdayOf(moved.fromDate),
          "workout",
          moved.fromDate,
          moved.fromDate,
          { ...toWritable(null), isRest: true },
        );
      }
    }
  }

  refresh();
}

/**
 * Another client's day, offered as a starting point.
 *
 * This is what replaced the Templates page. A template was a second thing to
 * keep up to date and it was written as free text, so assigning one meant
 * re-typing it into structured fields; the work Dean actually wants to reuse
 * is a day he already built for somebody. These read on demand from the sheet
 * rather than being shipped with the page — thirty clients' plans is not a
 * payload, and he opens one of them.
 */
export interface CopySource {
  id: string;
  name: string;
  avatarUrl: string | null;
  /** How many days of their cycle have anything on them. */
  dayCount: number;
}

export async function listCopySources(exceptClientId: string): Promise<CopySource[]> {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return [];

  const clients = await getClients();
  const now = today();
  const out: CopySource[] = [];

  for (const client of clients) {
    if (client.id === exceptClientId) continue;
    const days = await getPlanDays(client.id, now, 7);
    out.push({
      id: client.id,
      name: client.fullName,
      avatarUrl: client.avatarUrl,
      dayCount: days.filter((day) => day.workout.exercises.length > 0).length,
    });
  }

  return out;
}

/** One of that client's days, flattened enough to preview in the sheet. */
export interface CopyDay {
  date: string;
  label: string;
  title: string | null;
  /** "Back squat — 4 × 5 @ 70kg", one per exercise. */
  exercises: string[];
  meals: string[];
  calorieTarget: number | null;
}

export async function listCopyDays(clientId: string): Promise<CopyDay[]> {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return [];

  const days = await getPlanDays(clientId, today(), 7);

  return days
    .map((day) => ({
      date: day.date,
      label: new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
      title: day.workout.title,
      exercises: day.workout.exercises.map((exercise) => {
        const sets = exercise.sets.length;
        const reps = exercise.sets[0]?.targetReps;
        const weight = exercise.sets[0]?.targetWeightKg;
        const shape = sets > 0 ? ` — ${sets} × ${reps ?? "?"}${weight ? ` @ ${weight}kg` : ""}` : "";
        return `${exercise.name}${shape}`;
      }),
      meals: day.food.meals.map((slot) => slot.meal.name),
      calorieTarget: day.food.calorieTarget,
    }))
    .filter((day) => day.exercises.length > 0 || day.meals.length > 0);
}

/**
 * Take that day and make it this client's, on this date.
 *
 * A copy, never a link: editing it afterwards must not reach back into the
 * person it came from. Written pinned to the target date, so it is a starting
 * point for one day rather than a silent change to every future Tuesday —
 * Dean adjusts it and then chooses how far his version reaches.
 */
export async function copyPlanDayFromClient(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  const sourceClientId = String(formData.get("sourceClientId") ?? "");
  const sourceDate = String(formData.get("sourceDate") ?? "");
  const date = String(formData.get("date") ?? "");
  const parts = String(formData.get("parts") ?? "workout");
  if (!clientId || !sourceClientId || !date || !sourceDate) return;
  if (date < today()) return;

  const kinds: PlanKind[] =
    parts === "food" ? ["food"] : parts === "both" ? ["workout", "food"] : ["workout"];

  for (const kind of kinds) {
    const source = await getPlanDay(sourceClientId, sourceDate, kind);
    await writeRevision(clientId, weekdayOf(date), kind, date, date, toWritable(source));
  }

  refresh();
  if (formData.get("review") === "1") redirect(`/admin/checkin#client-${clientId}`);
}

/**
 * Answer a note the client left.
 *
 * It lands on the thing they wrote it on — the workout, the meal log, the
 * weigh-in — so their side shows the reply under the note rather than in a
 * separate inbox they have to go and find.
 *
 * The note ids carry their own prefix (`w-`, `f-`, `fd-`, `we-`), which is
 * what says which thread this belongs to; a note about a day's food with no
 * row behind it hangs off the date instead.
 */
export async function replyToNote(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  const noteId = String(formData.get("noteId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 600);
  if (!clientId || !noteId || !body) return;

  const [prefix, ...rest] = noteId.split("-");
  const targetId = rest.join("-");
  const target: CommentTarget | null =
    prefix === "w" ? "workout"
    : prefix === "f" ? "food_log"
    : prefix === "fd" ? "food_log"
    : prefix === "we" ? "weight_entry"
    : null;
  if (!target || !targetId) return;

  await addComment(clientId, target, targetId, body);
  refresh();
}

/**
 * Fill a day from the last time that weekday was used.
 *
 * The commonest thing Dean does: this Monday is last Monday with a bit more
 * weight on it. Pinned to the date so it is a starting point — he adjusts it
 * and then chooses how far his version reaches.
 */
export async function copyLastLike(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  const date = String(formData.get("date") ?? "");
  const kind: PlanKind = formData.get("kind") === "food" ? "food" : "workout";
  if (!clientId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today()) return;

  const source = await findLastLike(clientId, date, kind);
  if (!source) return;

  const day = await getPlanDay(clientId, source, kind);
  await writeRevision(clientId, weekdayOf(date), kind, date, date, toWritable(day));

  refresh();
}

/**
 * Add the same weight to every set of a day.
 *
 * Progression, as one press. Pinned to the date like every other fill: the
 * heavier version is this day's, and Dean says how far it reaches when he
 * saves.
 */
export async function bumpPlanWeights(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  const date = String(formData.get("date") ?? "");
  const delta = Number(formData.get("delta") ?? 2.5) || 2.5;
  if (!clientId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today()) return;

  const day = await getPlanDay(clientId, date, "workout");
  if (day.exercises.length === 0) return;

  await writeRevision(clientId, weekdayOf(date), "workout", date, date, {
    title: day.title,
    suggestedTime: day.suggestedTime,
    coachNotes: day.coachNotes,
    calorieTarget: null,
    proteinTarget: null,
    isRest: false,
    exercises: day.exercises.map((exercise) => ({
      position: exercise.position,
      exerciseId: exercise.exerciseId,
      notes: exercise.notes,
      sets: exercise.sets.map((set) => ({
        position: set.position,
        // Bodyweight and unweighted work stay where they are.
        targetWeightKg:
          set.targetWeightKg === null || set.targetWeightKg === 0
            ? set.targetWeightKg
            : Number((set.targetWeightKg + delta).toFixed(2)),
        targetReps: set.targetReps,
      })),
    })),
    meals: [],
  });

  refresh();
}

/**
 * Tick a planned meal as eaten, or untick it.
 *
 * The row is a snapshot: name, portion, calories and macros as they were on the
 * day. Editing the meal in the library afterwards never rewrites what somebody
 * ate — only the method is read live, because a corrected instruction should
 * reach everyone.
 */
export async function toggleMeal(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const clientId = String(formData.get("clientId") ?? profile.id);
  const loggedFor = String(formData.get("date") ?? today());
  const mealId = String(formData.get("mealId") ?? "");
  const slot = String(formData.get("slot") ?? "lunch") as MealTag;
  const multiplier = Number(formData.get("multiplier") ?? 1) || 1;
  if (!mealId) return;

  const supabase = await createClient();
  const existing = (await getMealLogs(clientId, loggedFor)).find(
    (log) => log.mealId === mealId && log.slot === slot,
  );

  if (existing) {
    if (!supabase) {
      await writeDemoData((data) => {
        const index = data.mealLogs.findIndex((log) => log.id === existing.id);
        if (index >= 0) data.mealLogs.splice(index, 1);
      });
    } else {
      await supabase.from("meal_logs").delete().eq("id", existing.id);
    }
    refresh();
    return;
  }

  const meal = await getMeal(mealId);
  if (!meal) return;
  const scaled = scaleMeal(meal, multiplier);

  if (!supabase) {
    await writeDemoData((data) => {
      data.mealLogs.push({
        id: crypto.randomUUID(),
        clientId,
        loggedFor,
        slot,
        mealId,
        name: meal.name,
        multiplier,
        calories: scaled.calories,
        proteinG: scaled.proteinG,
        carbsG: scaled.carbsG,
        fatG: scaled.fatG,
      });
    });
  } else {
    await supabase.from("meal_logs").insert({
      client_id: clientId,
      logged_for: loggedFor,
      slot,
      meal_id: mealId,
      name: meal.name,
      multiplier,
      calories: scaled.calories,
      protein_g: scaled.proteinG,
      carbs_g: scaled.carbsG,
      fat_g: scaled.fatG,
    });
  }

  refresh();
}

/** How the eating went — the food day's counterpart to a workout's rating. */
export async function saveFoodDayFeedback(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  // Only Dean may write this for somebody else; a client writes their own.
  const requested = String(formData.get("clientId") ?? "");
  const clientId = profile.role === "admin" && requested ? requested : profile.id;
  const loggedFor = String(formData.get("date") ?? today());
  const value = Number(formData.get("feeling"));
  const feeling = value >= 1 && value <= 5 ? Math.round(value) : null;
  const note = String(formData.get("note") ?? "").trim() || null;

  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      const existing = data.foodDayFeedback.find(
        (entry) => entry.clientId === clientId && entry.loggedFor === loggedFor,
      );
      if (existing) Object.assign(existing, { feeling, note });
      else data.foodDayFeedback.push({ clientId, loggedFor, feeling, note });
    });
  } else {
    await supabase
      .from("food_day_feedback")
      .upsert(
        { client_id: clientId, logged_for: loggedFor, feeling, note },
        { onConflict: "client_id,logged_for" },
      );
  }

  refresh();
}

// ---------------------------------------------------------------------------
// Shopping lists
// ---------------------------------------------------------------------------

/**
 * Turn the chosen days into a list the client can carry round a shop.
 *
 * A snapshot, deliberately: once it exists, editing the plan does not rewrite
 * it. Items come out in the order the client left their last list in, so the
 * layout of their supermarket carries over instead of being re-sorted weekly.
 */
export async function createShoppingList(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const from = String(formData.get("from") ?? today());
  const days = Math.min(5, Math.max(1, Number(formData.get("days") ?? 3) || 3));
  const to = shiftDate(from, days - 1);

  const [lines, learned] = await Promise.all([
    getShoppingList(profile.id, from, days),
    getLearnedOrder(profile.id),
  ]);
  if (lines.length === 0) return;

  // Anything the previous list did not contain goes to the end, alphabetically,
  // rather than being scattered through an order it was never part of.
  const ordered = [...lines].sort((a, b) => {
    const left = learned.get(a.name.trim().toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    const right = learned.get(b.name.trim().toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    return left === right ? a.name.localeCompare(b.name) : left - right;
  });

  const supabase = await createClient();
  let listId: string;

  if (!supabase) {
    listId = crypto.randomUUID();
    const newList = {
      id: listId,
      clientId: profile.id,
      fromDate: from,
      toDate: to,
      createdAt: new Date().toISOString(),
      items: ordered.map((line, position) => ({
        id: crypto.randomUUID(),
        position,
        name: line.name,
        quantity: line.quantity,
        unit: line.unit,
        usedIn: line.usedIn.join(", "),
        checkedAt: null,
      })),
    };
    await writeDemoData((data) => data.shoppingLists.push(newList));
  } else {
    const { data } = await supabase
      .from("shopping_lists")
      .insert({ client_id: profile.id, from_date: from, to_date: to })
      .select("id")
      .single();
    if (!data) return;
    listId = data.id;

    await supabase.from("shopping_list_items").insert(
      ordered.map((line, position) => ({
        list_id: listId,
        position,
        name: line.name,
        quantity: line.quantity,
        unit: line.unit,
        used_in: line.usedIn.join(", "),
      })),
    );
  }

  refresh();
  redirect(`/app/food/shopping/${listId}`);
}

/** Tick an item into the trolley, or back out of it. */
export async function toggleShoppingItem(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;

  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      for (const list of data.shoppingLists) {
        const item = list.items.find((entry) => entry.id === itemId);
        if (item) item.checkedAt = item.checkedAt ? null : new Date().toISOString();
      }
    });
  } else {
    const { data } = await supabase
      .from("shopping_list_items")
      .select("checked_at")
      .eq("id", itemId)
      .single();
    await supabase
      .from("shopping_list_items")
      .update({ checked_at: data?.checked_at ? null : new Date().toISOString() })
      .eq("id", itemId);
  }

  refresh();
}

/**
 * Move an item one place up or down.
 *
 * Two buttons rather than drag and drop: it works with no JavaScript, and it
 * is the interaction that survives one thumb and a trolley.
 */
export async function moveShoppingItem(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const itemId = String(formData.get("itemId") ?? "");
  const listId = String(formData.get("listId") ?? "");
  const direction = formData.get("direction") === "up" ? -1 : 1;
  if (!itemId || !listId) return;

  const list = await getShoppingListById(listId);
  if (!list || list.clientId !== profile.id) return;

  const index = list.items.findIndex((item) => item.id === itemId);
  const swapWith = index + direction;
  if (index < 0 || swapWith < 0 || swapWith >= list.items.length) return;

  const moving = list.items[index];
  const displaced = list.items[swapWith];
  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      const stored = data.shoppingLists.find((entry) => entry.id === listId);
      const a = stored?.items.find((item) => item.id === moving.id);
      const b = stored?.items.find((item) => item.id === displaced.id);
      if (a && b) {
        const held = a.position;
        a.position = b.position;
        b.position = held;
      }
    });
  } else {
    await supabase.from("shopping_list_items").update({ position: displaced.position }).eq("id", moving.id);
    await supabase.from("shopping_list_items").update({ position: moving.position }).eq("id", displaced.id);
  }

  refresh();
}

export async function deleteShoppingList(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const listId = String(formData.get("listId") ?? "");
  if (!listId) return;

  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      const index = data.shoppingLists.findIndex(
        (list) => list.id === listId && list.clientId === profile.id,
      );
      if (index >= 0) data.shoppingLists.splice(index, 1);
    });
  } else {
    await supabase.from("shopping_lists").delete().eq("id", listId).eq("client_id", profile.id);
  }

  refresh();
  redirect("/app/food/shopping");
}

/**
 * Close the day out.
 *
 * Everything is already saved by the time this is pressed — the ticks, the
 * sets, the weight all wrote as they happened. This records the client saying
 * they are finished, which is the bit that feels like something and the bit
 * Dean can scan at the review.
 *
 * A day can be finished with things still outstanding. Life happens: the
 * ingredients were not in, breakfast got skipped on the school run, they did
 * not fancy the salmon. Refusing to let them finish would only teach them that
 * the honest answer is to tick things they did not eat. So the day closes
 * either way — but what was missed is recorded, and a reason is asked for, so
 * Dean can tell "the plan is wrong for them" from "it was a hard week".
 *
 * What was missed is worked out here rather than taken from the form: the
 * client's screen cannot be the authority on what they did.
 */
export async function submitDay(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const date = String(formData.get("date") ?? today());
  const note = String(formData.get("note") ?? "").trim() || null;
  const submittedAt = new Date().toISOString();

  const progress = await getDayProgress(profile.id, date);
  const missed = progress.missed;
  // A missed day without a reason is the one thing worth refusing — the reason
  // is the entire value of letting it be submitted at all.
  if (missed.length > 0 && !note) return;

  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      const existing = data.daySubmissions.find(
        (entry) => entry.clientId === profile.id && entry.onDate === date,
      );
      if (existing) Object.assign(existing, { submittedAt, missed, note });
      else data.daySubmissions.push({ clientId: profile.id, onDate: date, submittedAt, missed, note });
    });
  } else {
    await supabase
      .from("day_submissions")
      .upsert(
        { client_id: profile.id, on_date: date, missed, note },
        { onConflict: "client_id,on_date" },
      );
  }

  refresh();
}

/**
 * Set an item's state outright rather than flipping it.
 *
 * A toggle cannot be retried safely — a queued tick that fails, retries and
 * lands twice would untick itself. The offline queue replays these, so they
 * have to be idempotent.
 */
export async function setShoppingItemChecked(itemId: string, checked: boolean) {
  const profile = await getCurrentProfile();
  if (!profile) return;
  if (!itemId) return;

  const checkedAt = checked ? new Date().toISOString() : null;
  const supabase = await createClient();

  if (!supabase) {
    await writeDemoData((data) => {
      for (const list of data.shoppingLists) {
        if (list.clientId !== profile.id) continue;
        const item = list.items.find((entry) => entry.id === itemId);
        if (item) item.checkedAt = checkedAt;
      }
    });
  } else {
    await supabase.from("shopping_list_items").update({ checked_at: checkedAt }).eq("id", itemId);
  }

  refresh();
}

// ---------------------------------------------------------------------------
// Chat
//
// Sending returns the row it wrote. The thread on screen has already drawn the
// message optimistically, so what it needs back is the real id and timestamp
// to replace its own placeholder with — not a page revalidation that would
// throw away everything else it is holding.
// ---------------------------------------------------------------------------

/**
 * The client's thread, opening it if this is the first time.
 *
 * Called from the page rather than at signup: a client who has never written
 * to Dean costs nothing, and his inbox is the people who actually have.
 */
export async function ensureThread(clientId: string): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return DEMO_THREAD_ID;

  const { data: existing } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data } = await supabase
    .from("chat_threads")
    .insert({ client_id: clientId })
    .select("id")
    .maybeSingle();
  return data?.id ?? null;
}

export async function sendChatMessage(input: {
  threadId: string;
  body: string;
  attachmentPath?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
}): Promise<ChatMessage | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const body = input.body.trim().slice(0, 4000);
  const path = input.attachmentPath || null;
  if (!body && !path) return null;

  const fromCoach = profile.role === "admin";
  const now = new Date().toISOString();

  const supabase = await createClient();
  if (!supabase) {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      threadId: DEMO_THREAD_ID,
      senderId: profile.id,
      fromCoach,
      body: body || null,
      attachmentPath: null,
      attachmentType: null,
      attachmentName: null,
      createdAt: now,
    };
    await writeDemoSocial((data) => {
      data.chatMessages.push(message);
      // Somebody just wrote in it, so it is not dealt with any more.
      data.chatClosedAt = null;
    });
    return message;
  }

  const { data } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: input.threadId,
      sender_id: profile.id,
      from_coach: fromCoach,
      body: body || null,
      attachment_path: path,
      attachment_type: input.attachmentType || null,
      attachment_name: input.attachmentName || null,
    })
    .select("*")
    .maybeSingle();
  if (!data) return null;

  // A thread somebody has just written in is not dealt with, whoever closed it.
  await supabase
    .from("chat_threads")
    .update({ last_message_at: now, closed_at: null, closed_by: null })
    .eq("id", input.threadId);

  return {
    id: data.id,
    threadId: data.thread_id,
    senderId: data.sender_id,
    fromCoach: data.from_coach,
    body: data.body ?? null,
    attachmentPath: data.attachment_path ?? null,
    attachmentType: data.attachment_type ?? null,
    attachmentName: data.attachment_name ?? null,
    createdAt: data.created_at,
  };
}

/** Everything said since a given moment. The poll behind the socket. */
export async function fetchNewMessages(
  threadId: string,
  since: string | null,
): Promise<ChatMessage[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const all = await getThreadMessages(threadId);
  return since ? all.filter((message) => message.createdAt > since) : all;
}

export async function markChatRead(threadId: string) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const now = new Date().toISOString();
  const column = profile.role === "admin" ? "coach_read_at" : "client_read_at";

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoSocial((data) => {
      if (profile.role === "admin") data.chatCoachReadAt = now;
      else data.chatClientReadAt = now;
    });
  } else {
    await supabase.from("chat_threads").update({ [column]: now }).eq("id", threadId);
  }

  refresh();
}

/** Dean saying a thread is dealt with. Any new message undoes it. */
export async function setThreadClosed(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return;

  const threadId = String(formData.get("threadId") ?? "");
  const closed = String(formData.get("closed") ?? "") === "true";
  if (!threadId) return;

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoSocial((data) => {
      data.chatClosedAt = closed ? new Date().toISOString() : null;
    });
  } else {
    await supabase
      .from("chat_threads")
      .update({
        closed_at: closed ? new Date().toISOString() : null,
        closed_by: closed ? profile.id : null,
      })
      .eq("id", threadId);
  }

  refresh();
}

/**
 * A link to an attachment, good for an hour.
 *
 * Minted per request rather than stored, so nothing in the database is a URL
 * anybody could paste somewhere. The bucket is private and the policy on it
 * asks the same question the thread does.
 */
export async function attachmentUrl(path: string): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase.storage
    .from("chat-attachments")
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  return data?.signedUrl ?? null;
}

// ---------------------------------------------------------------------------
// Change requests
// ---------------------------------------------------------------------------

/** What a field currently reads as, so the request still makes sense later. */
function currentValueOf(profile: Profile, field: ChangeField): string | null {
  switch (field) {
    case "full_name":
      return profile.fullName || null;
    case "goal":
      return profile.goal;
    case "goal_weight":
      return null;
    case "coaching_mode":
      return profile.coachingMode;
    case "food_mode":
      return profile.foodMode;
  }
}

export async function askForChange(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const field = String(formData.get("field") ?? "") as ChangeField;
  if (!CHANGE_FIELDS.has(field)) return;

  const requested = String(formData.get("value") ?? "").trim().slice(0, 200);
  if (!requested) return;
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 400) || null;

  const request: ChangeRequest = {
    id: crypto.randomUUID(),
    clientId: profile.id,
    field,
    currentValue: currentValueOf(profile, field),
    requestedValue: requested,
    reason,
    status: "pending",
    createdAt: new Date().toISOString(),
    decidedAt: null,
  };

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoSocial((data) => {
      // One open ask per field. Asking twice is a correction, not a queue.
      data.changeRequests = data.changeRequests.filter(
        (entry) =>
          !(entry.clientId === profile.id && entry.field === field && entry.status === "pending"),
      );
      data.changeRequests.push(request);
    });
  } else {
    await supabase.from("change_requests").insert({
      client_id: profile.id,
      field,
      current_value: request.currentValue,
      requested_value: requested,
      reason,
    });
  }

  refresh();
}

export async function withdrawChange(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoSocial((data) => {
      data.changeRequests = data.changeRequests.filter(
        (entry) => !(entry.id === id && entry.clientId === profile.id && entry.status === "pending"),
      );
    });
  } else {
    await supabase
      .from("change_requests")
      .delete()
      .eq("id", id)
      .eq("client_id", profile.id)
      .eq("status", "pending");
  }

  refresh();
}

/**
 * Dean's answer.
 *
 * Approving makes the change rather than reminding him to go and make it —
 * the same reason a day swap performs the move. A request he said yes to and
 * then never applied is the failure this is built to avoid.
 */
export async function decideChange(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return;

  const id = String(formData.get("id") ?? "");
  const approve = String(formData.get("decision") ?? "") === "approve";
  if (!id) return;

  const supabase = await createClient();
  const now = new Date().toISOString();

  if (!supabase) {
    const social = await demoSocial();
    const request = social.changeRequests.find((entry) => entry.id === id);
    if (!request) return;
    await writeDemoSocial((data) => {
      const entry = data.changeRequests.find((r) => r.id === id);
      if (!entry) return;
      entry.status = approve ? "approved" : "declined";
      entry.decidedAt = now;
      data.notifications.push({
        id: crypto.randomUUID(),
        recipientId: request.clientId,
        sentByName: profile.fullName || "Dean",
        title: approve ? "I've made that change" : "I've had a look at that",
        body: approve
          ? `${CHANGE_MINE[request.field]} is now ${changeValueLabel(request.field, request.requestedValue)}.`
          : `I've left ${CHANGE_MINE[request.field].toLowerCase()} as it is for now — message me and we'll talk it through.`,
        actionHref: "/app/profile",
        createdAt: now,
      });
    });
    refresh();
    return;
  }

  const { data: request } = await supabase
    .from("change_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!request || request.status !== "pending") return;

  if (approve) {
    const patch = patchFor(request.field, request.requested_value);
    if (patch) await supabase.from("profiles").update(patch).eq("id", request.client_id);
  }

  await supabase
    .from("change_requests")
    .update({
      status: approve ? "approved" : "declined",
      decided_at: now,
      decided_by: profile.id,
    })
    .eq("id", id);

  await supabase.from("notifications").insert({
    recipient_id: request.client_id,
    sent_by: profile.id,
    sent_by_name: profile.fullName || "Dean",
    title: approve ? "I've made that change" : "I've had a look at that",
    body: approve
      ? `${CHANGE_MINE[request.field as ChangeField]} is now ${changeValueLabel(request.field as ChangeField, request.requested_value)}.`
      : `I've left ${CHANGE_MINE[request.field as ChangeField].toLowerCase()} as it is for now — message me and we'll talk it through.`,
    action_href: "/app/profile",
  });

  refresh();
}

/**
 * What an approved request writes onto the profile.
 *
 * Validated here rather than trusted: the request holds text whatever the
 * field is, because it is a record of what somebody asked for, not a staging
 * copy of a profile. A value that is not one of the allowed ones changes
 * nothing — the request is still answered, it just does not move anything.
 */
function patchFor(field: string, value: string): Record<string, unknown> | null {
  switch (field) {
    case "full_name":
      return { full_name: value.slice(0, 80) };
    case "goal":
      return { goal: value.slice(0, 200) };
    case "coaching_mode":
      return value === "online" || value === "one_to_one" ? { coaching_mode: value } : null;
    case "food_mode":
      return value === "coach" || value === "self" ? { food_mode: value } : null;
    // Goal weight is not a column on the profile — it is what somebody applied
    // with, and Dean acts on it in the plan rather than by editing a number.
    case "goal_weight":
      return null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/**
 * Dean telling people something.
 *
 * "Everyone" is one row with no recipient rather than one row per person: an
 * announcement is one thing that happened, and the select policy is what turns
 * it into everybody's. Anything narrower fans out, because the alternative is
 * an audience expression stored on the row that every read would have to
 * evaluate.
 */
export async function sendNotification(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return;

  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  if (!title) return;
  const body = String(formData.get("body") ?? "").trim().slice(0, 1000) || null;
  const href = String(formData.get("href") ?? "").trim().slice(0, 200) || null;
  const audience = String(formData.get("audience") ?? "everyone");
  // Only in-app paths. An absolute URL here would make a notification a way to
  // send everybody somewhere off the site.
  const actionHref = href && href.startsWith("/") ? href : null;

  const recipients = await recipientsFor(audience);
  const now = new Date().toISOString();

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoSocial((data) => {
      for (const recipientId of recipients) {
        data.notifications.push({
          id: crypto.randomUUID(),
          recipientId,
          sentByName: profile.fullName || "Dean",
          title,
          body,
          actionHref,
          createdAt: now,
        });
      }
    });
    refresh();
    redirect("/admin/notifications?sent=1");
  }

  await supabase.from("notifications").insert(
    recipients.map((recipientId) => ({
      recipient_id: recipientId,
      sent_by: profile.id,
      sent_by_name: profile.fullName || "Dean",
      title,
      body,
      action_href: actionHref,
    })),
  );

  refresh();
  // Back to an empty form with a word to say it went. Without the redirect the
  // fields keep what was typed and it reads as a send that did nothing.
  redirect("/admin/notifications?sent=1");
}

/** Null in the list means "no recipient", which is everybody. */
async function recipientsFor(audience: string): Promise<Array<string | null>> {
  if (audience === "everyone") return [null];
  if (audience.startsWith("client:")) return [audience.slice("client:".length)];

  const clients = await getClients();
  if (audience === "online") {
    return clients.filter((c) => c.coachingMode === "online").map((c) => c.id);
  }
  if (audience === "one_to_one") {
    return clients.filter((c) => c.coachingMode === "one_to_one").map((c) => c.id);
  }
  return [null];
}

/**
 * The bell has been opened.
 *
 * One timestamp on the reader's own account. A row per person per notification
 * to answer "anything since I last looked" would be the largest table here
 * inside a year, and it would still only answer that one question.
 */
export async function markNotificationsRead() {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const now = new Date().toISOString();
  const supabase = await createClient();
  if (!supabase) {
    await writeDemoSocial((data) => {
      data.notificationsReadAt = now;
    });
  } else {
    await supabase.auth.updateUser({ data: { notifications_read_at: now } });
  }

  refresh();
}

// ---------------------------------------------------------------------------
// The board
// ---------------------------------------------------------------------------

/**
 * Who a post was meant for, read out of what was typed.
 *
 * Dean writes "@everyone" or "@online" the way he would say it, and those are
 * the words that fan the notifications out. It never restricts who can see the
 * post — everybody on the board sees everything, or it stops being a board.
 */
function audiencesIn(body: string): BoardAudience[] {
  const found = (Object.keys(AUDIENCE_TAGS) as BoardAudience[]).filter((key) =>
    body.toLowerCase().includes(AUDIENCE_TAGS[key].toLowerCase()),
  );
  return found;
}

export async function createPost(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || !hasBoardAccess(profile)) return;

  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const media = formData
    .getAll("media")
    .map((value) => String(value))
    .filter(Boolean)
    .slice(0, 4);
  if (!body && media.length === 0) return;

  const fromCoach = profile.role === "admin";
  // Only Dean's posts carry an audience — a client typing "@everyone" is
  // making a joke, not sending a notification to the whole gym.
  const tagged = fromCoach ? audiencesIn(body) : [];
  const now = new Date().toISOString();

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoSocial((data) => {
      data.posts.push({
        id: crypto.randomUUID(),
        authorId: profile.id,
        authorName: profile.fullName || "Someone",
        authorAvatarUrl: profile.avatarUrl,
        fromCoach,
        body,
        media: [],
        tagged,
        likes: 0,
        likedByMe: false,
        comments: [],
        createdAt: now,
      });
    });
    refresh();
    return;
  }

  const { data: post } = await supabase
    .from("posts")
    .insert({
      author_id: profile.id,
      author_name: profile.fullName || "Someone",
      author_avatar_url: profile.avatarUrl,
      from_coach: fromCoach,
      body,
      media_paths: media,
      tagged,
    })
    .select("id")
    .maybeSingle();

  if (post && tagged.length > 0) {
    const recipients = new Set<string | null>();
    for (const audience of tagged) {
      for (const id of await recipientsFor(audience)) recipients.add(id);
    }
    await supabase.from("notifications").insert(
      [...recipients].map((recipientId) => ({
        recipient_id: recipientId,
        sent_by: profile.id,
        sent_by_name: profile.fullName || "Dean",
        title: "New on the board",
        body: body.slice(0, 160),
        action_href: "/app/board",
      })),
    );
  }

  refresh();
}

export async function deletePost(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoSocial((data) => {
      data.posts = data.posts.filter((post) => post.id !== id);
      data.postComments = data.postComments.filter((comment) => comment.postId !== id);
    });
  } else {
    await supabase.from("posts").delete().eq("id", id);
  }

  refresh();
}

/**
 * A like, without a page revalidation.
 *
 * The heart is already filled in on screen before this runs. Sending the page
 * back would land a second later and redraw a wall of posts to change one
 * number that is already right.
 */
export async function setLiked(postId: string, liked: boolean): Promise<boolean> {
  const profile = await getCurrentProfile();
  if (!profile || !hasBoardAccess(profile)) return !liked;

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoSocial((data) => {
      data.likes = liked
        ? [...new Set([...data.likes, postId])]
        : data.likes.filter((id) => id !== postId);
    });
    return liked;
  }

  if (liked) {
    await supabase.from("post_likes").upsert({ post_id: postId, user_id: profile.id });
  } else {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", profile.id);
  }
  return liked;
}

/** Returns the row it wrote, so the thread appends it rather than refetching. */
export async function addBoardComment(
  postId: string,
  body: string,
): Promise<BoardComment | null> {
  const profile = await getCurrentProfile();
  if (!profile || !hasBoardAccess(profile)) return null;

  const text = body.trim().slice(0, 1000);
  if (!text) return null;

  const comment: BoardComment = {
    id: crypto.randomUUID(),
    postId,
    authorId: profile.id,
    authorName: profile.fullName || "Someone",
    authorAvatarUrl: profile.avatarUrl,
    fromCoach: profile.role === "admin",
    body: text,
    createdAt: new Date().toISOString(),
  };

  const supabase = await createClient();
  if (!supabase) {
    await writeDemoSocial((data) => {
      data.postComments.push(comment);
    });
    return comment;
  }

  const { data } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      author_id: profile.id,
      author_name: comment.authorName,
      author_avatar_url: profile.avatarUrl,
      from_coach: comment.fromCoach,
      body: text,
    })
    .select("*")
    .maybeSingle();
  if (!data) return null;

  return {
    id: data.id,
    postId: data.post_id,
    authorId: data.author_id,
    authorName: data.author_name || comment.authorName,
    authorAvatarUrl: data.author_avatar_url ?? null,
    fromCoach: data.from_coach ?? false,
    body: data.body,
    createdAt: data.created_at,
  };
}
