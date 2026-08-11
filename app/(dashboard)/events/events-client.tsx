"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Search, CalendarDays, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Event, EventLifecycleStatus } from "@/types/database.types";

const EVENT_STATUS_CONFIG: Record<EventLifecycleStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  published: { label: "Published", color: "bg-ios-green/15 text-ios-green" },
  active: { label: "Active", color: "bg-ios-green/15 text-ios-green" },
  completed: { label: "Completed", color: "bg-ios-blue/15 text-ios-blue" },
  cancelled: { label: "Cancelled", color: "bg-muted text-ios-red" },
  archived: { label: "Archived", color: "bg-muted text-ios-red" },
};

function formatDateRange(start: string, end: string) {
  try {
    const startLabel = format(new Date(start), "MMM d, yyyy");
    const endLabel = format(new Date(end), "MMM d, yyyy");
    return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
  } catch {
    return `${start} - ${end}`;
  }
}

interface EventsClientProps {
  events: Event[];
}

export function EventsClient({ events }: EventsClientProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return events.filter((event) => event.name.toLowerCase().includes(query));
  }, [events, search]);

  return (
    <>
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <p className="text-headline text-muted-foreground">
            {events.length === 0
              ? "No events yet. Create your first event to get started."
              : "No events found"}
          </p>
          {events.length > 0 && (
            <p className="mt-1 text-footnote text-muted-foreground">
              Try adjusting your search.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => {
            const statusCfg = EVENT_STATUS_CONFIG[event.status];
            const location = [event.city, event.country].filter(Boolean).join(", ");

            return (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="ios-card h-full transition-shadow hover:shadow-lg">
                  {event.cover_image_url ? (
                    <img
                      src={event.cover_image_url}
                      alt={event.name}
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center bg-muted">
                      <CalendarDays className="size-10 text-muted-foreground" />
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-headline">{event.name}</CardTitle>
                      <Badge className={cn("shrink-0", statusCfg.color)}>
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <CardDescription className="text-footnote">
                      {formatDateRange(event.start_date, event.end_date)}
                    </CardDescription>
                  </CardHeader>

                  {location && (
                    <CardContent>
                      <div className="flex items-center gap-2 text-footnote text-muted-foreground">
                        <MapPin className="size-3.5" />
                        <span>{location}</span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
