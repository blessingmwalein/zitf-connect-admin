"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, User, UserPlus, UserX } from "lucide-react";
import Link from "next/link";

import { standSchema, type StandFormData } from "@/lib/validators/stand";
import { updateStand as updateStandService, getStandById, assignExhibitorToStand, unassignStand } from "@/services/stand.service";
import { getHalls } from "@/services/hall.service";
import { getHallById } from "@/services/hall.service";
import { getExhibitorsList } from "@/services/exhibitor.service";
import {
  STAND_STATUS_CONFIG,
  type StandStatus,
} from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,

} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StandMapSection } from "./stand-map-section";
import type { GeoPoint } from "@/types/database.types";

const STATUS_OPTIONS: StandStatus[] = [
  "available",
  "reserved",
  "booked",
  "unavailable",
];

interface StandData {
  id: string;
  stand_number: string;
  hall_id: string;
  hall_name: string;
  status: StandStatus;
  area_sqm: number;
  price: number;
  notes: string;
  exhibitor_id: string | null;
  exhibitor_name: string | null;
  geo_polygon: GeoPoint[] | null;
  hall_geo_polygon: GeoPoint[] | null;
}

async function updateStand(id: string, data: StandFormData) {
  const { error } = await updateStandService(id, data as any);
  if (error) throw error;
  return { success: true };
}

