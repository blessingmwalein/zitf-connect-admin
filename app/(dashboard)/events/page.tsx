import Link from "next/link";
import { Plus } from "lucide-react";
import { getEvents } from "@/services/event.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { type EventStatus } from "@/lib/constants";
import { EventsClient, type EventItem } from "./events-client";

export default async function EventsPage() {
  let events: EventItem[] = [];
  try {
    const { data } = await getEvents();
    if (data && data.length > 0) {
      events = data.map((e: any) => ({
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
      }));
    }
  } catch {
    // Supabase query failed
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Events" description="Schedule and manage trade fair events">
        <Link href="/events/new">
          <Button>
            <Plus className="size-4" />
            Add Event
          </Button>
        </Link>
      </PageHeader>

      <EventsClient events={events} />
    </div>
  );
}
