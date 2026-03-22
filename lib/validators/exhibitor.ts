import { z } from "zod";

export const exhibitorSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  contact_person: z.string().min(1, "Contact person is required"),
  contact_email: z.string().email("Invalid email address"),
  contact_phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  status: z
    .enum(["pending", "approved", "rejected", "active", "inactive"])
    .default("pending"),
  country: z.string().optional(),
  category_id: z.coerce.number().optional().nullable(),
  hall_id: z.string().uuid().optional().nullable().or(z.literal("")),
  logo_url: z.string().optional().nullable(),
  booth_size: z.string().optional(),
  notes: z.string().optional(),
});

export type ExhibitorFormData = z.infer<typeof exhibitorSchema>;
