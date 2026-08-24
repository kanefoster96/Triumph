import {
  Activity,
  CalendarCheck,
  ClipboardList,
  Dumbbell,
  Heart,
  Laptop,
  MessageCircle,
  NotebookPen,
  Salad,
  SlidersHorizontal,
  Timer,
  UserRound,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import type { FeatureIcon, VisualKey } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Rounded icon tile — the repeating unit of the layout.
 *
 * Goals and results carry a `VisualKey` rather than an image path, so the
 * site is complete with no photography. Each key maps to an icon here.
 */
const visualIcons: Record<VisualKey, ComponentType<{ className?: string }>> = {
  strength: Dumbbell,
  conditioning: Activity,
  hybrid: Timer,
  online: Laptop,
  mobility: Heart,
  nutrition: Salad,
};

/** Icons for coaching inclusions and members' area features. */
const featureIcons: Record<FeatureIcon, ComponentType<{ className?: string }>> = {
  meal: Salad,
  workout: Dumbbell,
  checkin: CalendarCheck,
  adjust: SlidersHorizontal,
  community: Users,
  chat: MessageCircle,
  plan: ClipboardList,
  log: NotebookPen,
  person: UserRound,
};

const sizes = {
  sm: { box: "h-10 w-10 rounded-xl", icon: "h-4.5 w-4.5" },
  md: { box: "h-12 w-12 rounded-xl", icon: "h-5 w-5" },
  lg: { box: "h-14 w-14 rounded-2xl", icon: "h-6 w-6" },
} as const;

interface IconTileProps {
  icon?: ComponentType<{ className?: string }>;
  visual?: VisualKey;
  feature?: FeatureIcon;
  size?: keyof typeof sizes;
  className?: string;
}

export function IconTile({ icon, visual, feature, size = "md", className }: IconTileProps) {
  const Icon =
    icon ?? (feature ? featureIcons[feature] : visual ? visualIcons[visual] : Dumbbell);
  const s = sizes[size];

  return (
    <span className={cn("grid shrink-0 place-items-center bg-accent/10 text-accent", s.box, className)}>
      <Icon className={s.icon} />
    </span>
  );
}

export { visualIcons };