export default function StandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stand, setStand] = useState<StandData | null>(null);
  const [halls, setHalls] = useState<{ id: string; name: string }[]>([]);
  const [exhibitors, setExhibitors] = useState<{ id: string; company_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  async function loadData() {
    try {
      const [standRes, hallsRes, exhRes] = await Promise.all([
        getStandById(id),
        getHalls(),
        getExhibitorsList(),
      ]) as [any, any, any];

      let hallGeoPolygon: GeoPoint[] | null = null;
      if (standRes.data) {
        const s = standRes.data;
        try {
          const hallRes = await getHallById(s.hall_id) as any;
          if (hallRes.data?.geo_polygon) {
            hallGeoPolygon = hallRes.data.geo_polygon;
          }
        } catch {
          // Hall geo data unavailable
        }
        setStand({
          id: s.id,
          stand_number: s.stand_number,
          hall_id: s.hall_id,
          hall_name: s.halls?.name ?? "Unknown",
          status: s.status as StandStatus,
          area_sqm: s.area_sqm ?? 0,
          price: s.price ?? 0,
          notes: s.notes ?? "",
          exhibitor_id: s.exhibitor_id ?? null,
          exhibitor_name: s.exhibitors?.company_name ?? null,
          geo_polygon: s.geo_polygon ?? null,
          hall_geo_polygon: hallGeoPolygon,
        });
      }
      if (hallsRes.data) {
        setHalls(hallsRes.data.map((h: any) => ({ id: h.id, name: h.name })));
      }
      if (exhRes.data) {
        setExhibitors(exhRes.data);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAssignExhibitor(exhibitorId: string) {
    if (!stand) return;
    setAssigning(true);
    try {
      const result = await assignExhibitorToStand(stand.id, exhibitorId) as any;
      if (result.error) {
        toast.error("Failed to assign exhibitor", { description: result.error.message });
      } else {
        toast.success("Exhibitor assigned");
        // Reload data to reflect changes
        setLoading(true);
        await loadData();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassignExhibitor() {
    if (!stand) return;
    setAssigning(true);
    try {
      const result = await unassignStand(stand.id) as any;
      if (result.error) {
        toast.error("Failed to unassign exhibitor", { description: result.error.message });
      } else {
        toast.success("Exhibitor unassigned");
        setLoading(true);
        await loadData();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAssigning(false);
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StandFormData>({
    resolver: zodResolver(standSchema) as any,
    values: stand
      ? {
          stand_number: stand.stand_number,
          hall_id: stand.hall_id,
          status: stand.status,
          area_sqm: stand.area_sqm,
          price: stand.price,
          notes: stand.notes,
        }
      : undefined,
  });

  const currentStatus = watch("status") as StandStatus | undefined;
  const currentHallId = watch("hall_id");

  async function onSubmit(data: StandFormData) {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateStand(id, data);
      toast.success("Stand updated successfully");
      router.push("/stands");
    } catch {
      toast.error("Failed to update stand");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!stand) {
    return (
      <div className="space-y-6">
        <PageHeader title="Stand Not Found">
          <Link href="/stands">
            <Button variant="outline">
              <ArrowLeft className="size-4" />
              Back to Stands
            </Button>
          </Link>
        </PageHeader>
        <p className="text-muted-foreground">
          The requested stand could not be found.
        </p>
      </div>
    );
  }

  const statusConfig = currentStatus
    ? STAND_STATUS_CONFIG[currentStatus]
    : STAND_STATUS_CONFIG[stand.status];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Stand ${stand.stand_number}`}
        description={stand.hall_name}
      >
        <Link href="/stands">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Form */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="ios-card">
            <CardHeader>
              <CardTitle className="text-headline">Stand Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Stand Number */}
                  <div className="space-y-2">
                    <Label htmlFor="stand_number">Stand Number</Label>
                    <Input
                      id="stand_number"
                      placeholder="e.g. A-01"
                      {...register("stand_number")}
                      aria-invalid={!!errors.stand_number}
                    />
                    {errors.stand_number && (
                      <p className="text-caption-1 text-ios-red">
                        {errors.stand_number.message}
                      </p>
                    )}
                  </div>

                  {/* Hall Select */}
                  <div className="space-y-2">
                    <Label htmlFor="hall_id">Hall</Label>
                    <Select
                      value={currentHallId}
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
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={currentStatus ?? stand.status}
                      onValueChange={(val) =>
                        setValue("status", val as StandStatus, {
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
                            {STAND_STATUS_CONFIG[s].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Area */}
                  <div className="space-y-2">
                    <Label htmlFor="area_sqm">Area (m&sup2;)</Label>
                    <Input
                      id="area_sqm"
                      type="number"
                      min={0}
                      step="0.1"
                      placeholder="e.g. 24"
                      {...register("area_sqm")}
                    />
                    {errors.area_sqm && (
                      <p className="text-caption-1 text-ios-red">
                        {errors.area_sqm.message}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="e.g. 4800"
                      {...register("price")}
                    />
                    {errors.price && (
                      <p className="text-caption-1 text-ios-red">
                        {errors.price.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about this stand..."
                    {...register("notes")}
                  />
                </div>

                <Separator />

                <div className="flex justify-end gap-3">
                  <Link href="/stands">
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

        {/* Right column - Info sidebar */}
        <div className="space-y-6">
          {/* Assigned Exhibitor */}
          <Card className="ios-card">
            <CardHeader>
              <CardTitle className="text-headline">Exhibitor</CardTitle>
            </CardHeader>
            <CardContent>
              {stand.exhibitor_name ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ios-blue/10">
                      <User className="size-5 text-ios-blue" />
                    </div>
                    <div className="flex-1">
                      <Link href={`/exhibitors/${stand.exhibitor_id}`} className="text-subheadline font-medium hover:underline">
                        {stand.exhibitor_name}
                      </Link>
                      <Badge className={cn("mt-1 text-caption-2", statusConfig.color)}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-destructive hover:text-destructive"
                    onClick={handleUnassignExhibitor}
                    disabled={assigning}
                  >
                    {assigning ? <Loader2 className="size-3.5 animate-spin" /> : <UserX className="size-3.5" />}
                    Unassign Exhibitor
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col items-center py-2 text-center">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                      <User className="size-5 text-muted-foreground" />
                    </div>
                    <p className="text-footnote text-muted-foreground">
                      Unassigned
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-caption-1">Assign Exhibitor</Label>
                    <Select
                      value=""
                      onValueChange={(val) => val && handleAssignExhibitor(val)}
                      disabled={assigning}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={assigning ? "Assigning..." : "Select exhibitor"} />
                      </SelectTrigger>
                      <SelectContent>
                        {exhibitors.map((ex) => (
                          <SelectItem key={ex.id} value={ex.id}>
                            {ex.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stand Map — polygon editor */}
          <StandMapSection
            standId={stand.id}
            standGeoPolygon={stand.geo_polygon}
            hallGeoPolygon={stand.hall_geo_polygon}
          />
        </div>
      </div>
    </div>
  );
}
