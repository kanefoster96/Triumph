"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/data/site";
import {
  demoCheckIns,
  demoComments,
  demoExercises,
  demoFoodDayFeedback,
  demoMealLogs,
  demoMeals,
  demoPlanBlocks,
  demoPlanRevisions,
  demoShoppingLists,
  demoDayPlans,
  demoFoodLogs,
  demoFoodPlans,
  demoProfiles,
  demoSessionPlans,
  demoSessions,
  demoWeightEntries,
  demoWorkouts,
} from "./demo";
import {
  DEMO_ROLE_COOKIE,
  getCurrentProfile,
  getMeal,
  getMealLogs,
  getPlanBlock,
  getLearnedOrder,
  getPlanCycle,
  getShoppingList,
  getShoppingListById,
  getWorkoutFor,
  scaleMeal,
  shiftDate,
  today,
} from "./service";
import type { CommentTarget, EditScope, MealTag } from "./types";

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

/**
 * "Back squat — 4 × 5 @ 70kg" becomes a label and a target. One exercise per
 * line, so a whole session can be typed or pasted in one go.
 */
function parseChecklist(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, position) => {
      const [label, target] = line.split(/\s+[—–-]\s+/, 2);
      return { position, label: label.trim(), target: target?.trim() ?? null };
    });
}

