import Link from "next/link";
import { Plus } from "lucide-react";
import { getVenues } from "@/services/venue.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { VenuesClient } from "./venues-client";

interface VenueItem {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
}

export default async function VenuesPage() {
  let venues: VenueItem[] = [];
  try {
    const { data } = await getVenues();
    if (data && data.length > 0) {
      venues = data.map((v: any) => ({
        id: v.id,
        name: v.name,
        address: v.address ?? "",
        city: v.city ?? "",
        country: v.country ?? "",
        latitude: v.latitude,
        longitude: v.longitude,
        timezone: v.timezone,
      }));
    }
  } catch {
    // Supabase query failed
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Venues" description="Manage physical venue locations">
        <Link href="/venues/new">
          <Button>
            <Plus className="size-4" />
            Add Venue
          </Button>
        </Link>
      </PageHeader>

      <VenuesClient venues={venues} />
    </div>
  );
}
