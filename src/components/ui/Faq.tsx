import { Plus } from "lucide-react";
import type { FaqItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Native <details> disclosure — keyboard accessible and works without JS,
 * which keeps first paint honest on a slow phone connection.
 */
export function Faq({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface", className)}>
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex cursor-pointer list-none items-center gap-4 p-5 text-left transition-colors hover:bg-raised/60 [&::-webkit-details-marker]:hidden">
            <h3 className="flex-1 text-base leading-snug font-semibold">{item.question}</h3>
            <Plus className="h-5 w-5 shrink-0 text-faint transition-transform duration-300 ease-[var(--ease-out-app)] group-open:rotate-45 group-open:text-accent" />
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
