"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  exhibitorSchema,
  type ExhibitorFormData,
} from "@/lib/validators/exhibitor";
import type { Exhibitor, Hall } from "@/types/database.types";
import { EXHIBITOR_STATUS_CONFIG } from "@/lib/constants";
import { ZITF_CATEGORIES } from "@/lib/constants/categories";
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
import { FileUpload } from "@/components/shared/file-upload";
import { uploadExhibitorLogo } from "@/services/upload.service";
import { toast } from "sonner";
import type { Resolver } from "react-hook-form";

interface ExhibitorFormProps {
  initialData?: Exhibitor;
  halls?: Pick<Hall, "id" | "name">[];
  onSubmit: (data: ExhibitorFormData) => Promise<void>;
}

export function ExhibitorForm({ initialData, halls = [], onSubmit }: ExhibitorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData?.logo_url ?? null
  );
  const [isUploading, setIsUploading] = useState(false);

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
          category_id: initialData.category_id ?? undefined,
          hall_id: initialData.hall_id ?? undefined,
          logo_url: initialData.logo_url ?? undefined,
          booth_size: initialData.booth_size ?? undefined,
          notes: initialData.notes ?? undefined,
        }
      : {
          status: "pending",
        },
  });

  const currentStatus = watch("status");
  const currentCategoryId = watch("category_id");
  const currentHallId = watch("hall_id");

  async function handleLogoUpload(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url, error } = await uploadExhibitorLogo(formData);
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
      setIsUploading(false);
    }
  }

  function handleLogoRemove() {
    setValue("logo_url", null, { shouldValidate: true });
    setLogoPreview(null);
  }

  async function handleFormSubmit(data: ExhibitorFormData) {
    setIsLoading(true);
    try {
      // Clean empty strings to null
      if (data.hall_id === "") data.hall_id = null;
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

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Company Logo</Label>
          <FileUpload
            accept="image/*"
            maxSizeMB={2}
            onFileSelect={handleLogoUpload}
            onRemove={handleLogoRemove}
            preview={logoPreview}
            label={isUploading ? "Uploading..." : "Upload company logo"}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              placeholder="Enter company name"
              {...register("company_name")}
              className="h-11 rounded-full bg-secondary/50"
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
            <Label>Category / Industry</Label>
            <Select
              value={currentCategoryId ? String(currentCategoryId) : ""}
              onValueChange={(val) =>
                setValue("category_id", val ? Number(val) : null, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="h-11 w-full rounded-full bg-secondary/50">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {ZITF_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-caption-1 text-destructive">
                {errors.category_id.message}
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
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              {...register("website")}
              className="h-11 rounded-full bg-secondary/50"
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
              className="h-11 rounded-full bg-secondary/50"
            />
            {errors.booth_size && (
              <p className="text-caption-1 text-destructive">
                {errors.booth_size.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hall Assignment */}
      {halls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-headline font-semibold text-foreground">
            Hall Assignment
          </h3>
          <div className="space-y-2">
            <Label>Assigned Hall</Label>
            <Select
              value={currentHallId ?? ""}
              onValueChange={(val) =>
                setValue("hall_id", val || null, { shouldValidate: true })
              }
            >
              <SelectTrigger className="h-11 w-full rounded-full bg-secondary/50">
                <SelectValue placeholder="Select hall (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No hall assigned</SelectItem>
                {halls.map((hall) => (
                  <SelectItem key={hall.id} value={hall.id}>
                    {hall.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

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
              className="h-11 rounded-full bg-secondary/50"
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
              className="h-11 rounded-full bg-secondary/50"
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
              className="h-11 rounded-full bg-secondary/50"
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
              <SelectTrigger className="h-11 w-full rounded-full bg-secondary/50">
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
          disabled={isLoading || isUploading}
          className="h-11 min-w-[140px] rounded-full font-semibold ios-press"
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
