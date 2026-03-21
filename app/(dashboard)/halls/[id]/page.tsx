import Link from "next/link";
import { ArrowLeft, MapPin, Users, Edit } from "lucide-react";
import { notFound } from "next/navigation";
import { getHallById } from "@/services/hall.service";
import { getStandsByHall } from "@/services/stand.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StandStatus } from "@/lib/constants";
import { STAND_STATUS_CONFIG } from "@/lib/constants";
import { HallMapSection } from "./hall-map-section";

const STATUS_BG: Record<StandStatus, string> = {
  available: "bg-ios-green/20 border-ios-green/40",
  reserved: "bg-ios-orange/20 border-ios-orange/40",
  booked: "bg-ios-blue/20 border-ios-blue/40",
  unavailable: "bg-muted border-muted-foreground/20",
};

interface HallData {
  id: string;
  name: string;
  description: string;
  capacity: number;
  is_active: boolean;
  display_order: number;
  geo_polygon: [number, number][] | null;
  geo_center: [number, number] | null;
}

interface StandItem {
  id: string;
  stand_number: string;
  status: StandStatus;
  exhibitor_name: string | null;
  area_sqm: number;
  geo_polygon: [number, number][] | null;
}

export default async function HallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let hall: HallData | null = null;
  let stands: StandItem[] = [];

  try {
    const [hallRes, standsRes] = await Promise.all([
      getHallById(id),
      getStandsByHall(id),
    ]) as [any, any];
    if (hallRes.data) {
      const h = hallRes.data;
      hall = {
        id: h.id,
        name: h.name,
        description: h.description ?? "",
        capacity: h.capacity ?? 0,
        is_active: h.is_active,
        display_order: h.display_order,
        geo_polygon: (h as any).geo_polygon ?? null,
        geo_center: (h as any).geo_center ?? null,
      };
    }
    if (standsRes.data && standsRes.data.length > 0) {
      stands = standsRes.data.map((s: any) => ({
        id: s.id,
        stand_number: s.stand_number,
        status: s.status as StandStatus,
        exhibitor_name: s.exhibitors?.company_name ?? null,
        area_sqm: s.area_sqm ?? 0,
        geo_polygon: s.geo_polygon ?? null,
      }));
    }
  } catch {
    // Supabase query failed
  }

  if (!hall) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title={hall.name} description={hall.description}>
        <Link href="/halls">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
      </PageHeader>

      {/* Hall info summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="ios-card" size="sm">
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ios-blue/10">
              <Users className="size-4 text-ios-blue" />
            </div>
            <div>
              <p className="text-caption-1 text-muted-foreground">Capacity</p>
              <p className="text-headline">{hall.capacity?.toLocaleString() ?? "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="ios-card" size="sm">
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ios-green/10">
              <MapPin className="size-4 text-ios-green" />
            </div>
            <div>
              <p className="text-caption-1 text-muted-foreground">Stands</p>
              <p className="text-headline">{stands.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="ios-card" size="sm">
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ios-orange/10">
              <Edit className="size-4 text-ios-orange" />
            </div>
            <div>
              <p className="text-caption-1 text-muted-foreground">Status</p>
              <Badge
                className={cn(
                  hall.is_active
                    ? "bg-ios-green/15 text-ios-green"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {hall.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hall map — polygon editor for hall boundary + stand visualization */}
      <HallMapSection hall={hall} stands={stands} />

      {/* Stands list */}
      <Card className="ios-card">
        <CardHeader>
          <CardTitle className="text-headline">
            Stands ({stands.length})
          </CardTitle>
          <CardDescription>
            All stands assigned to this hall
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stands.length === 0 ? (
            <p className="py-8 text-center text-subheadline text-muted-foreground">
              No stands have been added to this hall yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stands.map((stand) => {
                const statusConfig = STAND_STATUS_CONFIG[stand.status];
                return (
                  <Link key={stand.id} href={`/stands/${stand.id}`}>
                    <div
                      className={cn(
                        "rounded-xl border p-3 transition-shadow hover:shadow-md",
                        STATUS_BG[stand.status]
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-headline">
                          {stand.stand_number}
                        </span>
                        <Badge className={cn("text-caption-2", statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-footnote text-muted-foreground">
                        {stand.exhibitor_name ?? "Unassigned"}
                      </p>
                      <p className="mt-0.5 text-caption-1 text-muted-foreground">
                        {stand.area_sqm} m&sup2;
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
