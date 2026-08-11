import { notFound } from "next/navigation";
import { VenueEditForm } from "./venue-edit-form";
import { getVenueById } from "@/services/venue.service";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let venue: {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    timezone: string;
  } | null = null;

  try {
    const { data } = await getVenueById(id);
    if (data) {
      const v = data as any;
      venue = {
        id: v.id,
        name: v.name,
        address: v.address ?? "",
        city: v.city ?? "",
        country: v.country ?? "",
        latitude: v.latitude,
        longitude: v.longitude,
        timezone: v.timezone,
      };
    }
  } catch {
    // Supabase query failed
  }

  if (!venue) {
    notFound();
  }

  return <VenueEditForm venue={venue} />;
}
