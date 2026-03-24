import { z } from "zod";

export const exhibitorSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  description: z.string().optional().or(z.literal("")),
  contact_person: z.string().min(1, "Contact person is required"),
  contact_email: z.string().email("Invalid email address"),
  contact_phone: z.string().optional().or(z.literal("")),
  website: z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal("")),
  status: z
    .enum(["pending", "approved", "rejected", "active", "inactive"])
    .default("pending"),
  country: z.string().optional().or(z.literal("")),
  category_id: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
    z.number().nullable().optional(),
  ),
  hall_id: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().nullable().optional(),
  ),
  logo_url: z.string().optional().nullable(),
  booth_size: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type ExhibitorFormData = z.infer<typeof exhibitorSchema>;
