"use server";

import { createClient } from "@/lib/supabase/server";

export async function getGroundsMapData() {
  const supabase = await createClient();

  const [hallsRes, standsRes] = await Promise.all([
    supabase
      .from("halls")
      .select("id, name, geo_polygon, geo_center, is_active")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("stands")
      .select(
        "id, stand_number, hall_id, status, geo_polygon, latitude, longitude, exhibitor_id, exhibitors(id, company_name)"
      )
      .order("stand_number"),
  ]);

  return {
    halls: hallsRes.data ?? [],
    stands: standsRes.data ?? [],
    error: hallsRes.error || standsRes.error,
  };
}
