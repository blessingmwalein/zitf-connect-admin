import { z } from "zod";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const eventSchema = z
  .object({
    name: z.string().min(1, "Event name is required"),
    slug: z
      .string()
      .min(1, "Slug is required")
      .regex(SLUG_PATTERN, "Slug must be lowercase letters, numbers, and hyphens only"),
    description: z.string().optional().or(z.literal("")),
    venue_id: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? null : val),
      z.string().nullable().optional()
    ),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    status: z
      .enum(["draft", "published", "active", "completed", "cancelled", "archived"])
      .default("draft"),
    country: z.string().optional().or(z.literal("")),
    city: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    cover_image_url: z.string().url("Invalid URL").optional().or(z.literal("")),
    logo_url: z.string().url("Invalid URL").optional().or(z.literal("")),
    order_prefix: z.preprocess(
      (val) => (val === "" || val === undefined ? undefined : val),
      z.string().default("EVT")
    ),
  })
  .refine(
    (data) => new Date(data.end_date) >= new Date(data.start_date),
    { message: "End date must be on or after start date", path: ["end_date"] }
  );

export type EventFormData = z.infer<typeof eventSchema>;
