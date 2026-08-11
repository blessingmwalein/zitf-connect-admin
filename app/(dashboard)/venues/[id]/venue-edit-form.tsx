"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

import { venueSchema, type VenueFormData } from "@/lib/validators/venue";
import { updateVenue, deleteVenue } from "@/services/venue.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface VenueData {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
}

export function VenueEditForm({ venue }: { venue: VenueData | null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema) as any,
    defaultValues: venue
      ? {
          name: venue.name,
          address: venue.address,
          city: venue.city,
          country: venue.country,
          latitude: venue.latitude ?? undefined,
          longitude: venue.longitude ?? undefined,
          timezone: venue.timezone,
        }
      : {
          name: "",
          address: "",
          city: "",
          country: "",
          latitude: undefined,
          longitude: undefined,
          timezone: "Africa/Harare",
        },
  });

  async function onSubmit(data: VenueFormData) {
    if (!venue) return;
    setIsSubmitting(true);
    try {
      const { error } = await updateVenue(venue.id, data as any);
      if (error) throw error;
      toast.success("Venue updated successfully");
      router.push("/venues");
    } catch {
      toast.error("Failed to update venue");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!venue) return;
    try {
      const result = await deleteVenue(venue.id);
      if (result.error) {
        toast.error("Failed to delete venue", { description: result.error.message });
        return;
      }
      toast.success("Venue deleted");
      router.push("/venues");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteOpen(false);
    }
  }

  if (!venue) {
    return (
      <div className="space-y-6">
        <PageHeader title="Venue Not Found">
          <Link href="/venues">
            <Button variant="outline">
              <ArrowLeft className="size-4" />
              Back to Venues
            </Button>
          </Link>
        </PageHeader>
        <p className="text-muted-foreground">
          The requested venue could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Venue" description={`Editing "${venue.name}"`}>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            className="gap-1.5"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
          <Link href="/venues">
            <Button variant="outline">
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </Link>
        </div>
      </PageHeader>

      <Card className="ios-card mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-headline">Venue Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Venue Name</Label>
              <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
              {errors.name && (
                <p className="text-caption-1 text-ios-red">{errors.name.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
              {errors.address && (
                <p className="text-caption-1 text-ios-red">{errors.address.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
                {errors.city && (
                  <p className="text-caption-1 text-ios-red">{errors.city.message}</p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register("country")} />
                {errors.country && (
                  <p className="text-caption-1 text-ios-red">{errors.country.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Latitude */}
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="any" {...register("latitude")} />
                {errors.latitude && (
                  <p className="text-caption-1 text-ios-red">{errors.latitude.message}</p>
                )}
              </div>

              {/* Longitude */}
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="any" {...register("longitude")} />
                {errors.longitude && (
                  <p className="text-caption-1 text-ios-red">{errors.longitude.message}</p>
                )}
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" {...register("timezone")} />
              {errors.timezone && (
                <p className="text-caption-1 text-ios-red">{errors.timezone.message}</p>
              )}
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Link href="/venues">
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

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Venue"
        description="Are you sure you want to delete this venue? Events referencing this venue may be affected."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
