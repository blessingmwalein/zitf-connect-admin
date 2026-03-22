import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Exhibitor } from "@/types/database.types";
import { getExhibitors } from "@/services/exhibitor.service";
import { ExhibitorsClient } from "./exhibitors-client";

function ExhibitorsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-36 rounded-2xl" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-11 w-64 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border bg-card shadow-ios">
        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function ExhibitorsLoader() {
  let exhibitors: Exhibitor[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await getExhibitors();
    if (result?.data) {
      exhibitors = result.data as Exhibitor[];
    }
  } catch {
    // Supabase query failed
  }

  return <ExhibitorsClient exhibitors={exhibitors} />;
}

export default function ExhibitorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Exhibitors"
        description="Manage exhibitor applications and profiles"
      >
        <Button
          render={<Link href="/exhibitors/new" />}
          className="h-11 rounded-full font-semibold ios-press"
        >
          <Plus className="size-4" />
          Add Exhibitor
        </Button>
      </PageHeader>

      <Suspense fallback={<ExhibitorsSkeleton />}>
        <ExhibitorsLoader />
      </Suspense>
    </div>
  );
}
