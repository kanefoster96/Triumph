import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ChefHat } from "lucide-react";
import { getCurrentProfile, getMeal, scaleMeal } from "@/lib/members/service";
import { EmptyState, Panel, ScreenTitle } from "@/components/members/ui";
import { MacroRing } from "@/components/members/MacroRing";
import { Chip } from "@/components/ui/Chip";

export const dynamic = "force-dynamic";

const PORTIONS = [0.5, 1, 1.5, 2];

/** "1.5" reads better than "1.50", and "1" better than "1.0". */
function amount(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

export default async function MealPage({ params, searchParams }: PageProps<"/app/food/meal/[id]">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const meal = await getMeal(id);
  if (!meal) notFound();

  // The portion comes from their plan; the picker is for cooking a different
  // amount without Dean having to change anything.
  const requested = Number(typeof query.x === "string" ? query.x : "");
  const multiplier = PORTIONS.includes(requested) ? requested : 1;
  const scaled = scaleMeal(meal, multiplier);

  return (
    <>
      <Link
        href="/app/food"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Food
      </Link>

      <ScreenTitle
        title={meal.name}
        subtitle={multiplier === 1 ? meal.tag : `${meal.tag} · ${amount(multiplier)} portions`}
      />

      <div className="space-y-5">
        <Panel
          title="Your portion"
          action={
            <nav aria-label="Portion" className="flex items-center gap-1">
              {PORTIONS.map((value) => (
                <Link
                  key={value}
                  href={`/app/food/meal/${meal.id}?x=${value}`}
                  aria-current={value === multiplier ? "page" : undefined}
                  className={
                    value === multiplier
                      ? "rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
                      : "rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:text-text"
                  }
                >
                  {amount(value)}×
                </Link>
              ))}
            </nav>
          }
        >
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
                    {ingredient.quantity === null
                      ? "—"
                      : ingredient.unit === "whole"
                        ? amount(ingredient.quantity)
                        : `${amount(ingredient.quantity)}${ingredient.unit ? ` ${ingredient.unit}` : ""}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {multiplier !== 1 ? (
            <p className="mt-4 text-xs text-faint">Scaled to your {amount(multiplier)}× portion.</p>
          ) : null}
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
