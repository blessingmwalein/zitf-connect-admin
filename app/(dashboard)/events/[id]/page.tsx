import { notFound } from "next/navigation";
import { EventEditForm } from "./event-edit-form";
import { getEventById } from "@/services/event.service";

import type { EventStatus } from "@/lib/constants";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let event: {
    id: string;
    name: string;
    description: string;
    hall_id: string;
    hall_name: string;
    start_time: string;
    end_time: string;
    status: EventStatus;
    speaker: string;
    capacity: number;
  } | null = null;

  try {
    const { data } = await getEventById(id);
    if (data) {
      const e = data as any;
      event = {
        id: e.id,
        name: e.name,
        description: e.description ?? "",
        hall_id: e.hall_id ?? "",
        hall_name: e.halls?.name ?? "TBD",
        start_time: e.start_time,
        end_time: e.end_time,
        status: e.status as EventStatus,
        speaker: e.speaker ?? "",
        capacity: e.capacity ?? 0,
      };
    }
  } catch {
    // Supabase query failed
  }

  if (!event) {
    notFound();
  }

  return <EventEditForm event={event} />;
}
