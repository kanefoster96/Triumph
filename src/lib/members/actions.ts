"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  demoComments,
  demoFoodLogs,
  demoFoodPlans,
  demoProfiles,
  demoSessions,
  demoWeightEntries,
  demoWorkouts,
} from "./demo";
import { DEMO_ROLE_COOKIE, getCurrentProfile, today } from "./service";
import type { CommentTarget } from "./types";

/**
 * Writes for the members' area and Dean's admin.
 *
 * Each one hits Supabase when connected and the in-memory demo dataset when
 * not. Demo edits live for the lifetime of the server process — enough to try
 * the interactions, not a substitute for the database.
 */

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
    for (const workout of demoWorkouts) {
      const item = workout.items.find((i) => i.id === itemId);
      if (item) {
        item.done = done;
        item.doneAt = done ? new Date().toISOString() : null;
      }
    }
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
    const workout = demoWorkouts.find((w) => w.id === workoutId);
    if (workout) workout.clientNote = value;
  } else {
    await supabase.from("workouts").update({ client_note: value }).eq("id", workoutId);
  }

  refresh();
}

export async function setWorkoutComplete(workoutId: string, complete: boolean) {
  const supabase = await createClient();
  const completedAt = complete ? new Date().toISOString() : null;

  if (!supabase) {
    const workout = demoWorkouts.find((w) => w.id === workoutId);
    if (workout) workout.completedAt = completedAt;
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
  const supabase = await createClient();

  if (!supabase) {
    demoFoodLogs.push({
      id: crypto.randomUUID(),
      clientId,
      loggedFor,
      calories,
      note,
      createdAt: new Date().toISOString(),
    });
  } else {
    await supabase
      .from("food_logs")
      .insert({ client_id: clientId, logged_for: loggedFor, calories, note });
  }

  refresh();
}

export async function deleteFoodLog(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    const index = demoFoodLogs.findIndex((l) => l.id === id);
    if (index >= 0) demoFoodLogs.splice(index, 1);
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
    const existing = demoWeightEntries.find(
      (w) => w.clientId === clientId && w.loggedFor === loggedFor,
    );
    if (existing) {
      existing.weightKg = weightKg;
      existing.note = note;
    } else {
      demoWeightEntries.push({ id: crypto.randomUUID(), clientId, loggedFor, weightKg, note });
    }
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
    for (const comment of demoComments) {
      if (comment.clientId === profile.id && comment.readAt === null) comment.readAt = now;
    }
  } else {
    await supabase
      .from("comments")
      .update({ read_at: now })
      .eq("client_id", profile.id)
      .is("read_at", null);
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
    demoComments.push({
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

/** Create or replace a client's workout for a given date. */
export async function saveWorkout(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const scheduledFor = String(formData.get("date") ?? today());
  const title = String(formData.get("title") ?? "Workout").trim() || "Workout";
  const coachNotes = String(formData.get("coachNotes") ?? "").trim() || null;
  const labels = String(formData.get("items") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!clientId || labels.length === 0) return;

  // "Back squat — 4 x 5 @ 70kg" splits into a label and a target.
  const parsed = labels.map((line, position) => {
    const [label, target] = line.split(/\s+[—–-]\s+/, 2);
    return { position, label: label.trim(), target: target?.trim() ?? null };
  });

  const supabase = await createClient();

  if (!supabase) {
    const existing = demoWorkouts.find(
      (w) => w.clientId === clientId && w.scheduledFor === scheduledFor,
    );
    const workoutId = existing?.id ?? crypto.randomUUID();
    const items = parsed.map((item) => ({
      id: crypto.randomUUID(),
      workoutId,
      position: item.position,
      label: item.label,
      target: item.target,
      // Keep tick state for items whose label has not changed.
      done: existing?.items.find((i) => i.label === item.label)?.done ?? false,
      doneAt: existing?.items.find((i) => i.label === item.label)?.doneAt ?? null,
    }));

    if (existing) {
      existing.title = title;
      existing.coachNotes = coachNotes;
      existing.items = items;
    } else {
      demoWorkouts.push({
        id: workoutId,
        clientId,
        scheduledFor,
        title,
        coachNotes,
        clientNote: null,
        completedAt: null,
        items,
      });
    }
  } else {
    const { data: workout } = await supabase
      .from("workouts")
      .upsert(
        { client_id: clientId, scheduled_for: scheduledFor, title, coach_notes: coachNotes },
        { onConflict: "client_id,scheduled_for" },
      )
      .select("id")
      .single();

    if (workout) {
      await supabase.from("workout_items").delete().eq("workout_id", workout.id);
      await supabase.from("workout_items").insert(
        parsed.map((item) => ({
          workout_id: workout.id,
          position: item.position,
          label: item.label,
          target: item.target,
        })),
      );
    }
  }

  refresh();
}

/** Set a client's calorie target and/or assigned meals. */
export async function saveFoodPlan(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return;

  const calorieTargetRaw = String(formData.get("calorieTarget") ?? "").trim();
  const proteinTargetRaw = String(formData.get("proteinTarget") ?? "").trim();
  const calorieTarget = calorieTargetRaw ? Number(calorieTargetRaw) : null;
  const proteinTarget = proteinTargetRaw ? Number(proteinTargetRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  // One meal per line: "Breakfast | 200g yoghurt, berries | 420"
  const meals = String(formData.get("meals") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, position) => {
      const [name, ingredients, calories] = line.split("|").map((part) => part.trim());
      return {
        position,
        name: name || "Meal",
        ingredients: ingredients || null,
        calories: calories ? Number(calories) : null,
      };
    });

  const supabase = await createClient();

  if (!supabase) {
    const existing = demoFoodPlans.find((p) => p.clientId === clientId);
    const planId = existing?.id ?? crypto.randomUUID();
    const mapped = meals.map((meal) => ({ id: crypto.randomUUID(), ...meal }));

    if (existing) {
      existing.calorieTarget = calorieTarget;
      existing.proteinTarget = proteinTarget;
      existing.notes = notes;
      existing.meals = mapped;
    } else {
      demoFoodPlans.push({
        id: planId,
        clientId,
        effectiveFrom: today(),
        calorieTarget,
        proteinTarget,
        notes,
        meals: mapped,
      });
    }
  } else {
    const { data: existing } = await supabase
      .from("food_plans")
      .select("id")
      .eq("client_id", clientId)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    const payload = {
      client_id: clientId,
      calorie_target: calorieTarget,
      protein_target: proteinTarget,
      notes,
    };

    const { data: plan } = existing
      ? await supabase.from("food_plans").update(payload).eq("id", existing.id).select("id").single()
      : await supabase.from("food_plans").insert(payload).select("id").single();

    if (plan) {
      await supabase.from("food_plan_meals").delete().eq("food_plan_id", plan.id);
      if (meals.length > 0) {
        await supabase
          .from("food_plan_meals")
          .insert(meals.map((meal) => ({ food_plan_id: plan.id, ...meal })));
      }
    }
  }

  refresh();
}

/** Schedule a session, or edit one that already exists. */
export async function saveSession(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "");
  const startsAtLocal = String(formData.get("startsAt") ?? "");
  if (!clientId || !startsAtLocal) return;

  const startsAt = new Date(startsAtLocal).toISOString();
  const durationMinutes = Number(formData.get("duration") ?? 60) || 60;
  const location = String(formData.get("location") ?? "Online").trim() || "Online";
  const coachNotes = String(formData.get("coachNotes") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "scheduled") as
    | "scheduled"
    | "completed"
    | "cancelled";

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

export async function getDemoClients() {
  return demoProfiles.filter((p) => p.role === "client");
}
