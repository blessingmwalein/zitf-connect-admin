"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveEventStore } from "@/stores/active-event.store";
import { getEvents } from "@/services/event.service";
import { DEFAULT_EVENT_ID } from "@/lib/app-config";
import type { Event } from "@/types/database.types";

/** Formats an event's start/end dates as a compact human range, e.g. "Aug 12 – Aug 16, 2026". */
function formatEventDateRange(event: Event) {
  const start = event.start_date ? new Date(event.start_date) : null;
  const end = event.end_date ? new Date(event.end_date) : null;
  const startValid = start && !Number.isNaN(start.getTime());
  const endValid = end && !Number.isNaN(end.getTime());

  if (!startValid && !endValid) return "Dates TBC";
  if (startValid && !endValid) return format(start as Date, "MMM d, yyyy");
  if (!startValid && endValid) return format(end as Date, "MMM d, yyyy");

  const sameDay = (start as Date).toDateString() === (end as Date).toDateString();
  if (sameDay) return format(start as Date, "MMM d, yyyy");

  const sameYear = (start as Date).getFullYear() === (end as Date).getFullYear();
  const startLabel = format(start as Date, sameYear ? "MMM d" : "MMM d, yyyy");
  const endLabel = format(end as Date, "MMM d, yyyy");
  return `${startLabel} – ${endLabel}`;
}

/**
 * Dropdown control letting admin staff pick which Event (fair/show edition)
 * they're currently working in. Reads/writes the shared `useActiveEventStore`
 * so other event-scoped surfaces can react to the selection.
 *
 * Self-contained: fetches its own event list on mount and takes no props.
 */
export function EventSwitcher() {
  const activeEvent = useActiveEventStore((s) => s.activeEvent);
  const activeEventId = useActiveEventStore((s) => s.activeEventId);
  const setActiveEvent = useActiveEventStore((s) => s.setActiveEvent);

  const [events, setEvents] = useState<Event[]>([]);
  const hasHydratedDefault = useRef(false);

  // Fetch the event list once on mount.
  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const { data } = await getEvents();
        if (!cancelled) setEvents(data ?? []);
      } catch {
        if (!cancelled) setEvents([]);
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  // One-time hydration: if nothing is selected yet but the persisted
  // activeEventId still points at the default bridging event, and that
  // event is present in the fetched list, populate the full record so the
  // trigger shows a real name instead of the "Select Event" fallback.
  useEffect(() => {
    if (hasHydratedDefault.current) return;
    if (activeEvent) {
      hasHydratedDefault.current = true;
      return;
    }
    if (events.length === 0) return;

    if (activeEventId === DEFAULT_EVENT_ID) {
      const defaultEvent = events.find((event) => event.id === DEFAULT_EVENT_ID);
      if (defaultEvent) setActiveEvent(defaultEvent);
    }
    hasHydratedDefault.current = true;
  }, [events, activeEvent, activeEventId, setActiveEvent]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 max-w-[220px] items-center gap-2 rounded-full border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <span className="truncate">{activeEvent?.name || "Select Event"}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-xl">
        <DropdownMenuLabel>Events</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {events.length === 0 ? (
          <div className="px-3 py-4 text-center text-footnote text-muted-foreground">
            No events available
          </div>
        ) : (
          events.map((event) => (
            <DropdownMenuItem
              key={event.id}
              className="flex flex-col items-start gap-0.5 py-2"
              onClick={() => setActiveEvent(event)}
            >
              <span className="text-sm font-medium text-foreground">
                {event.name}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                {formatEventDateRange(event)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
