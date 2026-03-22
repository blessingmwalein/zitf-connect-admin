"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { hallSchema, type HallFormData } from "@/lib/validators/hall";
import { getHallById, updateHall } from "@/services/hall.service";
import { getStands } from "@/services/stand.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HallPolygonEditor } from "@/components/maps/hall-polygon-editor";
import { BulkStandAssign } from "@/components/features/halls/bulk-stand-assign";
import type { GeoPoint } from "@/types/database.types";

export default function EditHallPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const hallId = params.id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hallName, setHallName] = useState("");
  const [polygon, setPolygon] = useState<GeoPoint[] | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<HallFormData>({
    resolver: zodResolver(hallSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      display_order: 0,
      capacity: undefined,
      is_active: true,
    },
  });

  const isActive = watch("is_active");

  useEffect(() => {
    async function load() {
      try {
        const result = await getHallById(hallId) as any;
        if (result?.data) {
          const h = result.data;
          setHallName(h.name);
          const geoPolygon = h.geo_polygon as GeoPoint[] | null;
          setPolygon(geoPolygon);
          reset({
            name: h.name,
            description: h.description ?? "",
            display_order: h.display_order,
            capacity: h.capacity ?? undefined,
            is_active: h.is_active,
            geo_polygon: geoPolygon ?? undefined,
            geo_center: (h.geo_center as GeoPoint) ?? undefined,
          });
        }
      } catch {
        toast.error("Failed to load hall");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hallId, reset]);

  function handlePolygonChange(coords: GeoPoint[]) {
    setPolygon(coords);
    setValue("geo_polygon", coords, { shouldValidate: true });
    if (coords.length > 0) {
      const center: GeoPoint = [
        coords.reduce((s, c) => s + c[0], 0) / coords.length,
        coords.reduce((s, c) => s + c[1], 0) / coords.length,
      ];
      setValue("geo_center", center, { shouldValidate: true });
    }
  }

  async function onSubmit(data: HallFormData) {
    setIsSubmitting(true);
    try {
      const { error } = await updateHall(hallId, data as any);
      if (error) throw error;
      toast.success("Hall updated successfully");
      router.push(`/halls/${hallId}`);
    } catch {
      toast.error("Failed to update hall");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${hallName}`}
        description="Update hall details, boundary, and stand assignments"
      >
        <Link href={`/halls/${hallId}`}>
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card className="ios-card">
          <CardHeader>
            <CardTitle className="text-headline">Hall Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Hall Name</Label>
                <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
                {errors.name && <p className="text-caption-1 text-ios-red">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input id="display_order" type="number" min={0} {...register("display_order")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" type="number" min={0} {...register("capacity")} />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active</Label>
                  <p className="text-caption-1 text-muted-foreground">
                    Inactive halls are hidden from exhibitors.
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(checked: boolean) =>
                    setValue("is_active", checked, { shouldValidate: true })
                  }
                />
              </div>

              <div className="flex justify-end gap-3">
                <Link href={`/halls/${hallId}`}>
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Saving...</> : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="ios-card">
          <CardHeader>
            <CardTitle className="text-headline">Hall Boundary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] lg:h-[500px]">
              <HallPolygonEditor
                polygon={polygon}
                onChange={handlePolygonChange}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Stand Assignment */}
      <BulkStandAssign hallId={hallId} hallName={hallName} />
    </div>
  );
}
