export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-muted/40 ${className ?? "h-[400px]"}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
        <p className="text-caption-1 text-muted-foreground">Loading map...</p>
      </div>
    </div>
  );
}
