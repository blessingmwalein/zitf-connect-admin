"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Clock, MapPin, User, Users, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { EVENT_STATUS_CONFIG, type EventStatus } from "@/lib/constants";

export interface EventItem {
  id: string;
  name: string;
  description: string;
  hall_id: string;
  hall_name: string;
  start_time: string;
  end_time: string;
  status: EventStatus;
  speaker: string;
  capacity: number;
}

interface EventsClientProps {
  events: EventItem[];
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

const STATUS_DOT_COLORS: Record<EventStatus, string> = {
  draft: "bg-muted-foreground",
  published: "bg-ios-green",
  cancelled: "bg-ios-red",
  completed: "bg-ios-blue",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EventsClient({ events }: EventsClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;
      const matchesSearch =
        search.trim() === "" ||
        event.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [events, statusFilter, search]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad start with days from previous month so the grid starts on Sunday
    const startDow = monthStart.getDay();
    const paddedStart: (Date | null)[] = Array.from(
      { length: startDow },
      () => null
    );

    return [...paddedStart, ...days];
  }, [calendarMonth]);

  const eventsForDay = useMemo(() => {
    if (!selectedDay) return [];
    return filteredEvents.filter((event) =>
      isSameDay(new Date(event.start_time), selectedDay)
    );
  }, [filteredEvents, selectedDay]);

  function getEventsOnDay(day: Date) {
    return filteredEvents.filter((event) =>
      isSameDay(new Date(event.start_time), day)
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
        <p className="text-headline text-muted-foreground">No events found</p>
        <p className="mt-1 text-footnote text-muted-foreground">
          Create your first event to get started.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="grid">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <TabsList>
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value ?? "all")}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-[220px]"
          />
        </div>
      </div>

      {/* Grid View */}
      <TabsContent value="grid">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
            <p className="text-headline text-muted-foreground">
              No events match your filters
            </p>
            <p className="mt-1 text-footnote text-muted-foreground">
              Try adjusting your search or status filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Calendar View */}
      <TabsContent value="calendar">
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-headline font-semibold">
              {format(calendarMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-caption-1 font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayEvents = getEventsOnDay(day);
              const isCurrentMonth = isSameMonth(day, calendarMonth);
              const today = isToday(day);
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() =>
                    setSelectedDay((prev) =>
                      prev && isSameDay(prev, day) ? null : day
                    )
                  }
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 rounded-xl border p-1.5 text-sm transition-colors hover:bg-accent",
                    "aspect-square",
                    !isCurrentMonth && "opacity-40",
                    today && "border-primary bg-primary/5 font-semibold",
                    isSelected && "border-primary bg-primary/10 ring-1 ring-primary"
                  )}
                >
                  <span className={cn("text-footnote", today && "text-primary")}>
                    {format(day, "d")}
                  </span>

                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className={cn(
                            "size-1.5 rounded-full",
                            STATUS_DOT_COLORS[event.status]
                          )}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] leading-none text-muted-foreground">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day events */}
          {selectedDay && (
            <div className="space-y-3 pt-2">
              <Separator />
              <h3 className="text-subheadline font-semibold">
                Events on {format(selectedDay, "EEEE, MMMM d, yyyy")}
              </h3>
              {eventsForDay.length === 0 ? (
                <p className="text-footnote text-muted-foreground">
                  No events on this day.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {eventsForDay.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const statusConfig = EVENT_STATUS_CONFIG[event.status];
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

  return (
    <Link href={`/events/${event.id}`} className="group">
      <Card className="ios-card transition-shadow hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-headline line-clamp-1">
              {event.name}
            </CardTitle>
            <Badge
              className={cn("shrink-0 text-caption-2", statusConfig.color)}
            >
              {statusConfig.label}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2 text-footnote">
            {event.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Separator className="mb-4" />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-footnote text-muted-foreground">
              <Clock className="size-3.5 shrink-0" />
              <span>
                {format(startDate, "MMM d, yyyy")} &middot;{" "}
                {format(startDate, "HH:mm")} &ndash;{" "}
                {format(endDate, "HH:mm")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-footnote text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span>{event.hall_name}</span>
            </div>
            {event.speaker && (
              <div className="flex items-center gap-2 text-footnote text-muted-foreground">
                <User className="size-3.5 shrink-0" />
                <span>{event.speaker}</span>
              </div>
            )}
            {event.capacity > 0 && (
              <div className="flex items-center gap-2 text-footnote text-muted-foreground">
                <Users className="size-3.5 shrink-0" />
                <span>Capacity: {event.capacity}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
