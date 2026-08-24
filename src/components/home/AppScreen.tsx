import { Check, Heart, MessageCircle } from "lucide-react";
import type { AppPreview } from "@/lib/types";
import { cn } from "@/lib/utils";

/** A tick box, empty or filled — the app's own control, at preview scale. */
function Tick({ done }: { done: boolean }) {
  return (
    <span
      className={cn(
        "grid h-4 w-4 shrink-0 place-items-center rounded-[0.3rem] transition-colors",
        // An empty box has nothing but its outline to show, which is the one
        // place a line still earns its keep.
        done ? "bg-accent text-accent-ink" : "border border-muted/40",
      )}
    >
      {done ? <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> : null}
    </span>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface p-3">
      <p className="text-[0.65rem] font-semibold text-faint">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/**
 * One members'-area screen, drawn from data.
 *
 * Everything here is a still. Nothing ticks, sends or saves: it is a drawing
 * of the screen, not the screen, and a preview that appeared to work would
 * have people trying to use it on the marketing site.
 */
export function AppScreen({ preview }: { preview: AppPreview }) {
  if (preview.kind === "plan") {
    const pct = Math.round((preview.caloriesSoFar / preview.calorieTarget) * 100);
    const done = preview.exercises.filter((e) => e.done).length;

    return (
      <div className="space-y-2.5">
        <Panel title="Today">
          <p className="font-display text-xl leading-none font-bold tabular-nums">
            {preview.caloriesSoFar.toLocaleString("en-GB")}
            <span className="text-[0.7rem] font-normal text-faint">
              {" "}
              / {preview.calorieTarget.toLocaleString("en-GB")} kcal
            </span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        </Panel>

        <Panel title={`${preview.workout} · ${done} of ${preview.exercises.length} done`}>
          <ul className="space-y-1.5">
            {preview.exercises.map((exercise) => (
              <li key={exercise.name} className="flex items-center gap-2.5 rounded-xl bg-raised p-2.5">
                <Tick done={exercise.done} />
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-[0.7rem] font-semibold",
                      exercise.done && "text-muted line-through",
                    )}
                  >
                    {exercise.name}
                  </span>
                  <span className="block truncate text-[0.6rem] text-faint">{exercise.target}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

  if (preview.kind === "log") {
    return (
      <div className="space-y-2.5">
        <Panel title="Calories today">
          <p className="font-display text-2xl leading-none font-bold tabular-nums">
            {preview.calories.toLocaleString("en-GB")}
            <span className="text-[0.7rem] font-normal text-faint"> kcal</span>
          </p>
        </Panel>

        <Panel title="Meals">
          <ul className="space-y-1.5">
            {preview.meals.map((meal) => (
              <li key={meal.name} className="flex items-center gap-2.5 rounded-xl bg-raised px-2.5 py-2">
                <Tick done={meal.done} />
                <span className="truncate text-[0.7rem] font-semibold">{meal.name}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="How it went">
          <p className="rounded-xl bg-raised p-2.5 text-[0.7rem] leading-relaxed text-muted">
            {preview.note}
          </p>
        </Panel>
      </div>
    );
  }

  if (preview.kind === "feed") {
    return (
      <div className="space-y-2.5">
        {preview.posts.map((post) => (
          <div key={post.id} className="rounded-2xl bg-surface p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-raised text-[0.55rem] font-semibold text-muted">
                {post.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
              <span className="truncate text-[0.7rem] font-semibold">{post.name}</span>
              <span className="text-[0.6rem] text-faint">{post.when}</span>
            </div>
            <p className="mt-2 text-[0.7rem] leading-relaxed text-muted">{post.body}</p>
            <div className="mt-2.5 flex items-center gap-4 text-[0.6rem] text-faint">
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3 w-3 text-accent" />
                {post.likes}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {post.replies}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {preview.messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex", message.from === "you" ? "justify-end" : "justify-start")}
        >
          <p
            className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-[0.7rem] leading-relaxed",
              message.from === "you"
                ? "rounded-br-sm bg-accent text-accent-ink"
                : "rounded-bl-sm bg-surface text-muted",
            )}
          >
            {message.body}
          </p>
        </div>
      ))}
    </div>
  );
}
