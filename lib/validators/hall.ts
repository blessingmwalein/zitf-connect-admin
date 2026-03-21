import { z } from "zod";

const geoPointSchema = z.tuple([z.number(), z.number()]);

export const hallSchema = z.object({
  name: z.string().min(1, "Hall name is required"),
  description: z.string().optional(),
  display_order: z.coerce.number().int().min(0).default(0),
  capacity: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().default(true),
  geo_polygon: z.array(geoPointSchema).min(3, "Draw at least 3 points").optional().nullable(),
  geo_center: geoPointSchema.optional().nullable(),
});

export type HallFormData = z.infer<typeof hallSchema>;
