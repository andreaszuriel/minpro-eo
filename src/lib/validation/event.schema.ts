import { z } from 'zod';

/**
 * Ticket tier validation schema
 */
export const ticketTierSchema = z.object({
  name: z.string().min(1, "Ticket tier name is required"),
  price: z.number().min(0, "Price cannot be negative")
});

export const ticketTiersSchema = z.array(ticketTierSchema)
  .min(1, "At least one ticket tier is required");

/**
 * Event creation validation schema
 */
export const eventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  artist: z.string().min(1, "Artist name is required"),
  genreName: z.string().min(1, "Genre is required"),
  countryCode: z.string().min(1, "Country is required"),
  startDate: z.string().min(1, "Start date is required")
    .refine(date => !isNaN(new Date(date).getTime()), {
      message: "Invalid start date format"
    }),
  endDate: z.string().min(1, "End date is required")
    .refine(date => !isNaN(new Date(date).getTime()), {
      message: "Invalid end date format"
    }),
  location: z.string().min(1, "Location is required"),
  seats: z.number().int().positive("Seats must be a positive number"),
  description: z.string().optional(),
  image: z.string().optional(),
  tiers: ticketTiersSchema,
  // Organizing entity
  organizerId: z.string().min(1, "Organizer ID is required"),
});

// Add refined validation for date range
export const eventFormSchema = eventSchema.refine(
  data => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start < end;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
);

// Event search parameters
export const eventSearchSchema = z.object({
  q: z.string().optional(),
  genreName: z.string().optional(),
  countryCode: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(12),
  userId: z.string().optional(),
});

export type EventFormData = z.infer<typeof eventFormSchema>;
export type EventSearchParams = z.infer<typeof eventSearchSchema>;