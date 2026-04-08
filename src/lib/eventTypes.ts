import { Music, Heart, Briefcase, Cake, Sparkles } from "lucide-react";

export const EVENT_TYPES = [
  {
    id: "nightlife",
    label: "Club Night",
    description: "DJ sets, parties, concerts, ticketed events",
    Icon: Music,
    calculatorMode: "revenue" as const,
    vendorCategories: ["bartending", "security", "dj_equipment", "av_equipment", "staffing"],
    lineItems: ["bartending", "security", "doorStaff", "setupCrew", "venue", "equipment"],
  },
  {
    id: "wedding",
    label: "Wedding",
    description: "Ceremonies, receptions, rehearsal dinners",
    Icon: Heart,
    calculatorMode: "budget" as const,
    vendorCategories: ["catering", "florist", "photographer", "videographer", "officiant", "cake_maker", "furniture_rental", "decor", "lighting", "transportation"],
    lineItems: ["venue", "catering", "florist", "photographer", "officiant", "cake", "furniture", "lighting", "transportation"],
  },
  {
    id: "corporate",
    label: "Corporate",
    description: "Team events, conferences, product launches",
    Icon: Briefcase,
    calculatorMode: "budget" as const,
    vendorCategories: ["catering", "av_equipment", "staffing", "photo_video", "decor", "transportation"],
    lineItems: ["venue", "catering", "avEquipment", "staffing", "photography", "decor"],
  },
  {
    id: "birthday",
    label: "Birthday",
    description: "Birthday parties, milestones, celebrations",
    Icon: Cake,
    calculatorMode: "budget" as const,
    vendorCategories: ["catering", "decor", "entertainment", "cake_maker", "photo_video"],
    lineItems: ["venue", "catering", "decor", "cake", "entertainment", "photography"],
  },
  {
    id: "other",
    label: "Other Event",
    description: "Pop-ups, galas, fundraisers, anything else",
    Icon: Sparkles,
    calculatorMode: "budget" as const,
    vendorCategories: ["catering", "decor", "staffing", "photo_video", "av_equipment"],
    lineItems: ["venue", "catering", "staffing", "decor"],
  },
] as const;

export type EventTypeId = typeof EVENT_TYPES[number]["id"];
export type CalculatorMode = "revenue" | "budget";

export function getEventType(id: EventTypeId) {
  return EVENT_TYPES.find((e) => e.id === id) ?? EVENT_TYPES[0];
}
