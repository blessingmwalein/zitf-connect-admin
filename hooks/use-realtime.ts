"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type TableName = "stands" | "events" | "leads" | "engagement_logs";
type EventType = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeOptions<T extends { [key: string]: unknown }> {
  table: TableName;
  event?: EventType;
  filter?: string;
  onPayload: (payload: RealtimePostgresChangesPayload<T>) => void;
}

export function useRealtime<T extends { [key: string]: unknown }>({
  table,
  event = "*",
  filter,
  onPayload,
}: UseRealtimeOptions<T>) {
  useEffect(() => {
    const supabase = createClient();

    const channelConfig: Record<string, unknown> = {
      event,
      schema: "public",
      table,
    };
    if (filter) channelConfig.filter = filter;

    const channel = supabase
      .channel(`realtime-${table}-${filter ?? "all"}`)
      .on(
        "postgres_changes" as never,
        channelConfig as never,
        onPayload as never
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, event, filter]);
}
