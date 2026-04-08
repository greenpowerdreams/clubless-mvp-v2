import { z } from "zod";

export const eventSubmissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  instagram_handle: z
    .string()
    .trim()
    .max(50, "Instagram handle must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must be less than 100 characters"),
  event_concept: z
    .string()
    .trim()
    .min(20, "Please provide more details about your event (at least 20 characters)")
    .max(2000, "Event concept must be less than 2000 characters"),
  preferred_date: z
    .string()
    .min(1, "Please select a preferred date"),
  fee_model: z.enum(["service-fee", "profit-share"], {
    errorMap: () => ({ message: "Please select a fee model" }),
  }),
  event_type: z.enum(["nightlife", "wedding", "corporate", "birthday", "other"]).default("nightlife"),
});

export type EventSubmissionData = z.infer<typeof eventSubmissionSchema>;

export const validateEventSubmission = (data: unknown) => {
  return eventSubmissionSchema.safeParse(data);
};
