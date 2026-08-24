"use client";

import { useState } from "react";
import { askForChange } from "@/lib/members/actions";
import { field, fieldLabel, submitButton } from "./ui";
import { CHANGE_ASKS, COACHING_LABELS, type ChangeField } from "@/lib/members/types";

/**
 * A client asking Dean to change something about how they are coached.
 *
 * Their goal and their mode are coaching decisions, so this is an ask rather
 * than an edit — the same shape as moving a session, and for the same reason.
 * The value input changes with the field because two of these are a choice
 * between things Dean offers and the rest are theirs to say.
 */
const ORDER: ChangeField[] = [
  "goal",
  "goal_weight",
  "coaching_mode",
  "food_mode",
  "full_name",
];

export function AskForChange() {
  const [selected, setSelected] = useState<ChangeField>("goal");

  return (
    <form action={askForChange} className="space-y-5">
      <div>
        <label className={fieldLabel} htmlFor="ask-field">
          What you&rsquo;d like to change
        </label>
        <select
          id="ask-field"
          name="field"
          className={field}
          value={selected}
          onChange={(event) => setSelected(event.target.value as ChangeField)}
        >
          {ORDER.map((key) => (
            <option key={key} value={key}>
              {CHANGE_ASKS[key]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={fieldLabel} htmlFor="ask-value">
          What you&rsquo;d like it to be
        </label>
        {selected === "coaching_mode" ? (
          <select id="ask-value" name="value" className={field} defaultValue="online">
            <option value="online">{COACHING_LABELS.online}</option>
            <option value="one_to_one">{COACHING_LABELS.one_to_one}</option>
          </select>
        ) : selected === "food_mode" ? (
          <select id="ask-value" name="value" className={field} defaultValue="coach">
            <option value="coach">You plan my food</option>
            <option value="self">I plan my own food to your targets</option>
          </select>
        ) : (
          <input
            id="ask-value"
            name="value"
            className={field}
            required
            maxLength={200}
            inputMode={selected === "goal_weight" ? "decimal" : "text"}
            placeholder={
              selected === "goal_weight"
                ? "72"
                : selected === "full_name"
                  ? "Alex Morgan"
                  : "Get stronger without putting weight on"
            }
          />
        )}
      </div>

      <div>
        <label className={fieldLabel} htmlFor="ask-reason">
          Anything I should know
        </label>
        <textarea
          id="ask-reason"
          name="reason"
          rows={2}
          className={field}
          maxLength={400}
          placeholder="Optional."
        />
      </div>

      <button type="submit" className={submitButton}>
        Send it to Dean
      </button>
    </form>
  );
}
