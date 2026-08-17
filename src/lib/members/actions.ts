"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/data/site";
import {
  demoComments,
  demoDayPlans,
  demoFoodLogs,
  demoFoodPlans,
  demoProfiles,
  demoSessionPlans,
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
        completedAt: null,
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
          completedAt: null,
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
