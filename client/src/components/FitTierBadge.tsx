import { cn } from "@/lib/utils";

export function FitTierBadge({ tier }: { tier: "Priority" | "Strong" | "Selective" }) {
  const styles = {
    Priority: "bg-emerald-500/12 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300",
    Strong: "bg-sky-500/12 text-sky-700 ring-sky-600/20 dark:text-sky-300",
    Selective: "bg-amber-500/12 text-amber-700 ring-amber-600/20 dark:text-amber-300",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", styles[tier])}>
      {tier}
    </span>
  );
}
