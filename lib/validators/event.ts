import { z } from "zod";

export const eventSchema = z
  .object({
    name: z.string().min(1, "Event name is required"),
    description: z.string().optional(),
    hall_id: z.string().uuid("Select a hall").optional().or(z.literal("")),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    status: z.enum(["draft", "published", "cancelled", "completed"]).default("draft"),
    speaker: z.string().optional(),
    capacity: z.coerce.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.start_time && data.end_time) {
        return new Date(data.end_time) > new Date(data.start_time);
      }
      return true;
    },
    { message: "End time must be after start time", path: ["end_time"] }
  );

export type EventFormData = z.infer<typeof eventSchema>;
