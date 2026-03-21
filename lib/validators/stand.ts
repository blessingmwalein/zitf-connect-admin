import { z } from "zod";

const geoPointSchema = z.tuple([z.number(), z.number()]);

export const standSchema = z.object({
  hall_id: z.string().uuid("Select a hall"),
  stand_number: z.string().min(1, "Stand number is required"),
  label: z.string().optional(),
  status: z
    .enum(["available", "reserved", "booked", "unavailable"])
    .default("available"),
  area_sqm: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  geo_polygon: z.array(geoPointSchema).min(3).optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
});

export type StandFormData = z.infer<typeof standSchema>;
