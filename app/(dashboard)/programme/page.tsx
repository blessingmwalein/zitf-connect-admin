import Link from "next/link";
import { Plus } from "lucide-react";
import { getAgendaSessions } from "@/services/agenda-session.service";
import { getHalls } from "@/services/hall.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { type AgendaSessionStatus } from "@/lib/constants";
import { ProgrammeClient, type AgendaSessionItem } from "./programme-client";

export default async function ProgrammePage() {
  let sessions: AgendaSessionItem[] = [];
  let halls: { id: string; name: string }[] = [];

  try {
    const [sessionsRes, hallsRes] = await Promise.all([getAgendaSessions(), getHalls()]);

    if (sessionsRes.data && sessionsRes.data.length > 0) {
      sessions = sessionsRes.data.map((e: any) => ({
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
      }));
    }

    if (hallsRes.data && hallsRes.data.length > 0) {
      halls = hallsRes.data.map((h: any) => ({ id: h.id, name: h.name }));
    }
  } catch {
    // Supabase query failed
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Programme" description="Schedule and manage conference sessions for the active event">
        <Link href="/programme/new">
          <Button>
            <Plus className="size-4" />
            Add Session
          </Button>
        </Link>
      </PageHeader>

      <ProgrammeClient sessions={sessions} halls={halls} />
    </div>
  );
}
