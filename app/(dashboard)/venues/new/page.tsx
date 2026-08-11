"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { venueSchema, type VenueFormData } from "@/lib/validators/venue";
import { createVenue } from "@/services/venue.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function NewVenuePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema) as any,
    defaultValues: {
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
    setIsSubmitting(true);
    try {
      const { error } = await createVenue(data as any);
      if (error) throw error;
      toast.success("Venue created successfully");
      router.push("/venues");
    } catch {
      toast.error("Failed to create venue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add Venue" description="Create a new physical venue location">
        <Link href="/venues">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
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
              <Input
                id="name"
                placeholder="e.g. Zimbabwe International Exhibition Centre"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-caption-1 text-ios-red">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="e.g. 100 Rotten Row"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-caption-1 text-ios-red">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="e.g. Bulawayo" {...register("city")} />
                {errors.city && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.city.message}
                  </p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" placeholder="e.g. Zimbabwe" {...register("country")} />
                {errors.country && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.country.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Latitude */}
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="e.g. -20.1325"
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
                  placeholder="e.g. 28.6265"
                  {...register("longitude")}
                />
                {errors.longitude && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.longitude.message}
                  </p>
                )}
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                placeholder="e.g. Africa/Harare"
                {...register("timezone")}
              />
              {errors.timezone && (
                <p className="text-caption-1 text-ios-red">
                  {errors.timezone.message}
                </p>
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
                {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Creating...</> : "Create Venue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
