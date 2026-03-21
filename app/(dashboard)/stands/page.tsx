import { getStands } from "@/services/stand.service";
import { PageHeader } from "@/components/layout/page-header";
import { StandsClient } from "./stands-client";
import type { StandStatus } from "@/lib/constants";

export interface StandItem {
  id: string;
  stand_number: string;
  hall_id: string;
  hall_name: string;
  exhibitor_name: string | null;
  status: StandStatus;
  area_sqm: number;
  price: number;
}

export default async function StandsPage() {
  let stands: StandItem[] = [];
  try {
    const { data } = await getStands();
    if (data && data.length > 0) {
      stands = data.map((s: any) => ({
        id: s.id,
        stand_number: s.stand_number,
        hall_id: s.hall_id,
        hall_name: s.halls?.name ?? "Unknown",
        exhibitor_name: s.exhibitors?.company_name ?? null,
        status: s.status as StandStatus,
        area_sqm: s.area_sqm ?? 0,
        price: s.price ?? 0,
      }));
    }
  } catch {
    // Supabase query failed
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stands"
        description="View and manage exhibition stands across all halls"
      />
      <StandsClient stands={stands} />
    </div>
  );
}
