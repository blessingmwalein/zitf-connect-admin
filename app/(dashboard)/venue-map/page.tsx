import { getGroundsMapData } from "@/services/map.service";
import { PageHeader } from "@/components/layout/page-header";
import { VenueMapClient } from "./venue-map-client";

export default async function VenueMapPage() {
  let halls: any[] = [];
  let stands: any[] = [];

  try {
    const data = await getGroundsMapData();
    halls = data.halls;
    stands = data.stands.map((s: any) => ({
      ...s,
      exhibitor_name: s.exhibitors?.company_name ?? null,
    }));
  } catch {
    // query failed
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Venue Map"
        description="Interactive map of the ZITF exhibition grounds"
      />
      <VenueMapClient halls={halls} stands={stands} />
    </div>
  );
}
