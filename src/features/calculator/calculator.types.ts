// Calculator Engine — Types & Constants

export const BARTENDER_RATE = 40;
export const SECURITY_RATE = 25;

export interface CalculatorInputs {
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
