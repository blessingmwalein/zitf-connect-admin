"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { hallSchema, type HallFormData } from "@/lib/validators/hall";
import { createHall } from "@/services/hall.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function NewHallPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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

  async function onSubmit(data: HallFormData) {
    setIsSubmitting(true);
    try {
      const { error } = await createHall(data as any);
      if (error) throw error;
      toast.success("Hall created successfully");
      router.push("/halls");
    } catch {
      toast.error("Failed to create hall");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add Hall" description="Create a new exhibition hall">
        <Link href="/halls">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
      </PageHeader>

      <Card className="ios-card mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-headline">Hall Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Hall Name</Label>
              <Input
                id="name"
                placeholder="e.g. International Pavilion"
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
                placeholder="Describe the hall, its purpose, and any notable features..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-caption-1 text-ios-red">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Display Order */}
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min={0}
                  placeholder="0"
                  {...register("display_order")}
                />
                {errors.display_order && (
                  <p className="text-caption-1 text-ios-red">
                    {errors.display_order.message}
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
                  placeholder="e.g. 500"
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

            {/* Active Toggle */}
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

            <Separator />

            <div className="flex justify-end gap-3">
              <Link href="/halls">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Creating...</> : "Create Hall"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
