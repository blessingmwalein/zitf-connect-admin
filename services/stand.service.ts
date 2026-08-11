"use server";

import { createClient } from "@/lib/supabase/server";
import type { StandInsert, StandUpdate } from "@/types/database.types";
import { revalidatePath } from "next/cache";
import { DEFAULT_EVENT_ID } from "@/lib/app-config";

// NOTE: stands.exhibitor_id/status were renamed to _deprecated_exhibitor_id/
// _deprecated_status during the multi-event migration (phase1c) — a stand's
// occupancy is now tracked per-event via stand_reservations/stand_assignments
// instead, since the same physical stand can have a different (or no)
// occupant each edition. Every function below that used to read/write those
// two columns directly now goes through the new tables, scoped by eventId.
// `stands.price` was renamed to `list_price` (a suggested default now, not
// authoritative — see stand_reservations.quoted_price/stand_assignments.agreed_price).

type StandOccupancy = {
  exhibitor_id: string | null;
  exhibitors: { id: string; company_name: string; logo_url: string | null } | null;
  status: "available" | "reserved" | "booked";
};

/**
 * Hydrates a flat exhibitor_id/exhibitors/status shape onto raw stand rows,
 * matching what every existing stand list/detail page already expects, so
 * this migration doesn't require touching every consumer at once. Backed by
 * two lookups against stand_assignments/stand_reservations rather than an
 * embedded-select filter, since the JS client's behavior for filtering
 * embedded resources isn't something to gamble on for a change this size.
 */
async function attachStandOccupancy<T extends { id: string }>(
  stands: T[],
  eventId: string
): Promise<(T & StandOccupancy)[]> {
  if (stands.length === 0) return [];

  const supabase = await createClient();
  const standIds = stands.map((s) => s.id);

  const [{ data: assignments }, { data: reservations }] = await Promise.all([
    supabase
      .from("stand_assignments")
      .select("stand_id, exhibitor_id, exhibitors(id, company_name, logo_url)")
      .eq("event_id", eventId)
      .eq("status", "active")
      .in("stand_id", standIds),
    supabase
      .from("stand_reservations")
      .select("stand_id, exhibitor_id, exhibitors(id, company_name, logo_url)")
      .eq("event_id", eventId)
      .in("status", ["pending", "confirmed"])
      .in("stand_id", standIds),
  ]);

  const assignmentByStand = new Map(
    (assignments ?? []).map((a: any) => [a.stand_id, a])
  );
  const reservationByStand = new Map(
    (reservations ?? []).map((r: any) => [r.stand_id, r])
  );

  return stands.map((s) => {
    const assignment = assignmentByStand.get(s.id);
    const reservation = reservationByStand.get(s.id);
    return {
      ...s,
      // Back-compat alias: every stands list/detail/form page reads/writes
      // `price` — keep serving it even though the column is now `list_price`.
      price: (s as { list_price?: number | null }).list_price ?? null,
      exhibitor_id: assignment?.exhibitor_id ?? reservation?.exhibitor_id ?? null,
      exhibitors: assignment?.exhibitors ?? reservation?.exhibitors ?? null,
      status: assignment ? "booked" : reservation ? "reserved" : "available",
    };
  });
}

export async function getStands(opts?: { hallId?: string; eventId?: string }) {
  const supabase = await createClient();
  const eventId = opts?.eventId ?? DEFAULT_EVENT_ID;
  let query = supabase
    .from("stands")
    .select("*, halls(name), stand_feature_assignments(id, quantity, stand_features(name))")
    .order("stand_number");

  if (opts?.hallId) query = query.eq("hall_id", opts.hallId);

  const { data, error } = await query;
  if (error || !data) return { data: null, error };
  return { data: await attachStandOccupancy(data, eventId), error: null };
}

export async function getStandsByHall(hallId: string, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stands")
    .select("*")
    .eq("hall_id", hallId)
    .order("stand_number");
  if (error || !data) return { data: null, error };
  return { data: await attachStandOccupancy(data, eventId), error: null };
}

export async function getStandById(id: string, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stands")
    .select("*, halls(name)")
    .eq("id", id)
    .single();
  if (error || !data) return { data, error };
  const [hydrated] = await attachStandOccupancy([data], eventId);
  return { data: hydrated, error: null };
}

