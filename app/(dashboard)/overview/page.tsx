import { Users, MapPin, Calendar, BarChart3 } from "lucide-react";
import { getDashboardStats } from "@/services/analytics.service";
import { getGroundsMapData } from "@/services/map.service";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/chart-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OverviewMapWrapper } from "./overview-map-wrapper";

const EMPTY_STATS = {
  totalExhibitors: 0,
  bookedStands: 0,
  upcomingEvents: 0,
  totalLeads: 0,
  totalVisitors: 0,
};

export default async function OverviewPage() {
  let stats = EMPTY_STATS;
  let mapData: { halls: any[]; stands: any[] } = { halls: [], stands: [] };

  try {
    const [statsResult, mapResult] = await Promise.all([
      getDashboardStats(),
      getGroundsMapData(),
    ]);
    stats = statsResult;
    mapData = { halls: mapResult.halls, stands: mapResult.stands };
  } catch {
    stats = EMPTY_STATS;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Your ZITF administration dashboard at a glance"
      />

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total Exhibitors"
          value={stats.totalExhibitors.toLocaleString()}
          icon={Users}
          trend={{ value: 12, positive: true }}
          description="vs last year"
        />
        <StatCard
          title="Booked Stands"
          value={stats.bookedStands.toLocaleString()}
          icon={MapPin}
          trend={{ value: 8, positive: true }}
          description="vs last year"
        />
        <StatCard
          title="Upcoming Events"
          value={stats.upcomingEvents.toLocaleString()}
          icon={Calendar}
          description="scheduled this edition"
        />
        <StatCard
          title="Total Leads"
          value={stats.totalLeads.toLocaleString()}
          icon={BarChart3}
          trend={{ value: 23, positive: true }}
          description="vs last year"
        />
        <StatCard
          title="Total Visitors"
          value={stats.totalVisitors.toLocaleString()}
          icon={Users}
          trend={{ value: 5, positive: true }}
          description="vs last year"
        />
      </div>

      {/* ZITF Grounds Map */}
      <Card className="ios-card">
        <CardHeader>
          <CardTitle className="text-headline">ZITF Grounds Map</CardTitle>
          <CardDescription>
            Interactive overview of halls, stands, and exhibitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OverviewMapWrapper
            halls={mapData.halls.map((h: any) => ({
              id: h.id,
              name: h.name,
              geo_polygon: h.geo_polygon ?? null,
              geo_center: h.geo_center ?? null,
            }))}
            stands={mapData.stands.map((s: any) => ({
              id: s.id,
              stand_number: s.stand_number,
              hall_id: s.hall_id,
              status: s.status,
              latitude: s.latitude ?? null,
              longitude: s.longitude ?? null,
              exhibitor_name: (s as any).exhibitors?.company_name ?? null,
            }))}
          />
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Visitor Engagement"
          description="Daily visitor activity over the past week"
        >
          <div className="flex h-[240px] items-center justify-center rounded-2xl bg-muted/40">
            <p className="text-footnote text-muted-foreground">
              No engagement data available yet
            </p>
          </div>
        </ChartCard>

        <ChartCard
          title="Leads by Exhibitor"
          description="Top exhibitors ranked by total leads captured"
        >
          <div className="flex h-[240px] items-center justify-center rounded-2xl bg-muted/40">
            <p className="text-footnote text-muted-foreground">
              No lead data available yet
            </p>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
