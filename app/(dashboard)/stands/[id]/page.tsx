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
import { getHalls, getHallById } from "@/services/hall.service";
import { getExhibitorsList } from "@/services/exhibitor.service";
import {
  getActiveStandFeatures,
  getFeaturesByStandId,
  assignFeatureToStand,
  removeFeatureFromStand,
  updateFeatureAssignment,
} from "@/services/stand-feature.service";
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
  Puzzle,
  Plus,
  Trash2,
  Minus,
  DollarSign,
  PlusCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
  const [assignedFeatures, setAssignedFeatures] = useState<any[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<any[]>([]);
  const [isFeaturesLoading, setIsFeaturesLoading] = useState(false);
  const [featureToAdd, setFeatureToAdd] = useState<any | null>(null);

  async function loadStandFeatures() {
    setIsFeaturesLoading(true);
    try {
      const [assignedRes, availableRes] = await Promise.all([
        getFeaturesByStandId(id),
        getActiveStandFeatures(),
      ]);
      setAssignedFeatures(assignedRes.data || []);
      setAvailableFeatures(availableRes.data || []);
    } catch {
      // Silently fail features
    } finally {
      setIsFeaturesLoading(false);
    }
  }

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
      
      // Load features after core stand data
      await loadStandFeatures();
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

  async function handleAddFeature(featureId: string) {
    const feature = availableFeatures.find(f => f.id === featureId);
    if (!feature) return;
    setFeatureToAdd(feature);
  }

  async function confirmAddFeature() {
    if (!featureToAdd) return;
    try {
      const { error } = await assignFeatureToStand({
        stand_id: id,
        feature_id: featureToAdd.id,
        custom_price: featureToAdd.default_price,
        quantity: 1
      });
      if (error) throw error;
      toast.success(`${featureToAdd.name} added`);
      await loadStandFeatures();
    } catch (err: any) {
      toast.error("Failed to add feature", { description: err.message });
    } finally {
      setFeatureToAdd(null);
    }
  }

  async function handleRemoveFeature(assignmentId: string) {
    try {
      const { error } = await removeFeatureFromStand(assignmentId);
      if (error) throw error;
      toast.success("Feature removed");
      await loadStandFeatures();
    } catch (err: any) {
      toast.error("Failed to remove feature", { description: err.message });
    }
  }

  async function handleUpdateFeature(assignmentId: string, quantity: number, customPrice?: number) {
    if (quantity < 1) return;
    try {
      const { error } = await updateFeatureAssignment(assignmentId, {
        quantity,
        ...(customPrice !== undefined ? { custom_price: customPrice } : {})
      });
      if (error) throw error;
      await loadStandFeatures();
    } catch (err: any) {
      toast.error("Update failed", { description: err.message });
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
                          shouldDirty: true,
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
                          shouldDirty: true,
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

          {/* Stand Features & Addons relocated from sidebar */}
          <Card className="ios-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-headline flex items-center gap-2">
                <Puzzle className="size-4 text-ios-blue" />
                Features & Addons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedFeatures.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {assignedFeatures.map((af) => (
                    <div key={af.id} className="group relative flex flex-col gap-2 rounded-2xl bg-secondary/30 p-3 transition-colors hover:bg-secondary/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[15px] font-semibold leading-none">{af.stand_features.name}</p>
                          <p className="mt-1 text-caption-1 text-muted-foreground">
                            ${(af.custom_price || af.stand_features.default_price).toLocaleString()} / unit
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                          onClick={() => handleRemoveFeature(af.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between h-8">
                        <div className="flex items-center gap-2 bg-background/50 rounded-lg p-0.5 border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 rounded-md hover:bg-background"
                            onClick={() => handleUpdateFeature(af.id, af.quantity - 1)}
                            disabled={af.quantity <= 1}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="min-w-6 text-center text-footnote font-bold">
                            {af.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 rounded-md hover:bg-background"
                            onClick={() => handleUpdateFeature(af.id, af.quantity + 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <p className="text-footnote font-bold">
                          ${((af.custom_price || af.stand_features.default_price) * af.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/50">
                    <Puzzle className="size-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-footnote text-muted-foreground">No features or addons assigned to this stand yet.</p>
                </div>
              )}

              {assignedFeatures.length > 0 && (
                <div className="flex justify-between items-center py-2 px-4 bg-ios-blue/5 rounded-2xl border border-ios-blue/10">
                  <span className="text-footnote font-bold text-muted-foreground uppercase tracking-wider">TOTAL ADDONS COST</span>
                  <span className="text-title-3 font-bold text-ios-blue">
                    ${assignedFeatures.reduce((acc, f) => acc + ((f.custom_price || f.stand_features.default_price) * f.quantity), 0).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="pt-2 max-w-md">
                <Select
                  value=""
                  onValueChange={(val) => val && handleAddFeature(val)}
                  disabled={isFeaturesLoading}
                >
                  <SelectTrigger className="w-full bg-ios-blue/10 border-0 text-ios-blue hover:bg-ios-blue/20 transition-colors h-11 rounded-xl px-4">
                    <SelectValue placeholder={isFeaturesLoading ? "Loading features..." : "Add Feature or Addon"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-ios border-0">
                    {availableFeatures
                      .filter(f => !assignedFeatures.some(af => af.feature_id === f.id))
                      .map((f) => (
                        <SelectItem key={f.id} value={f.id} className="rounded-lg py-2">
                          <div className="flex flex-col">
                            <span className="font-semibold">{f.name}</span>
                            <span className="text-caption-2 text-muted-foreground">
                              Default Price: ${f.default_price.toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    {availableFeatures.length === 0 && (
                      <div className="p-4 text-center text-footnote text-muted-foreground">
                        No active features found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
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

      <ConfirmDialog
        open={!!featureToAdd}
        onOpenChange={(open) => !open && setFeatureToAdd(null)}
        title="Add Feature"
        description={`Are you sure you want to add "${featureToAdd?.name}" to this stand? This will add the default price of $${featureToAdd?.default_price?.toLocaleString()} to the total cost.`}
        confirmLabel="Add Addon"
        onConfirm={confirmAddFeature}
        variant="default"
      />
    </div>
  );
}