/** Translates the form-facing `price` field to the real `list_price` column. */
function toListPrice<T extends { price?: number | null }>(data: T) {
  const { price, ...rest } = data;
  return price !== undefined ? { ...rest, list_price: price } : rest;
}

export async function createStand(data: StandInsert & { price?: number | null }) {
  const supabase = await createClient();
  const result = await supabase.from("stands").insert(toListPrice(data) as never).select().single();
  if (!result.error) revalidatePath("/stands");
  return result;
}

export async function updateStand(id: string, data: StandUpdate & { price?: number | null }) {
  const supabase = await createClient();
  const result = await supabase
    .from("stands")
    .update(toListPrice(data) as never)
    .eq("id", id)
    .select()
    .single();
  if (!result.error) revalidatePath("/stands");
  return result;
}

export async function deleteStand(id: string) {
  const supabase = await createClient();
  const result = await supabase.from("stands").delete().eq("id", id);
  if (!result.error) revalidatePath("/stands");
  return result;
}

/**
 * One-click admin action: assigns an exhibitor straight to a stand for the
 * given event, superseding any existing active assignment for that stand.
 * Registers the exhibitor into event_exhibitors first if needed (required
 * by stand_assignments' composite FK).
 */
export async function assignExhibitorToStand(
  standId: string,
  exhibitorId: string,
  eventId: string = DEFAULT_EVENT_ID
) {
  const supabase = await createClient();

  await supabase
    .from("event_exhibitors")
    .upsert(
      { event_id: eventId, exhibitor_id: exhibitorId } as never,
      { onConflict: "event_id,exhibitor_id", ignoreDuplicates: true }
    );

  await supabase
    .from("stand_assignments")
    .update({ status: "superseded", unassigned_at: new Date().toISOString() } as never)
    .eq("event_id", eventId)
    .eq("stand_id", standId)
    .eq("status", "active");

  const { data: stand } = await supabase
    .from("stands")
    .select("list_price")
    .eq("id", standId)
    .single();

  const result = await supabase
    .from("stand_assignments")
    .insert({
      event_id: eventId,
      stand_id: standId,
      exhibitor_id: exhibitorId,
      agreed_price: stand?.list_price ?? 0,
      status: "active",
    } as never)
    .select()
    .single();

  if (!result.error) {
    revalidatePath("/stands");
    revalidatePath("/exhibitors");
  }
  return result;
}

export async function unassignStand(standId: string, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();
  const result = await supabase
    .from("stand_assignments")
    .update({ status: "cancelled", unassigned_at: new Date().toISOString() } as never)
    .eq("event_id", eventId)
    .eq("stand_id", standId)
    .eq("status", "active")
    .select();
  if (!result.error) revalidatePath("/stands");
  return result;
}

/** Stands not yet placed in any hall at all — unrelated to exhibitor booking, unchanged. */
export async function getUnassignedStands() {
  const supabase = await createClient();
  return supabase
    .from("stands")
    .select("*, halls(name)")
    .is("hall_id", null)
    .order("stand_number");
}

export async function bulkAssignStandsToHall(standIds: string[], hallId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("stands")
    .update({ hall_id: hallId } as never)
    .in("id", standIds)
    .select();
  if (!result.error) {
    revalidatePath("/stands");
    revalidatePath("/halls");
  }
  return result;
}

export async function bulkCreateStands(stands: (StandInsert & { price?: number | null })[]) {
  const supabase = await createClient();
  const result = await supabase
    .from("stands")
    .insert(stands.map(toListPrice) as never[])
    .select();
  if (!result.error) revalidatePath("/stands");
  return result;
}

