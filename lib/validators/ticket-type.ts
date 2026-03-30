import { z } from "zod";

export const ticketTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
  price: z.preprocess(
    (val) => (val === "" || val === undefined ? 0 : Number(val)),
    z.number().min(0, "Price must be 0 or more"),
  ),
  currency: z.string().default("USD"),
  max_quantity: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
    z.number().nullable().optional(),
  ),
  ticket_category: z.enum(["visitor", "exhibitor"]),
  valid_from: z.string().optional().or(z.literal("")),
  valid_until: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type TicketTypeFormData = z.infer<typeof ticketTypeSchema>;
