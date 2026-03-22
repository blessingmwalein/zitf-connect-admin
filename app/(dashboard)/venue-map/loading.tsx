import { Skeleton } from "@/components/ui/skeleton";

export default function VenueMapLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm rounded-full" />
      <Skeleton className="h-[70vh] w-full rounded-2xl" />
    </div>
  );
}
