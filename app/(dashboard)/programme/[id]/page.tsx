import { notFound } from "next/navigation";
import { AgendaSessionEditForm } from "./agenda-session-edit-form";
import { getAgendaSessionById } from "@/services/agenda-session.service";

import type { AgendaSessionStatus } from "@/lib/constants";

export default async function AgendaSessionDetailPage({
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
    status: AgendaSessionStatus;
    speaker: string;
    capacity: number;
  } | null = null;

  try {
    const { data } = await getAgendaSessionById(id);
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
        status: e.status as AgendaSessionStatus,
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

  return <AgendaSessionEditForm event={event} />;
}
