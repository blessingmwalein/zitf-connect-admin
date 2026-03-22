"use client";

import { useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { Clock, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EVENT_STATUS_CONFIG, type EventStatus } from "@/lib/constants";

interface ScheduleEvent {
  id: string;
  name: string;
  description: string;
  hall_name: string;
  start_time: string;
  end_time: string;
  status: EventStatus;
  speaker: string;
}

interface ScheduleViewProps {
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
}

export function ScheduleView({ events, onEventClick }: ScheduleViewProps) {
  const grouped = useMemo(() => {
    const groups: { date: Date; events: ScheduleEvent[] }[] = [];
    const sorted = [...events].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    for (const event of sorted) {
      const eventDate = new Date(event.start_time);
      const existing = groups.find((g) => isSameDay(g.date, eventDate));
      if (existing) {
        existing.events.push(event);
      } else {
        groups.push({ date: eventDate, events: [event] });
      }
    }

    return groups;
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
        <p className="text-headline text-muted-foreground">No events to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.date.toISOString()}>
          <div className="sticky top-0 z-10 mb-3 bg-background/95 backdrop-blur-sm py-1">
            <h3 className="text-headline font-semibold">
              {format(group.date, "EEEE, MMMM d, yyyy")}
            </h3>
          </div>

          <div className="space-y-2 ml-4 border-l-2 border-border pl-4">
            {group.events.map((event) => {
              const statusConfig = EVENT_STATUS_CONFIG[event.status];
              const startDate = new Date(event.start_time);
              const endDate = new Date(event.end_time);

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onEventClick?.(event)}
                  className="w-full text-left rounded-xl border p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-subheadline font-semibold truncate">
                          {event.name}
                        </h4>
                        <Badge className={cn("shrink-0 text-caption-2", statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="inline-flex items-center gap-1.5 text-caption-1 text-muted-foreground">
                          <Clock className="size-3" />
                          {format(startDate, "HH:mm")} &ndash; {format(endDate, "HH:mm")}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-caption-1 text-muted-foreground">
                          <MapPin className="size-3" />
                          {event.hall_name}
                        </span>
                        {event.speaker && (
                          <span className="inline-flex items-center gap-1.5 text-caption-1 text-muted-foreground">
                            <User className="size-3" />
                            {event.speaker}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-headline font-bold text-primary">
                        {format(startDate, "HH:mm")}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
