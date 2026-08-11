import Link from "next/link";
import { Plus } from "lucide-react";
import { getEvents } from "@/services/event.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EventsClient } from "./events-client";
import type { Event } from "@/types/database.types";

export default async function EventsPage() {
  let events: Event[] = [];
  try {
    const { data } = await getEvents();
    if (data) events = data;
  } catch {
    // Supabase query failed
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Events" description="Manage fair/show editions">
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
