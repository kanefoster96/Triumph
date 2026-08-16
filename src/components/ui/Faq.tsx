import { Plus } from "lucide-react";
import type { FaqItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Native <details> disclosure — keyboard accessible and works without JS,
 * which keeps first paint honest on a slow phone connection.
 */
export function Faq({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <details
          key={item.id}
          className="group rounded-[var(--radius-sheet)] border border-line bg-surface open:border-accent/30"
        >
          <summary className="flex cursor-pointer list-none items-center gap-4 p-5 text-left [&::-webkit-details-marker]:hidden">
            <h3 className="flex-1 text-base leading-snug font-semibold">{item.question}</h3>
            <Plus className="h-5 w-5 shrink-0 text-faint transition-transform duration-300 ease-[var(--ease-out-app)] group-open:rotate-45 group-open:text-accent" />
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
