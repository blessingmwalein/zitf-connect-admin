import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  children,
  className,
}: ChartCardProps) {
  return (
    <div className={cn("ios-card p-5", className)}>
      <div className="mb-4">
        <h3 className="text-headline text-foreground">{title}</h3>
        {description && (
          <p className="mt-0.5 text-footnote text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
