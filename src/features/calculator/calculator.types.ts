// Calculator Engine — Types & Constants

export const BARTENDER_RATE = 50;   // was 40 — Seattle managed service rate $45-$55
export const SECURITY_RATE = 35;    // was 25 — Seattle licensed security $28-$40
export const DOOR_STAFF_RATE = 25;  // unchanged — appropriate
export const SETUP_CREW_RATE = 30;  // unchanged — appropriate

export const BUDGET_DEFAULTS_BY_TYPE = {
  wedding: 42000,   // was 30000 — Seattle metro average The Wedding Report 2024
  corporate: 15000,
  birthday: 3500,   // was 8000 — Party Genius AI 2026; median milestone spend
  other: 10000,
};

export const CATERING_DEFAULTS_BY_TYPE = {
  nightlife: 12,
  wedding: 45,      // was 85 — Seattle mid-tier plated $38-$53 (Kaspar's Seattle Catering 2024)
  corporate: 50,    // was 45 — GoGather 2025 $35-$65 range
  birthday: 35,     // unchanged
  other: 12,
};

export interface CalculatorInputs {
  // Event type
  eventType: "nightlife" | "wedding" | "corporate" | "birthday" | "other";

  // Revenue
  attendance: number;
  ticketPrice: number;
  drinksPerAttendee: number;
  drinkPrice: number;

  // Base costs
  venueCost: number;
  equipmentCost: number;

  // Duration
  eventDurationHours: number;

  // Staffing
  includeBartending: boolean;
  numBartenders: number;
  bartenderHours: number;
  includeSecurity: boolean;
  numSecurity: number;
  securityHours: number;
  includeDoorStaff: boolean;
  numDoorStaff: number;
  doorStaffHours: number;
  doorStaffRate: number;
  includeSetupCrew: boolean;
  numSetupCrew: number;
  setupCrewHours: number;
  setupCrewRate: number;

  // Catering
  includeCatering: boolean;
  cateringMode: "per-person" | "flat";
  cateringGuests: number;
  cateringCostPerPerson: number;
  cateringPackageCost: number;

  // Fees
  serviceMarkupPercent: number;
  isProfitShare: boolean;
  serviceFeePercent: number; // from user level

  // Nightlife-specific additions
  djTalentCost: number;           // DJ/artist performance fee (default: 700)
  marketingBudget: number;        // Promo/marketing spend (default: 400)
  barRevenueOwnership: "venue" | "host"; // Who keeps bar revenue (default: 'host')
  eventInsurance: number;         // Liability insurance cost (default: 150)

  // All event types
  contingencyPercent: number;     // Buffer % of total costs (default: 10)

  // Wedding-specific additions
  photographyCost: number;        // (default: 5000)
  floralsCost: number;            // (default: 5500)
  officiantCost: number;          // (default: 450)
  cakeCost: number;               // (default: 600)
  videographerCost: number;       // (default: 0, optional)

  // Corporate-specific
  avEquipmentCost: number;        // AV/tech (default: 2000)
  speakerFee: number;             // Keynote/entertainment (default: 0)

  // Social/birthday
  entertainmentCost: number;      // DJ, photo booth, etc. (default: 800)

  // Budget mode (wedding/corporate/birthday)
  totalBudget: number;
}

export interface StaffingItem {
  name: string;
  qty: number;
  hours: number;
  rate: number;
  subtotal: number;
  locked: boolean;
}

export interface StaffingBreakdown {
  items: StaffingItem[];
  total: number;
}

export interface CateringBreakdown {
  cost: number;
  mode: string;
  guests: number;
  perPersonRate: number;
  packageCost: number;
}

export interface ServicesBreakdown {
  staffingCost: number;
  cateringCost: number;
  subtotal: number;
  markupPercent: number;
  markupAmount: number;
  total: number;
}

export interface CalculatorOutputs {
  ticketRevenue: number;
  barRevenue: number;
  totalRevenue: number;
  totalCosts: number;
  netEventProfit: number;
  clublessFee: number;
  feePercentage: number;
  yourTakeHome: number;
  yourPercentage: number;
  profitPerGuest: number;
  costPerAttendee: number;
  breakEvenAttendance: number;
  roi: number;
  staffingBreakdown: StaffingBreakdown;
  cateringBreakdown: CateringBreakdown;
  servicesBreakdown: ServicesBreakdown;
}

export interface ViabilityScore {
  score: number; // 0-10
  label: string;
  color: string;
  factors: ViabilityFactor[];
}

export interface ViabilityFactor {
  name: string;
  score: number; // 0-10
  weight: number;
  detail: string;
}

export interface CalculatorResult extends CalculatorOutputs {
  viability: ViabilityScore;
}

export interface CalculatorSnapshot {
  id: string;
  user_id: string | null;
  event_id: string | null;
  inputs_json: CalculatorInputs;
  outputs_json: CalculatorOutputs;
  viability_score: number | null;
  viability_factors: ViabilityFactor[] | null;
  created_at: string;
}
