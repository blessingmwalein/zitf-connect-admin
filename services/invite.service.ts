"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { DEFAULT_EVENT_ID } from "@/lib/app-config";

// NOTE: exhibitors.status is kept in sync with event_exhibitors.application_status
// during the multi-event migration transition — the Exhibitors list page still
// filters/displays the old flat column, while event_exhibitors is the real
// per-event source of truth going forward. Once that page is migrated to read
// application_status directly (Phase 2 frontend cutover), the writes to
// exhibitors.status here can be dropped.

export async function approveExhibitor(exhibitorId: string, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("exhibitors")
    .update({ status: "approved" } as never)
    .eq("id", exhibitorId);

  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("event_exhibitors")
    .upsert(
      { event_id: eventId, exhibitor_id: exhibitorId, application_status: "approved", approved_at: new Date().toISOString() } as never,
      { onConflict: "event_id,exhibitor_id" }
    );

  revalidatePath("/exhibitors");
  return { success: true };
}

export async function rejectExhibitor(exhibitorId: string, reason?: string, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status: "rejected" };
  if (reason) {
    updateData.notes = reason;
  }

  const { error } = await supabase
    .from("exhibitors")
    .update(updateData as never)
    .eq("id", exhibitorId);

  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("event_exhibitors")
    .upsert(
      { event_id: eventId, exhibitor_id: exhibitorId, application_status: "rejected", notes: reason } as never,
      { onConflict: "event_id,exhibitor_id" }
    );

  revalidatePath("/exhibitors");
  return { success: true };
}

// TODO: Enable invite functionality once SUPABASE_SERVICE_ROLE_KEY is configured
// import { createAdminClient } from "@/lib/supabase/admin";
// export async function inviteExhibitor(exhibitorId: string, email: string) { ... }
// export async function resendInvite(exhibitorId: string) { ... }
