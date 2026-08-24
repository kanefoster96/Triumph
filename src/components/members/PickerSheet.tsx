"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { field } from "./ui";
import { cn } from "@/lib/utils";

export interface PickerOption {
  id: string;
  label: string;
  /** The second line: a muscle group, a calorie count, whatever narrows it. */
  hint?: string;
  /** Groups the list under headings — muscle group, meal slot. */
  group?: string;
}

/**
 * Choosing one thing out of a library.
 *
 * A native `<select>` is fine for four options and hopeless for four hundred:
 * on a phone it is a scrolling wheel with no search, showing one line at a
 * time, and these libraries are meant to grow. This is the same choice as a
 * full-height sheet — search pinned at the top, rows big enough to hit, the
 * current pick marked — with the value carried in a hidden input so the form
 * around it does not know the difference.
 */
export function PickerSheet({
  name,
  value,
  options,
  onChange,
  title,
  placeholder,
  searchPlaceholder = "Search",
  emptyLabel = "Pick one…",
  hideChosenHint = false,
  className,
}: {
  /** Submitted with the form. Omit for a control that only drives state. */
  name?: string;
  value: string;
  options: PickerOption[];
  onChange: (id: string) => void;
  title: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /**
   * Keep the hint for the list but not for the chosen row — a meal's own
   * calories next to the same number scaled by its portion reads as a
   * contradiction the moment the portion is anything but one.
   */
  hideChosenHint?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const chosen = options.find((option) => option.id === value) ?? null;

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) ||
        (option.hint ?? "").toLowerCase().includes(needle) ||
        (option.group ?? "").toLowerCase().includes(needle),
    );
  }, [options, query]);

  // Grouped only when the options say so, and only while nothing is typed —
  // once you are searching, headings get in the way of the results.
  const groups = useMemo(() => {
    if (query.trim() || !options.some((option) => option.group)) {
      return [{ name: null as string | null, items: matches }];
    }
    const byGroup = new Map<string | null, PickerOption[]>();
    for (const option of matches) {
      const key = option.group ?? null;
      byGroup.set(key, [...(byGroup.get(key) ?? []), option]);
    }
    return [...byGroup.entries()].map(([name, items]) => ({ name, items }));
  }, [matches, options, query]);

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        type="button"
        onClick={() => {
          setQuery("");
          setOpen(true);
        }}
        className={cn(
          "flex min-h-11 w-full items-center gap-2 rounded-2xl bg-raised px-4 py-2.5 text-left text-sm transition-colors hover:bg-overlay",
          className,
        )}
      >
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate", chosen ? "text-text" : "text-faint")}>
            {chosen?.label ?? placeholder ?? emptyLabel}
          </span>
          {chosen?.hint && !hideChosenHint ? (
            <span className="block truncate text-xs text-faint">{chosen.hint}</span>
          ) : null}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-faint" />
      </button>

      {open ? (
        <BottomSheet open onClose={() => setOpen(false)} title={title}>
          {/* Pinned rather than scrolling away: with a long library the search
              is the only way back once you are three screens down. */}
          <div className="sticky -top-4 z-10 -mx-5 -mt-4 mb-3 bg-surface px-5 pt-4 pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-faint" />
              <label className="sr-only" htmlFor={`picker-${title}`}>
                {searchPlaceholder}
              </label>
              <input
                id={`picker-${title}`}
                className={`${field} pl-11`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                autoComplete="off"
              />
            </div>
          </div>

          {matches.length === 0 ? (
            <p className="py-6 text-center text-sm text-faint">Nothing matches “{query.trim()}”.</p>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.name ?? "all"}>
                  {group.name ? (
                    <h3 className="mb-1.5 text-xs font-semibold text-faint">
                      {group.name}
                    </h3>
                  ) : null}
                  <ul className="space-y-1.5">
                    {group.items.map((option) => {
                      const picked = option.id === value;
                      return (
                        <li key={option.id}>
                          <button
                            type="button"
                            onClick={() => {
                              onChange(option.id);
                              setOpen(false);
                            }}
                            className={cn(
                              "flex min-h-[3.25rem] w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors",
                              picked ? "bg-accent/15" : "bg-raised hover:bg-overlay",
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">
                                {option.label}
                              </span>
                              {option.hint ? (
                                <span className="block truncate text-xs text-faint">
                                  {option.hint}
                                </span>
                              ) : null}
                            </span>
                            {picked ? (
                              <Check className="h-4 w-4 shrink-0 text-accent" />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </BottomSheet>
      ) : null}
    </>
  );
}
