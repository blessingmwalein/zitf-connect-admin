import { notFound } from "next/navigation";
import { EventEditForm } from "./event-edit-form";
import { getEventById } from "@/services/event.service";
import type { Event } from "@/types/database.types";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let event: Event | null = null;

  try {
    const { data } = await getEventById(id);
    if (data) event = data;
  } catch {
    // Supabase query failed
  }

  if (!event) {
    notFound();
  }

  return <EventEditForm event={event} />;
}
