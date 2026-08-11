"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { eventSchema, type EventFormData } from "@/lib/validators/event";
import { createEvent } from "@/services/event.service";
import { getVenues } from "@/services/venue.service";
import { uploadEventLogo, uploadEventCoverImage } from "@/services/upload.service";
import type { EventLifecycleStatus } from "@/types/database.types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/shared/date-time-picker";
import { FileUpload } from "@/components/shared/file-upload";

const STATUS_OPTIONS: { value: EventLifecycleStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "archived", label: "Archived" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadVenues() {
      try {
        const { data } = await getVenues();
        if (data) {
          setVenues(data.map((v: any) => ({ id: v.id, name: v.name })));
        }
      } catch {
        // Failed to load venues
      }
    }
    loadVenues();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      venue_id: "",
      start_date: "",
      end_date: "",
      status: "draft",
      country: "",
      city: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
      cover_image_url: "",
      logo_url: "",
      order_prefix: "EVT",
    },
  });

  const currentStatus = watch("status");
  const currentVenueId = watch("venue_id");

  async function handleLogoUpload(file: File) {
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url, error } = await uploadEventLogo(formData);
      if (error || !url) {
        toast.error("Failed to upload logo", { description: error ?? undefined });
        return;
      }
      setValue("logo_url", url, { shouldValidate: true });
      setLogoPreview(url);
      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  function handleLogoRemove() {
    setValue("logo_url", "", { shouldValidate: true });
    setLogoPreview(null);
  }

  async function handleCoverUpload(file: File) {
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url, error } = await uploadEventCoverImage(formData);
      if (error || !url) {
        toast.error("Failed to upload cover image", { description: error ?? undefined });
        return;
      }
      setValue("cover_image_url", url, { shouldValidate: true });
      setCoverPreview(url);
      toast.success("Cover image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploadingCover(false);
    }
  }

  function handleCoverRemove() {
    setValue("cover_image_url", "", { shouldValidate: true });
    setCoverPreview(null);
  }

  async function onSubmit(data: EventFormData) {
    setIsSubmitting(true);
    try {
      const { error } = await createEvent(data as any);
      if (error) throw error;
      toast.success("Event created successfully");
      router.push("/events");
    } catch {
      toast.error("Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add Event" description="Create a new fair/show edition">
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
                placeholder="e.g. Zimbabwe Agricultural Show 2026"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-caption-1 text-ios-red">{errors.name.message}</p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="e.g. zim-agri-show-2026"
                {...register("slug")}
                aria-invalid={!!errors.slug}
              />
              {errors.slug && (
                <p className="text-caption-1 text-ios-red">{errors.slug.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this event edition..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-caption-1 text-ios-red">
                  {errors.description.message}
                </p>
              )}
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <DateTimePicker
                  id="start_date"
                  includeTime={false}
                  value={watch("start_date")}
                  onChange={(val) =>
                    setValue("start_date", val, { shouldValidate: true })
                  }
                  placeholder="Pick start date"
                />
                {errors.start_date && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.start_date.message}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <DateTimePicker
                  id="end_date"
                  includeTime={false}
                  value={watch("end_date")}
                  onChange={(val) =>
                    setValue("end_date", val, { shouldValidate: true })
                  }
                  placeholder="Pick end date"
                />
                {errors.end_date && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.end_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={currentStatus ?? "draft"}
                onValueChange={(val) =>
                  setValue("status", val as EventLifecycleStatus, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Venue */}
              <div className="space-y-2">
                <Label htmlFor="venue_id">Venue</Label>
                <Select
                  value={currentVenueId ?? ""}
                  onValueChange={(val) =>
                    setValue("venue_id", val as string, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No venue assigned</SelectItem>
                    {venues.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.venue_id && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.venue_id.message}
                  </p>
                )}
              </div>

              {/* Order Prefix */}
              <div className="space-y-2">
                <Label htmlFor="order_prefix">Order Prefix</Label>
                <Input id="order_prefix" placeholder="EVT" {...register("order_prefix")} />
                {errors.order_prefix && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.order_prefix.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" placeholder="e.g. Zimbabwe" {...register("country")} />
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="e.g. Bulawayo" {...register("city")} />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Street address" {...register("address")} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Latitude */}
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g. -20.15"
                  {...register("latitude")}
                />
                {errors.latitude && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.latitude.message}
                  </p>
                )}
              </div>

              {/* Longitude */}
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="e.g. 28.58"
                  {...register("longitude")}
                />
                {errors.longitude && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.longitude.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <FileUpload
                  accept="image/*"
                  maxSizeMB={4}
                  preview={coverPreview}
                  onFileSelect={handleCoverUpload}
                  onRemove={handleCoverRemove}
                  label={isUploadingCover ? "Uploading..." : "Upload cover image"}
                />
                {errors.cover_image_url && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.cover_image_url.message}
                  </p>
                )}
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <FileUpload
                  accept="image/*"
                  maxSizeMB={2}
                  preview={logoPreview}
                  onFileSelect={handleLogoUpload}
                  onRemove={handleLogoRemove}
                  label={isUploadingLogo ? "Uploading..." : "Upload logo"}
                />
                {errors.logo_url && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.logo_url.message}
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
              <Button
                type="submit"
                disabled={isSubmitting || isUploadingLogo || isUploadingCover}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
