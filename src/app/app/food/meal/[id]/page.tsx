import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ChefHat } from "lucide-react";
import { getAssignedPortion, getCurrentProfile, getMeal, scaleMeal, today } from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { formatAmount } from "@/lib/members/types";
import { MacroRing } from "@/components/members/MacroRing";
import { Chip } from "@/components/ui/Chip";

export const dynamic = "force-dynamic";

export default async function MealPage({ params, searchParams }: PageProps<"/app/food/meal/[id]">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const date = typeof query.date === "string" ? query.date : today();
  const [meal, assigned] = await Promise.all([getMeal(id), getAssignedPortion(profile.id, date, id)]);
  if (!meal) notFound();

  /*
   * This page is the meal, not the arithmetic behind it.
   *
   * The amounts are resolved for the day's portion and then simply presented:
   * what to buy and what to cook. Nothing here mentions scaling, a base
   * recipe, or a portion having been adjusted — the client is being handed a
   * meal, and a footnote explaining the multiplication would only invite them
   * to second-guess the numbers. Choosing a portion, where they are allowed
   * to, belongs in the plan editor.
   */
  const scaled = scaleMeal(meal, assigned ?? 1);

  return (
    <>
      <Link
        href="/app/food"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Food
      </Link>

      <ScreenTitle title={meal.name} subtitle={meal.tag} />

      <div className="space-y-5">
        <Panel title="What's in it">
          <MacroRing
            calories={scaled.calories}
            proteinG={scaled.proteinG}
            carbsG={scaled.carbsG}
            fatG={scaled.fatG}
          />
        </Panel>

        <Panel title="What you need">
          {scaled.ingredients.length === 0 ? (
            <EmptyState>No ingredients listed.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {scaled.ingredients.map((ingredient) => (
                <li key={ingredient.id} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="min-w-0 text-sm font-semibold">{ingredient.name}</span>
                  <span className="shrink-0 text-sm text-muted tabular-nums">
                    {formatAmount(ingredient.quantity, ingredient.unit)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="How to make it">
          {meal.method.length === 0 ? (
            <div className="flex items-start gap-3">
              <ChefHat className="mt-0.5 h-5 w-5 shrink-0 text-faint" />
              <p className="text-sm text-muted">
                Dean hasn&rsquo;t added a method for this one yet — the amounts above are all you need.
              </p>
            </div>
          ) : (
            <ol className="space-y-4">
              {meal.method.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-raised font-display text-sm font-bold text-accent tabular-nums">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-text">{step}</p>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        {meal.archivedAt ? (
          <Panel>
            <Chip tone="amber">Dean has retired this meal</Chip>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
