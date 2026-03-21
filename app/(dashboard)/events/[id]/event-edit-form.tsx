"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { eventSchema, type EventFormData } from "@/lib/validators/event";
import { updateEvent as updateEventService } from "@/services/event.service";
import { getHalls } from "@/services/hall.service";
import { EVENT_STATUS_CONFIG, type EventStatus } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DateTimePicker } from "@/components/shared/date-time-picker";

const STATUS_OPTIONS: EventStatus[] = [
  "draft",
  "published",
  "cancelled",
  "completed",
];

interface EventData {
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

async function updateEvent(id: string, data: EventFormData) {
  const { error } = await updateEventService(id, data as any);
  if (error) throw error;
  return { success: true };
}

/** Converts an ISO datetime string to the datetime-local input format */
function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  // datetime-local expects "YYYY-MM-DDTHH:mm"
  return iso.slice(0, 16);
}

export function EventEditForm({ event }: { event: EventData | null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [halls, setHalls] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadHalls() {
      try {
        const { data } = await getHalls() as any;
        if (data) {
          setHalls(data.map((h: any) => ({ id: h.id, name: h.name })));
        }
      } catch {
        // Failed to load halls
      }
    }
    loadHalls();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: event
      ? {
          name: event.name,
          description: event.description,
          hall_id: event.hall_id,
          start_time: toDatetimeLocal(event.start_time),
          end_time: toDatetimeLocal(event.end_time),
          status: event.status,
          speaker: event.speaker,
          capacity: event.capacity,
        }
      : {
          name: "",
          description: "",
          hall_id: "",
          start_time: "",
          end_time: "",
          status: "draft",
          speaker: "",
          capacity: undefined,
        },
  });

  const currentStatus = watch("status");
  const currentHallId = watch("hall_id");

  async function onSubmit(data: EventFormData) {
    if (!event) return;
    setIsSubmitting(true);
    try {
      await updateEvent(event.id, data);
      toast.success("Event updated successfully");
      router.push("/events");
    } catch {
      toast.error("Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <PageHeader title="Event Not Found">
          <Link href="/events">
            <Button variant="outline">
              <ArrowLeft className="size-4" />
              Back to Events
            </Button>
          </Link>
        </PageHeader>
        <p className="text-muted-foreground">
          The requested event could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Event"
        description={`Editing "${event.name}"`}
      >
        <Link href="/events">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
      </PageHeader>

      <Card className="ios-card mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-headline">Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                placeholder="e.g. Opening Ceremony"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-caption-1 text-ios-red">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the event, its purpose, and agenda..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-caption-1 text-ios-red">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Hall */}
              <div className="space-y-2">
                <Label htmlFor="hall_id">Hall</Label>
                <Select
                  value={currentHallId ?? ""}
                  onValueChange={(val) =>
                    setValue("hall_id", val as string, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a hall" />
                  </SelectTrigger>
                  <SelectContent>
                    {halls.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.hall_id && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.hall_id.message}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={currentStatus ?? "draft"}
                  onValueChange={(val) =>
                    setValue("status", val as EventStatus, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {EVENT_STATUS_CONFIG[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <DateTimePicker
                  id="start_time"
                  value={watch("start_time")}
                  onChange={(val) =>
                    setValue("start_time", val, { shouldValidate: true })
                  }
                  placeholder="Select start time"
                />
                {errors.start_time && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.start_time.message}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <DateTimePicker
                  id="end_time"
                  value={watch("end_time")}
                  onChange={(val) =>
                    setValue("end_time", val, { shouldValidate: true })
                  }
                  placeholder="Select end time"
                />
                {errors.end_time && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.end_time.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Speaker */}
              <div className="space-y-2">
                <Label htmlFor="speaker">Speaker</Label>
                <Input
                  id="speaker"
                  placeholder="e.g. Dr. Tendai Moyo"
                  {...register("speaker")}
                />
                {errors.speaker && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.speaker.message}
                  </p>
                )}
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={0}
                  placeholder="e.g. 300"
                  {...register("capacity")}
                />
                {errors.capacity && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.capacity.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Link href="/events">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Saving...</> : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