/** "Breakfast | 200g yoghurt, berries | 420" becomes one meal. */
function parseMeals(input: string) {
  return input
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
    await supabase.from("food_logs").insert({ client_id: clientId, logged_for: loggedFor, calories, note });
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
    const existing = demoWeightEntries.find((w) => w.clientId === clientId && w.loggedFor === loggedFor);
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
  const suggestedTime = String(formData.get("suggestedTime") ?? "").trim() || null;
  const coachNotes = String(formData.get("coachNotes") ?? "").trim() || null;
  const parsed = parseChecklist(String(formData.get("items") ?? ""));
  if (!clientId || parsed.length === 0) return;

  const supabase = await createClient();

  if (!supabase) {
    const existing = demoWorkouts.find((w) => w.clientId === clientId && w.scheduledFor === scheduledFor);
    const workoutId = existing?.id ?? crypto.randomUUID();
    const items = parsed.map((item) => ({
      id: crypto.randomUUID(),
      workoutId,
      position: item.position,
      label: item.label,
      target: item.target,
      exerciseId: null,
      muscleGroup: null,
      equipment: null,
      howTo: null,
      skippedReason: null,
      sets: [],
      // Keep tick state for items whose label has not changed.
      done: existing?.items.find((i) => i.label === item.label)?.done ?? false,
      doneAt: existing?.items.find((i) => i.label === item.label)?.doneAt ?? null,
    }));

    if (existing) {
      existing.title = title;
      existing.suggestedTime = suggestedTime;
      existing.coachNotes = coachNotes;
      existing.items = items;
    } else {
      demoWorkouts.push({
        id: workoutId,
        clientId,
        scheduledFor,
        title,
        suggestedTime,
        coachNotes,
        clientNote: null,
        feeling: null,
        completedAt: null,
        fromPlan: false,
        items,
      });
    }
  } else {
    const { data: workout } = await supabase
      .from("workouts")
      .upsert(
        {
          client_id: clientId,
          scheduled_for: scheduledFor,
          title,
          suggested_time: suggestedTime,
          coach_notes: coachNotes,
        },
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

  // Which day this applies from. Later days inherit it until another is set.
  const forDate = String(formData.get("date") ?? today());

  const calorieTargetRaw = String(formData.get("calorieTarget") ?? "").trim();
  const proteinTargetRaw = String(formData.get("proteinTarget") ?? "").trim();
  const calorieTarget = calorieTargetRaw ? Number(calorieTargetRaw) : null;
  const proteinTarget = proteinTargetRaw ? Number(proteinTargetRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const meals = parseMeals(String(formData.get("meals") ?? ""));

  const supabase = await createClient();

  if (!supabase) {
    const existing = demoFoodPlans.find((p) => p.clientId === clientId && p.assignedFor === forDate);
    const mapped = meals.map((meal) => ({ id: crypto.randomUUID(), ...meal }));

    if (existing) {
      existing.calorieTarget = calorieTarget;
      existing.proteinTarget = proteinTarget;
      existing.notes = notes;
      existing.meals = mapped;
    } else {
      demoFoodPlans.push({
        id: crypto.randomUUID(),
        clientId,
        assignedFor: forDate,
        calorieTarget,
        proteinTarget,
        notes,
        meals: mapped,
      });
    }
  } else {
    const { data: plan } = await supabase
      .from("food_plans")
      .upsert(
        {
          client_id: clientId,
          assigned_for: forDate,
          calorie_target: calorieTarget,
          protein_target: proteinTarget,
          notes,
        },
        { onConflict: "client_id,assigned_for" },
      )
      .select("id")
      .single();

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

/** Create or update a reusable session (workout) plan. */
export async function saveSessionPlan(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const items = parseChecklist(String(formData.get("items") ?? ""));
  if (!name || items.length === 0) return;

  const supabase = await createClient();

  if (!supabase) {
    const existing = demoSessionPlans.find((p) => p.id === id);
    const mapped = items.map((item) => ({ id: crypto.randomUUID(), ...item }));
    if (existing) {
      existing.name = name;
      existing.notes = notes;
      existing.items = mapped;
    } else {
      demoSessionPlans.push({ id: crypto.randomUUID(), name, notes, items: mapped });
    }
  } else {
    const { data: plan } = id
      ? await supabase.from("session_plans").update({ name, notes }).eq("id", id).select("id").single()
      : await supabase.from("session_plans").insert({ name, notes }).select("id").single();

    if (plan) {
      await supabase.from("session_plan_items").delete().eq("session_plan_id", plan.id);
      await supabase
        .from("session_plan_items")
        .insert(items.map((item) => ({ session_plan_id: plan.id, ...item })));
    }
  }

  revalidatePath("/admin", "layout");
}

/** Create or update a reusable day (food) plan. */
export async function saveDayPlan(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const calorieTargetRaw = String(formData.get("calorieTarget") ?? "").trim();
  const proteinTargetRaw = String(formData.get("proteinTarget") ?? "").trim();
  const calorieTarget = calorieTargetRaw ? Number(calorieTargetRaw) : null;
  const proteinTarget = proteinTargetRaw ? Number(proteinTargetRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const meals = parseMeals(String(formData.get("meals") ?? ""));

  const supabase = await createClient();

  if (!supabase) {
    const existing = demoDayPlans.find((p) => p.id === id);
    const mapped = meals.map((meal) => ({ id: crypto.randomUUID(), ...meal }));
    if (existing) {
      Object.assign(existing, { name, calorieTarget, proteinTarget, notes, meals: mapped });
    } else {
      demoDayPlans.push({
        id: crypto.randomUUID(),
        name,
        calorieTarget,
        proteinTarget,
        notes,
        meals: mapped,
      });
    }
  } else {
    const payload = {
      name,
      calorie_target: calorieTarget,
      protein_target: proteinTarget,
      notes,
    };
    const { data: plan } = id
      ? await supabase.from("day_plans").update(payload).eq("id", id).select("id").single()
      : await supabase.from("day_plans").insert(payload).select("id").single();

    if (plan) {
      await supabase.from("day_plan_meals").delete().eq("day_plan_id", plan.id);
      if (meals.length > 0) {
        await supabase
          .from("day_plan_meals")
          .insert(meals.map((meal) => ({ day_plan_id: plan.id, ...meal })));
      }
    }
  }

  revalidatePath("/admin", "layout");
}

export async function deleteSessionPlan(id: string) {
  const supabase = await createClient();
  if (!supabase) {
    const index = demoSessionPlans.findIndex((p) => p.id === id);
    if (index >= 0) demoSessionPlans.splice(index, 1);
  } else {
    await supabase.from("session_plans").delete().eq("id", id);
  }
  revalidatePath("/admin", "layout");
}

export async function deleteDayPlan(id: string) {
  const supabase = await createClient();
  if (!supabase) {
    const index = demoDayPlans.findIndex((p) => p.id === id);
    if (index >= 0) demoDayPlans.splice(index, 1);
  } else {
    await supabase.from("day_plans").delete().eq("id", id);
  }
  revalidatePath("/admin", "layout");
}

/**
 * The dates a plan lands on: every day between `from` and `to` whose weekday
 * was ticked. Capped at 30 days, which is the longest range worth planning in
 * one go.
 */
function datesInRange(from: string, to: string, weekdays: number[]): string[] {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end && dates.length < 30) {
    if (weekdays.length === 0 || weekdays.includes(cursor.getUTCDay())) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function readAssignment(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const planId = String(formData.get("planId") ?? "");
  const suggestedTime = String(formData.get("suggestedTime") ?? "").trim() || null;
  const from = String(formData.get("from") ?? today());
  const to = String(formData.get("to") ?? from);
  const weekdays = formData.getAll("weekdays").map((v) => Number(v));
  const overwrite = formData.get("overwrite") === "on";
  return { clientId, planId, suggestedTime, dates: datesInRange(from, to, weekdays), overwrite };
}

/** Paint a session plan across every selected day. */
export async function assignSessionPlan(formData: FormData) {
  const { clientId, planId, suggestedTime, dates, overwrite } = readAssignment(formData);
  if (!clientId || !planId || dates.length === 0) return;

  const supabase = await createClient();

  if (!supabase) {
    const plan = demoSessionPlans.find((p) => p.id === planId);
    if (!plan) return;

    for (const date of dates) {
      const existing = demoWorkouts.find((w) => w.clientId === clientId && w.scheduledFor === date);
      // Never silently wipe a day the client has already worked through.
      if (existing && !overwrite) continue;

      const workoutId = existing?.id ?? crypto.randomUUID();
      const items = plan.items.map((item) => ({
        id: crypto.randomUUID(),
        workoutId,
        position: item.position,
        label: item.label,
        target: item.target,
        exerciseId: null,
        muscleGroup: null,
        equipment: null,
        howTo: null,
        skippedReason: null,
        sets: [],
        done: false,
        doneAt: null,
      }));

      if (existing) {
        existing.title = plan.name;
        existing.suggestedTime = suggestedTime;
        existing.coachNotes = plan.notes;
        existing.items = items;
        existing.completedAt = null;
      } else {
        demoWorkouts.push({
          id: workoutId,
          clientId,
          scheduledFor: date,
          title: plan.name,
          suggestedTime,
          coachNotes: plan.notes,
          clientNote: null,
          feeling: null,
          completedAt: null,
          fromPlan: false,
          items,
        });
      }
    }
  } else {
    const { data: plan } = await supabase
      .from("session_plans")
      .select("*, session_plan_items(*)")
      .eq("id", planId)
      .single();
    if (!plan) return;

    const { data: existing } = await supabase
      .from("workouts")
      .select("scheduled_for")
      .eq("client_id", clientId)
      .in("scheduled_for", dates);
    const taken = new Set((existing ?? []).map((row) => row.scheduled_for));
    const targets = overwrite ? dates : dates.filter((d) => !taken.has(d));

    for (const date of targets) {
      const { data: workout } = await supabase
        .from("workouts")
        .upsert(
          {
            client_id: clientId,
            scheduled_for: date,
            title: plan.name,
            suggested_time: suggestedTime,
            coach_notes: plan.notes,
            source_plan_id: plan.id,
            completed_at: null,
          },
          { onConflict: "client_id,scheduled_for" },
        )
        .select("id")
        .single();

      if (workout) {
        await supabase.from("workout_items").delete().eq("workout_id", workout.id);
        await supabase.from("workout_items").insert(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped row
          (plan.session_plan_items ?? []).map((item: any) => ({
            workout_id: workout.id,
            position: item.position,
            label: item.label,
            target: item.target,
          })),
        );
      }
    }
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/app", "layout");
}

/** Paint a day plan across every selected day. */
export async function assignDayPlan(formData: FormData) {
  const { clientId, planId, dates, overwrite } = readAssignment(formData);
  if (!clientId || !planId || dates.length === 0) return;

  const supabase = await createClient();

  if (!supabase) {
    const plan = demoDayPlans.find((p) => p.id === planId);
    if (!plan) return;

    for (const date of dates) {
      const existing = demoFoodPlans.find((p) => p.clientId === clientId && p.assignedFor === date);
      if (existing && !overwrite) continue;

      const meals = plan.meals.map((meal) => ({ ...meal, id: crypto.randomUUID() }));

      if (existing) {
        Object.assign(existing, {
          calorieTarget: plan.calorieTarget,
          proteinTarget: plan.proteinTarget,
          notes: plan.notes,
          meals,
        });
      } else {
        demoFoodPlans.push({
          id: crypto.randomUUID(),
          clientId,
          assignedFor: date,
          calorieTarget: plan.calorieTarget,
          proteinTarget: plan.proteinTarget,
          notes: plan.notes,
          meals,
        });
      }
    }
  } else {
    const { data: plan } = await supabase
      .from("day_plans")
      .select("*, day_plan_meals(*)")
      .eq("id", planId)
      .single();
    if (!plan) return;

    const { data: existing } = await supabase
      .from("food_plans")
      .select("assigned_for")
      .eq("client_id", clientId)
      .in("assigned_for", dates);
    const taken = new Set((existing ?? []).map((row) => row.assigned_for));
    const targets = overwrite ? dates : dates.filter((d) => !taken.has(d));

    for (const date of targets) {
      const { data: assigned } = await supabase
        .from("food_plans")
        .upsert(
          {
            client_id: clientId,
            assigned_for: date,
            calorie_target: plan.calorie_target,
            protein_target: plan.protein_target,
            notes: plan.notes,
            source_plan_id: plan.id,
          },
          { onConflict: "client_id,assigned_for" },
        )
        .select("id")
        .single();

      if (assigned) {
        await supabase.from("food_plan_meals").delete().eq("food_plan_id", assigned.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped row
        const meals = (plan.day_plan_meals ?? []) as any[];
        if (meals.length > 0) {
          await supabase.from("food_plan_meals").insert(
            meals.map((meal) => ({
              food_plan_id: assigned.id,
              position: meal.position,
              name: meal.name,
              ingredients: meal.ingredients,
              calories: meal.calories,
            })),
          );
        }
      }
    }
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/app", "layout");
}

// ---------------------------------------------------------------------------
// Check-ins
// ---------------------------------------------------------------------------

/** Every date from tomorrow up to `weeks` weeks out. */
function datesAhead(from: string, weeks: number): string[] {
  return Array.from({ length: weeks * 7 }, (_, i) => shiftDate(from, i + 1));
}

const weekdayOf = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

/**
 * Repeat the client's current training week forward.
 *
 * Takes the last fortnight of assigned workouts, keeps the most recent one for
 * each weekday, and clones that shape across the coming weeks. Days that
 * already have a workout are left alone, so continuing can only ever add.
 *
 * Food needs no writes at all — an assigned target carries forward on its own
 * until Dean changes it.
 */
async function repeatCurrentWeek(clientId: string, weeks: number): Promise<number> {
  const from = today();
  const lookback = shiftDate(from, -13);
  const dates = datesAhead(from, weeks);
  const supabase = await createClient();

  if (!supabase) {
    const recent = demoWorkouts
      .filter((w) => w.clientId === clientId && w.scheduledFor >= lookback && w.scheduledFor <= from)
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));

    const pattern = new Map<number, (typeof recent)[number]>();
    for (const workout of recent) pattern.set(weekdayOf(workout.scheduledFor), workout);

    let written = 0;
    for (const date of dates) {
      const template = pattern.get(weekdayOf(date));
      if (!template) continue;
      if (demoWorkouts.some((w) => w.clientId === clientId && w.scheduledFor === date)) continue;

      const id = crypto.randomUUID();
      demoWorkouts.push({
        id,
        clientId,
        scheduledFor: date,
        title: template.title,
        suggestedTime: template.suggestedTime,
        coachNotes: template.coachNotes,
        clientNote: null,
        feeling: null,
        completedAt: null,
        fromPlan: false,
        items: template.items.map((item) => ({
          id: crypto.randomUUID(),
          workoutId: id,
          position: item.position,
          label: item.label,
          target: item.target,
          exerciseId: null,
          muscleGroup: null,
          equipment: null,
          howTo: null,
          skippedReason: null,
          sets: [],
          done: false,
          doneAt: null,
        })),
      });
      written += 1;
    }
    return written;
  }

  const { data: recent } = await supabase
    .from("workouts")
    .select("*, workout_items(*)")
    .eq("client_id", clientId)
    .gte("scheduled_for", lookback)
    .lte("scheduled_for", from)
    .order("scheduled_for", { ascending: true });

  /* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
  const pattern = new Map<number, any>();
  for (const row of (recent ?? []) as any[]) pattern.set(weekdayOf(row.scheduled_for), row);
  if (pattern.size === 0) return 0;

  const { data: existing } = await supabase
    .from("workouts")
    .select("scheduled_for")
    .eq("client_id", clientId)
    .in("scheduled_for", dates);
  const taken = new Set((existing ?? []).map((row) => row.scheduled_for));

  let written = 0;
  for (const date of dates) {
    const template = pattern.get(weekdayOf(date));
    if (!template || taken.has(date)) continue;

    const { data: workout } = await supabase
      .from("workouts")
      .insert({
        client_id: clientId,
        scheduled_for: date,
        title: template.title,
        suggested_time: template.suggested_time,
        coach_notes: template.coach_notes,
        source_plan_id: template.source_plan_id,
      })
      .select("id")
      .single();

    if (!workout) continue;

    const items = (template.workout_items ?? []) as any[];
    if (items.length > 0) {
      await supabase.from("workout_items").insert(
        items.map((item) => ({
          workout_id: workout.id,
          position: item.position,
          label: item.label,
          target: item.target,
        })),
      );
    }
    written += 1;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return written;
}

/**
 * Clear queued workouts the new pattern does not cover.
 *
 * Adjusting someone to Mon/Wed/Fri has to mean they train Mon/Wed/Fri. Leaving
 * their old Tue/Thu days in place would quietly hand them five sessions a week
 * — the opposite of what Dean just decided. Only ever touches days from
 * tomorrow onwards, so nothing already worked through is lost.
 */
async function clearUnplannedDays(clientId: string, from: string, to: string, keep: number[]) {
  // No weekdays ticked means every day is covered, so nothing falls outside.
  if (keep.length === 0) return;

  const outside = (date: string) => date >= from && date <= to && !keep.includes(weekdayOf(date));
  const supabase = await createClient();

  if (!supabase) {
    for (let i = demoWorkouts.length - 1; i >= 0; i -= 1) {
      const workout = demoWorkouts[i];
      if (workout.clientId === clientId && outside(workout.scheduledFor)) {
        demoWorkouts.splice(i, 1);
      }
    }
    return;
  }

  const { data } = await supabase
    .from("workouts")
    .select("id, scheduled_for")
    .eq("client_id", clientId)
    .gte("scheduled_for", from)
    .lte("scheduled_for", to);

  const ids = (data ?? []).filter((row) => outside(row.scheduled_for)).map((row) => row.id);
  if (ids.length > 0) await supabase.from("workouts").delete().in("id", ids);
}

/** Hand a set of fields to the existing assigners, which read FormData. */
function assignmentForm(fields: {
  clientId: string;
  planId: string;
  from: string;
  to: string;
  weekdays: number[];
  suggestedTime?: string | null;
}): FormData {
  const form = new FormData();
  form.set("clientId", fields.clientId);
  form.set("planId", fields.planId);
  form.set("from", fields.from);
  form.set("to", fields.to);
  // Adjusting is a deliberate replacement of what is already queued, and only
  // ever touches days from tomorrow onwards, so nothing worked through is lost.
  form.set("overwrite", "on");
  if (fields.suggestedTime) form.set("suggestedTime", fields.suggestedTime);
  for (const day of fields.weekdays) form.append("weekdays", String(day));
  return form;
}

/**
 * Record a weekly check-in.
 *
 * "Continue" repeats what the client is already doing; "adjust" paints the
 * chosen plans over the coming weeks instead, both halves of the week in one
 * pass. Either way the decision is stored with Dean's note, the note is
 * delivered to the client, and the next review is dated.
 */
export async function recordCheckIn(formData: FormData) {
  const coach = await getCurrentProfile();
  if (!coach || coach.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!clientId || !note) return;

  const outcome = formData.get("outcome") === "adjusted" ? "adjusted" : "continued";
  const weeks = Math.min(4, Math.max(0, Number(formData.get("weeks") ?? 4) || 0));
  const reviewInDays = Math.min(28, Math.max(1, Number(formData.get("reviewInDays") ?? 7) || 7));

  const periodEnd = today();
  const periodStart = shiftDate(periodEnd, -6);
  const nextReviewOn = shiftDate(periodEnd, reviewInDays);

  // Recorded as what was actually written, not what was asked for: continuing
  // a client who has no pattern yet writes nothing, and the history should say
  // so rather than claim four weeks are covered.
  let weeksPlanned = 0;

  if (weeks > 0) {
    if (outcome === "adjusted") {
      const workoutPlanId = String(formData.get("workoutPlanId") ?? "");
      const dayPlanId = String(formData.get("dayPlanId") ?? "");
      const weekdays = formData.getAll("weekdays").map((v) => Number(v));
      const suggestedTime = String(formData.get("suggestedTime") ?? "").trim() || null;
      const from = shiftDate(periodEnd, 1);
      const to = shiftDate(periodEnd, weeks * 7);

      if (workoutPlanId) {
        await clearUnplannedDays(clientId, from, to, weekdays);
        await assignSessionPlan(
          assignmentForm({ clientId, planId: workoutPlanId, from, to, weekdays, suggestedTime }),
        );
      }
      // Food is set for every day of the range, not just training days.
      if (dayPlanId) {
        await assignDayPlan(assignmentForm({ clientId, planId: dayPlanId, from, to, weekdays: [] }));
      }
      if (workoutPlanId || dayPlanId) weeksPlanned = weeks;
    } else if ((await repeatCurrentWeek(clientId, weeks)) > 0) {
      weeksPlanned = weeks;
    }
  }

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
    const workoutId = crypto.randomUUID();
    demoWorkouts.push({
      ...existing,
      id: workoutId,
      fromPlan: false,
      items: existing.items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        workoutId,
        sets: item.sets.map((set) => ({ ...set, id: crypto.randomUUID() })),
      })),
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
    for (const workout of demoWorkouts) {
      for (const item of workout.items) {
        const set = item.sets.find((s) => s.id === setId);
        if (set) {
          set.actualWeightKg = actualWeightKg;
          set.actualReps = actualReps;
          set.doneAt = doneAt;
          // An exercise counts as done once every set has been logged.
          item.done = item.sets.every((s) => s.doneAt);
          item.doneAt = item.done ? doneAt : null;
        }
      }
    }
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
    for (const workout of demoWorkouts) {
      const item = workout.items.find((i) => i.id === itemId);
      if (item) {
        item.skippedReason = reason;
        item.done = false;
      }
    }
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
    const workout = demoWorkouts.find((w) => w.id === workoutId);
    if (workout) {
      workout.feeling = feeling;
      workout.clientNote = note;
      workout.completedAt = completedAt;
    }
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
async function writeRevision(
  blockId: string,
  dayIndex: number,
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
    demoPlanRevisions.push({
      id: crypto.randomUUID(),
      blockId,
      dayIndex,
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
    });
    return;
  }

  const { data: revision } = await supabase
    .from("plan_day_revisions")
    .insert({
      block_id: blockId,
      day_index: dayIndex,
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

/** Start a client on a repeating plan. The start date is also the takeover. */
export async function createPlanBlock(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return;

  const cycleWeeks = Number(formData.get("cycleWeeks")) === 2 ? 2 : 1;
  const startsOn = String(formData.get("startsOn") ?? today());

  const supabase = await createClient();

  if (!supabase) {
    const existing = demoPlanBlocks.find((b) => b.clientId === clientId);
    if (existing) Object.assign(existing, { cycleWeeks, startsOn });
    else demoPlanBlocks.push({ id: crypto.randomUUID(), clientId, cycleWeeks, startsOn });
  } else {
    await supabase
      .from("plan_blocks")
      .upsert(
        { client_id: clientId, cycle_weeks: cycleWeeks, starts_on: startsOn },
        { onConflict: "client_id" },
      );
  }

  refresh();
}

/**
 * Write one day of the cycle.
 *
 * Scope is the whole point: "weekday" inserts a revision effective from the
 * chosen date, so every future instance of that weekday changes; "date" writes
 * a one-off for that date alone. Neither is ever dated before today, which is
 * what keeps past days exactly as they were.
 */
export async function savePlanDay(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  const dayIndex = Number(formData.get("dayIndex"));
  const kind = formData.get("kind") === "food" ? "food" : "workout";
  if (!clientId || !Number.isFinite(dayIndex)) return;

  const block = await getPlanBlock(clientId);
  if (!block) return;

  const scope: EditScope = formData.get("scope") === "date" ? "date" : "weekday";
  const requested = String(formData.get("from") ?? today());
  // Never backdate: an edit reaches forward from today at the earliest.
  const from = requested < today() ? today() : requested;

  const isRest = formData.get("isRest") === "on";
  const title = String(formData.get("title") ?? "").trim() || null;
  const suggestedTime = String(formData.get("suggestedTime") ?? "").trim() || null;
  const coachNotes = String(formData.get("coachNotes") ?? "").trim() || null;
  const calorieTarget = Number(formData.get("calorieTarget")) || null;
  const proteinTarget = Number(formData.get("proteinTarget")) || null;

  const exercises = isRest ? [] : readPlanExercises(formData);
  const meals = isRest ? [] : readPlanMeals(formData);

  await writeRevision(block.id, dayIndex, kind, from, scope === "date" ? from : null, {
    title,
    suggestedTime,
    coachNotes,
    calorieTarget,
    proteinTarget,
    isRest,
    exercises,
    meals,
  });

  refresh();
}

/**
 * Nudge every target on a day, or across the whole block.
 *
 * Written as a new revision like any other edit, so the week before the bump
 * still reads as what it was.
 */
export async function bumpPlanWeights(formData: FormData) {
  const coach = await getCurrentProfile();
  if (coach?.role !== "admin") return;

  const clientId = String(formData.get("clientId") ?? "");
  const delta = Number(formData.get("delta") ?? 2.5) || 2.5;
  const scopeDay = formData.get("dayIndex");
  const onlyDay = scopeDay === null || scopeDay === "" ? null : Number(scopeDay);

  const block = await getPlanBlock(clientId);
  if (!block) return;

  const from = today();
  const days = onlyDay === null ? Array.from({ length: block.cycleWeeks * 7 }, (_, i) => i) : [onlyDay];

  for (const dayIndex of days) {
    const day = (await getPlanCycle(block, from, "workout"))[dayIndex];
    // Only a day with weighted sets is worth writing a new revision for.
    if (!day || day.exercises.length === 0) continue;

    const bumped = day.exercises.map((exercise) => ({
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
    }));

    await writeRevision(block.id, dayIndex, "workout", from, null, {
      title: day.title,
      suggestedTime: day.suggestedTime,
      coachNotes: day.coachNotes,
      calorieTarget: null,
      proteinTarget: null,
      isRest: false,
      exercises: bumped,
      meals: [],
    });
  }

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
      const index = demoMealLogs.findIndex((log) => log.id === existing.id);
      if (index >= 0) demoMealLogs.splice(index, 1);
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
    demoMealLogs.push({
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

  const clientId = String(formData.get("clientId") ?? profile.id);
  const loggedFor = String(formData.get("date") ?? today());
  const value = Number(formData.get("feeling"));
  const feeling = value >= 1 && value <= 5 ? Math.round(value) : null;
  const note = String(formData.get("note") ?? "").trim() || null;

  const supabase = await createClient();

  if (!supabase) {
    const existing = demoFoodDayFeedback.find(
      (entry) => entry.clientId === clientId && entry.loggedFor === loggedFor,
    );
    if (existing) Object.assign(existing, { feeling, note });
    else demoFoodDayFeedback.push({ clientId, loggedFor, feeling, note });
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
    demoShoppingLists.push({
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
    });
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
    for (const list of demoShoppingLists) {
      const item = list.items.find((entry) => entry.id === itemId);
      if (item) item.checkedAt = item.checkedAt ? null : new Date().toISOString();
    }
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
    const stored = demoShoppingLists.find((entry) => entry.id === listId);
    const a = stored?.items.find((item) => item.id === moving.id);
    const b = stored?.items.find((item) => item.id === displaced.id);
    if (a && b) {
      const held = a.position;
      a.position = b.position;
      b.position = held;
    }
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
    const index = demoShoppingLists.findIndex((list) => list.id === listId && list.clientId === profile.id);
    if (index >= 0) demoShoppingLists.splice(index, 1);
  } else {
    await supabase.from("shopping_lists").delete().eq("id", listId).eq("client_id", profile.id);
  }

  refresh();
  redirect("/app/food/shopping");
}
