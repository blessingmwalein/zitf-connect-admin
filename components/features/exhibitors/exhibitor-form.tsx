"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  exhibitorSchema,
  type ExhibitorFormData,
} from "@/lib/validators/exhibitor";
import type { Exhibitor } from "@/types/database.types";
import { EXHIBITOR_STATUS_CONFIG } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Resolver } from "react-hook-form";

interface ExhibitorFormProps {
  initialData?: Exhibitor;
  onSubmit: (data: ExhibitorFormData) => Promise<void>;
}

export function ExhibitorForm({ initialData, onSubmit }: ExhibitorFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExhibitorFormData>({
    resolver: zodResolver(exhibitorSchema) as Resolver<ExhibitorFormData>,
    defaultValues: initialData
      ? {
          company_name: initialData.company_name,
          description: initialData.description ?? undefined,
          contact_person: initialData.contact_person,
          contact_email: initialData.contact_email,
          contact_phone: initialData.contact_phone ?? undefined,
          website: initialData.website ?? undefined,
          status: initialData.status,
          country: initialData.country ?? undefined,
          industry: initialData.industry ?? undefined,
          booth_size: initialData.booth_size ?? undefined,
          notes: initialData.notes ?? undefined,
        }
      : {
          status: "pending",
        },
  });

  const currentStatus = watch("status");

  async function handleFormSubmit(data: ExhibitorFormData) {
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
      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="text-headline font-semibold text-foreground">
          Company Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              placeholder="Enter company name"
              {...register("company_name")}
              className="h-11 rounded-xl bg-secondary/50"
            />
            {errors.company_name && (
              <p className="text-caption-1 text-destructive">
                {errors.company_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the company"
              rows={3}
              {...register("description")}
              className="rounded-xl bg-secondary/50"
            />
            {errors.description && (
              <p className="text-caption-1 text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g. Technology, Mining"
              {...register("industry")}
              className="h-11 rounded-xl bg-secondary/50"
            />
            {errors.industry && (
              <p className="text-caption-1 text-destructive">
                {errors.industry.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="e.g. Zimbabwe"
              {...register("country")}
              className="h-11 rounded-xl bg-secondary/50"
            />
            {errors.country && (
              <p className="text-caption-1 text-destructive">
                {errors.country.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              {...register("website")}
              className="h-11 rounded-xl bg-secondary/50"
            />
            {errors.website && (
              <p className="text-caption-1 text-destructive">
                {errors.website.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="booth_size">Booth Size</Label>
            <Input
              id="booth_size"
              placeholder="e.g. 3x3, 6x6"
              {...register("booth_size")}
              className="h-11 rounded-xl bg-secondary/50"
            />
            {errors.booth_size && (
              <p className="text-caption-1 text-destructive">
                {errors.booth_size.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-headline font-semibold text-foreground">
          Contact Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact_person">Contact Person *</Label>
            <Input
              id="contact_person"
              placeholder="Full name"
              {...register("contact_person")}
              className="h-11 rounded-xl bg-secondary/50"
            />
            {errors.contact_person && (
              <p className="text-caption-1 text-destructive">
                {errors.contact_person.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Email *</Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="contact@company.com"
              {...register("contact_email")}
              className="h-11 rounded-xl bg-secondary/50"
            />
            {errors.contact_email && (
              <p className="text-caption-1 text-destructive">
                {errors.contact_email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Phone</Label>
            <Input
              id="contact_phone"
              type="tel"
              placeholder="+263 77 123 4567"
              {...register("contact_phone")}
              className="h-11 rounded-xl bg-secondary/50"
            />
            {errors.contact_phone && (
              <p className="text-caption-1 text-destructive">
                {errors.contact_phone.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status & Notes */}
      <div className="space-y-4">
        <h3 className="text-headline font-semibold text-foreground">
          Status & Notes
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={currentStatus}
              onValueChange={(val) =>
                setValue("status", val as ExhibitorFormData["status"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="h-11 w-full rounded-xl bg-secondary/50">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXHIBITOR_STATUS_CONFIG).map(
                  ([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-caption-1 text-destructive">
                {errors.status.message}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              rows={3}
              {...register("notes")}
              className="rounded-xl bg-secondary/50"
            />
            {errors.notes && (
              <p className="text-caption-1 text-destructive">
                {errors.notes.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 min-w-[140px] rounded-2xl font-semibold ios-press"
        >
          {isLoading ? (
            <><Loader2 className="size-4 animate-spin" /> {initialData ? "Saving..." : "Creating..."}</>
          ) : (
            initialData ? "Save Changes" : "Create Exhibitor"
          )}
        </Button>
      </div>
    </form>
  );
}
