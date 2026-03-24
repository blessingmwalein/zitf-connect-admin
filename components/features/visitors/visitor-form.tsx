"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  visitorSchema,
  type VisitorFormData,
} from "@/lib/validators/visitor";
import type { Visitor } from "@/types/database.types";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Resolver } from "react-hook-form";

interface VisitorFormProps {
  initialData?: Visitor;
  onSubmit: (data: VisitorFormData) => Promise<void>;
}

export function VisitorForm({ initialData, onSubmit }: VisitorFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema) as Resolver<VisitorFormData>,
    defaultValues: initialData
      ? {
          full_name: initialData.full_name,
          email: initialData.email ?? "",
          phone: initialData.phone ?? "",
          company: initialData.company ?? "",
          job_title: initialData.job_title ?? "",
          country: initialData.country ?? "",
          badge_id: initialData.badge_id ?? "",
        }
      : {},
  });

  async function handleFormSubmit(data: VisitorFormData) {
    setIsLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
    >
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-headline font-semibold text-foreground">
          Personal Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              placeholder="Enter full name"
              {...register("full_name")}
              className="h-11 rounded-full bg-secondary/50"
            />
            {errors.full_name && (
              <p className="text-caption-1 text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="visitor@example.com"
              {...register("email")}
              className="h-11 rounded-full bg-secondary/50"
            />
            {errors.email && (
              <p className="text-caption-1 text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+263 77 123 4567"
              {...register("phone")}
              className="h-11 rounded-full bg-secondary/50"
            />
            {errors.phone && (
              <p className="text-caption-1 text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="space-y-4">
        <h3 className="text-headline font-semibold text-foreground">
          Professional Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="Company name"
              {...register("company")}
              className="h-11 rounded-full bg-secondary/50"
            />
            {errors.company && (
              <p className="text-caption-1 text-destructive">
                {errors.company.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_title">Job Title</Label>
            <Input
              id="job_title"
              placeholder="e.g. Procurement Manager"
              {...register("job_title")}
              className="h-11 rounded-full bg-secondary/50"
            />
            {errors.job_title && (
              <p className="text-caption-1 text-destructive">
                {errors.job_title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="e.g. Zimbabwe"
              {...register("country")}
              className="h-11 rounded-full bg-secondary/50"
            />
            {errors.country && (
              <p className="text-caption-1 text-destructive">
                {errors.country.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge_id">Badge ID</Label>
            <Input
              id="badge_id"
              placeholder="e.g. BADGE-001"
              {...register("badge_id")}
              className="h-11 rounded-full bg-secondary/50"
            />
            {errors.badge_id && (
              <p className="text-caption-1 text-destructive">
                {errors.badge_id.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 min-w-[140px] rounded-full font-semibold ios-press"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />{" "}
              {initialData ? "Saving..." : "Creating..."}
            </>
          ) : initialData ? (
            "Save Changes"
          ) : (
            "Create Visitor"
          )}
        </Button>
      </div>
    </form>
  );
}