/** Stands with no active assignment/pending reservation for this event, plus any already held by currentExhibitorId. */
export async function getAvailableStands(
  currentExhibitorId?: string,
  eventId: string = DEFAULT_EVENT_ID
) {
  const supabase = await createClient();

  const [{ data: occupied }, { data: reserved }] = await Promise.all([
    supabase
      .from("stand_assignments")
      .select("stand_id")
      .eq("event_id", eventId)
      .eq("status", "active"),
    supabase
      .from("stand_reservations")
      .select("stand_id")
      .eq("event_id", eventId)
      .in("status", ["pending", "confirmed"]),
  ]);

  const occupiedIds = new Set([
    ...(occupied ?? []).map((r) => r.stand_id),
    ...(reserved ?? []).map((r) => r.stand_id),
  ]);

  const { data: allStands, error } = await supabase
    .from("stands")
    .select("id, stand_number, hall_id, halls(name)")
    .order("stand_number");
  if (error) return { data: null, error };

  const available = (allStands ?? []).filter((s) => !occupiedIds.has(s.id));

  if (currentExhibitorId) {
    const { data: assignedToThisExhibitor } = await supabase
      .from("stand_assignments")
      .select("stands(id, stand_number, hall_id, halls(name))")
      .eq("event_id", eventId)
      .eq("exhibitor_id", currentExhibitorId)
      .eq("status", "active");
    const assignedStands = (assignedToThisExhibitor ?? [])
      .map((a: any) => a.stands)
      .filter(Boolean);
    return { data: [...available, ...assignedStands], error: null };
  }

  return { data: available, error: null };
}

/**
 * Pending/confirmed-but-not-yet-assigned stand reservations, for the
 * approval queue (`applications-popover.tsx`). Returns a flat shape keyed by
 * the STAND's id — not the reservation's — since approveStand()/rejectStand()
 * take a stand id, matching the shape this used to have back when a stand's
 * own `status` column was the "application" record.
 */
export async function getPendingStandApplications(eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stand_reservations")
    .select("id, stand_id, quoted_price, exhibitors(id, company_name, logo_url), stands(id, stand_number, area_sqm, halls(name))")
    .eq("event_id", eventId)
    .in("status", ["pending", "confirmed"])
    .order("updated_at", { ascending: false });

  if (error || !data) return { data, error };

  return {
    data: data.map((r: any) => ({
      id: r.stand_id,
      reservation_id: r.id,
      stand_number: r.stands?.stand_number,
      area_sqm: r.stands?.area_sqm,
      price: r.quoted_price,
      halls: r.stands?.halls,
      exhibitors: r.exhibitors,
    })),
    error: null,
  };
}

/**
 * Approves the pending reservation for a stand: confirms the reservation,
 * creates the matching active assignment, and — if the exhibitor's overall
 * application was still 'applied' — bumps it to 'approved'. Still a
 * one-click admin action even though it now touches three tables.
 */
export async function approveStand(id: string, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();

  const { data: reservation } = await supabase
    .from("stand_reservations")
    .select("id, exhibitor_id, quoted_price")
    .eq("event_id", eventId)
    .eq("stand_id", id)
    .in("status", ["pending", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reservation) {
    return { data: null, error: { message: "No pending reservation found for this stand." } };
  }

  await supabase
    .from("stand_reservations")
    .update({ status: "confirmed" } as never)
    .eq("id", reservation.id);

  const result = await supabase
    .from("stand_assignments")
    .insert({
      event_id: eventId,
      stand_id: id,
      exhibitor_id: reservation.exhibitor_id,
      reservation_id: reservation.id,
      agreed_price: reservation.quoted_price,
      status: "active",
    } as never)
    .select()
    .single();

  if (!result.error) {
    await supabase
      .from("event_exhibitors")
      .update({ application_status: "approved", approved_at: new Date().toISOString() } as never)
      .eq("event_id", eventId)
      .eq("exhibitor_id", reservation.exhibitor_id)
      .eq("application_status", "applied");

    // Kept in sync with the old flat column too — see the note in
    // invite.service.ts about why both are written during the transition.
    await supabase
      .from("exhibitors")
      .update({ status: "approved" } as never)
      .eq("id", reservation.exhibitor_id)
      .eq("status", "pending");

    revalidatePath("/exhibitors");
    revalidatePath("/stands");
    revalidatePath(`/stands/${id}`);
  }
  return result;
}

export async function rejectStand(id: string, eventId: string = DEFAULT_EVENT_ID) {
  const supabase = await createClient();
  const result = await supabase
    .from("stand_reservations")
    .update({ status: "cancelled" } as never)
    .eq("event_id", eventId)
    .eq("stand_id", id)
    .in("status", ["pending", "confirmed"])
    .select();

  if (!result.error) {
    revalidatePath("/stands");
    revalidatePath(`/stands/${id}`);
  }
  return result;
}
