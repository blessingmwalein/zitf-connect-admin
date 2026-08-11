"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_EVENT_ID } from "@/lib/app-config";
import type { Event } from "@/types/database.types";

interface ActiveEventState {
  activeEventId: string;
  activeEvent: Event | null;
  setActiveEvent: (event: Event | null) => void;
}

/**
 * Holds which Event (fair edition) the admin is currently working in.
 * Defaults to DEFAULT_EVENT_ID (the synthetic backfill event) until the
 * event-switcher UI lets an admin pick a different one — see the
 * "Multi-event architecture refactor" plan.
 */
export const useActiveEventStore = create<ActiveEventState>()(
  persist(
    (set) => ({
      activeEventId: DEFAULT_EVENT_ID,
      activeEvent: null,
      setActiveEvent: (event) =>
        set({
          activeEvent: event,
          activeEventId: event?.id ?? DEFAULT_EVENT_ID,
        }),
    }),
    {
      name: "zitf-active-event",
    }
  )
);
