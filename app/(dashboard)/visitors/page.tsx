import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Visitor } from "@/types/database.types";
import { getVisitors } from "@/services/visitor.service";
import { VisitorsClient } from "./visitors-client";

function VisitorsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-36 rounded-2xl" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-11 w-64 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="rounded-2xl border bg-card shadow-ios">
        <div className="p-4 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function VisitorsLoader() {
  let visitors: Visitor[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await getVisitors();
    if (result?.data) {
      visitors = result.data as Visitor[];
    }
  } catch {
    // Supabase query failed
  }

  return <VisitorsClient visitors={visitors} />;
}

export default function VisitorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitors"
        description="Manage visitor registrations and profiles"
      >
        <Button
          render={<Link href="/visitors/new" />}
          className="h-11 rounded-full font-semibold ios-press"
        >
          <Plus className="size-4" />
          Add Visitor
        </Button>
      </PageHeader>

      <Suspense fallback={<VisitorsSkeleton />}>
        <VisitorsLoader />
      </Suspense>
    </div>
  );
}
