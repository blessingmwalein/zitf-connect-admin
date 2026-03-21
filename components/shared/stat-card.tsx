import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatCardProps) {
  return (
    <div className={cn("ios-card p-5", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-footnote text-muted-foreground">{title}</p>
          <p className="text-title-1">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      {(description || trend) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "text-caption-1 font-medium",
                trend.positive ? "text-ios-green" : "text-ios-red"
              )}
            >
              {trend.positive ? "+" : ""}
              {trend.value}%
            </span>
          )}
          {description && (
            <span className="text-caption-1 text-muted-foreground">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
