import { z } from "zod";

export const visitorSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  job_title: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  badge_id: z.string().optional().or(z.literal("")),
});

export type VisitorFormData = z.infer<typeof visitorSchema>;
