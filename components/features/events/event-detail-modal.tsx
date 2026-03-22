"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Clock, MapPin, User, Users, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EVENT_STATUS_CONFIG, type EventStatus } from "@/lib/constants";

interface EventDetailModalProps {
  event: {
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
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailModal({ event, open, onOpenChange }: EventDetailModalProps) {
  if (!event) return null;

  const statusConfig = EVENT_STATUS_CONFIG[event.status];
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-title-3 pr-4">{event.name}</DialogTitle>
            <Badge className={cn("shrink-0 text-caption-2", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        {event.description && (
          <p className="text-subheadline text-muted-foreground">
            {event.description}
          </p>
        )}

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Clock className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-subheadline font-medium">
                {format(startDate, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-caption-1 text-muted-foreground">
                {format(startDate, "HH:mm")} &ndash; {format(endDate, "HH:mm")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-blue/10">
              <MapPin className="size-4 text-ios-blue" />
            </div>
            <div>
              <p className="text-subheadline font-medium">{event.hall_name}</p>
              <p className="text-caption-1 text-muted-foreground">Hall</p>
            </div>
          </div>

          {event.speaker && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-green/10">
                <User className="size-4 text-ios-green" />
              </div>
              <div>
                <p className="text-subheadline font-medium">{event.speaker}</p>
                <p className="text-caption-1 text-muted-foreground">Speaker</p>
              </div>
            </div>
          )}

          {event.capacity > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ios-orange/10">
                <Users className="size-4 text-ios-orange" />
              </div>
              <div>
                <p className="text-subheadline font-medium">{event.capacity}</p>
                <p className="text-caption-1 text-muted-foreground">Capacity</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Link href={`/events/${event.id}`}>
            <Button className="gap-1.5">
              <Pencil className="size-4" />
              Edit
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
