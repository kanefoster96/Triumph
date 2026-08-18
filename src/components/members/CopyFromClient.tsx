"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Loader2, Search, Sparkles } from "lucide-react";
import {
  copyPlanDayFromClient,
  listCopyDays,
  listCopySources,
  type CopyDay,
  type CopySource,
} from "@/lib/members/actions";
import { Avatar } from "./Avatar";
import { BottomSheet } from "./BottomSheet";
import { field } from "./ui";

/**
 * Start this day from one Dean has already built for somebody else.
 *
 * The Templates page it replaces was a second library to keep up to date, and
 * it stored a session as free text — so assigning one meant reading it back
 * and re-typing it into structured fields. The thing worth reusing was never
 * an abstract template; it was Tuesday's lower body session, the one that is
 * already working for another client.
 *
 * Client → their days → preview → use. Both lists load when they are opened
 * rather than with the page: thirty clients' plans is not something to ship on
 * the chance that he taps this.
 */
export function CopyFromClient({
  clientId,
  date,
  review,
}: {
  clientId: string;
  date: string;
  review: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState<CopySource[] | null>(null);
  const [picked, setPicked] = useState<CopySource | null>(null);
  const [days, setDays] = useState<CopyDay[] | null>(null);
  const [preview, setPreview] = useState<CopyDay | null>(null);
  const [query, setQuery] = useState("");
  const [loading, startLoading] = useTransition();

  function openSheet() {
    setOpen(true);
    if (sources === null) startLoading(async () => setSources(await listCopySources(clientId)));
  }

  function pickClient(source: CopySource) {
    setPicked(source);
    setDays(null);
    setPreview(null);
    startLoading(async () => setDays(await listCopyDays(source.id)));
  }

  function back() {
    if (preview) setPreview(null);
    else {
      setPicked(null);
      setDays(null);
    }
  }

  const matches = (sources ?? []).filter((source) =>
    source.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Start from another client
      </button>

      {open ? (
        <BottomSheet
          open
          onClose={() => setOpen(false)}
          title={preview ? (preview.title ?? preview.label) : (picked?.name ?? "Start from another client")}
          description={
            preview
              ? "A copy. Editing it here never touches theirs."
              : picked
                ? "Pick one of their days to preview it."
                : "Pick whose plan to borrow from."
          }
        >
          {picked ? (
            <button
              type="button"
              onClick={back}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-text"
            >
              <ArrowLeft className="h-4 w-4" />
              {preview ? `Back to ${picked.name}` : "All clients"}
            </button>
          ) : null}

          {loading ? (
            <p className="flex items-center gap-2 py-6 text-sm text-faint">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </p>
          ) : preview ? (
            <Preview
              day={preview}
              clientId={clientId}
              sourceClientId={picked!.id}
              date={date}
              review={review}
            />
          ) : picked ? (
            <DayList days={days ?? []} onPick={setPreview} />
          ) : (
            <>
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-faint" />
                <label className="sr-only" htmlFor="copy-search">
                  Search clients
                </label>
                <input
                  id="copy-search"
                  className={`${field} pl-11`}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search clients"
                />
              </div>
              <ul className="space-y-2">
                {matches.length === 0 ? (
                  <li className="py-4 text-sm text-faint">No one else to borrow from yet.</li>
                ) : null}
                {matches.map((source) => (
                  <li key={source.id}>
                    <button
                      type="button"
                      onClick={() => pickClient(source)}
                      disabled={source.dayCount === 0}
                      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-ink p-3 text-left transition-colors enabled:hover:border-accent/40 disabled:opacity-50"
                    >
                      <Avatar name={source.name} src={source.avatarUrl} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{source.name}</span>
                        <span className="text-xs text-faint">
                          {source.dayCount === 0
                            ? "No days built yet"
                            : `${source.dayCount} ${source.dayCount === 1 ? "day" : "days"} built`}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </BottomSheet>
      ) : null}
    </>
  );
}

function DayList({ days, onPick }: { days: CopyDay[]; onPick: (day: CopyDay) => void }) {
  if (days.length === 0) {
    return <p className="py-4 text-sm text-faint">No days saved for this client.</p>;
  }

  return (
    <ul className="space-y-2">
      {days.map((day) => (
        <li key={day.dayIndex}>
          <button
            type="button"
            onClick={() => onPick(day)}
            className="w-full rounded-2xl border border-line bg-ink p-3 text-left transition-colors hover:border-accent/40"
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-semibold">
                {day.title ?? "Training"}
              </span>
              <span className="shrink-0 text-xs text-faint">{day.label}</span>
            </span>
            <span className="mt-1 block text-xs text-muted">
              {day.exercises.length > 0
                ? `${day.exercises.length} ${day.exercises.length === 1 ? "exercise" : "exercises"}`
                : "No training"}
              {day.meals.length > 0 ? ` · ${day.meals.length} meals` : ""}
              {day.calorieTarget ? ` · ${day.calorieTarget.toLocaleString("en-GB")} kcal` : ""}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Preview({
  day,
  clientId,
  sourceClientId,
  date,
  review,
}: {
  day: CopyDay;
  clientId: string;
  sourceClientId: string;
  date: string;
  review: boolean;
}) {
  return (
    <div className="space-y-4">
      {day.exercises.length > 0 ? (
        <ul className="space-y-1.5 rounded-2xl border border-line bg-ink p-4">
          {day.exercises.map((line) => (
            <li key={line} className="text-sm text-muted">
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-faint">No training on this day.</p>
      )}

      {day.meals.length > 0 ? (
        <div className="rounded-2xl border border-line bg-ink p-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-faint uppercase">
            Food{day.calorieTarget ? ` · ${day.calorieTarget.toLocaleString("en-GB")} kcal` : ""}
          </p>
          <ul className="mt-2 space-y-1">
            {day.meals.map((name) => (
              <li key={name} className="text-sm text-muted">
                {name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Two buttons rather than a checkbox: borrowing a session and borrowing
          somebody's whole day are different intentions, and the difference is
          worth a press rather than a setting. */}
      <div className="flex flex-col gap-2">
        {(
          [
            ["0", "Use the training"],
            ["1", "Use the whole day"],
          ] as const
        ).map(([withFood, label]) => (
          <form key={withFood} action={copyPlanDayFromClient}>
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="sourceClientId" value={sourceClientId} />
            <input type="hidden" name="sourceDayIndex" value={day.dayIndex} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="withFood" value={withFood} />
            {review ? <input type="hidden" name="review" value="1" /> : null}
            <button
              type="submit"
              disabled={withFood === "1" && day.meals.length === 0}
              className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-raised disabled:text-faint"
            >
              {label}
            </button>
          </form>
        ))}
      </div>

      <p className="text-xs text-faint">
        Lands on this date only, so nothing else in their week moves. Adjust it, then choose how far
        your version reaches when you save.
      </p>
    </div>
  );
}
