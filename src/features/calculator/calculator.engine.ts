// Calculator Engine — Pure calculation functions (no React, no Supabase)

import {
  BARTENDER_RATE,
  SECURITY_RATE,
  type CalculatorInputs,
  type CalculatorOutputs,
  type StaffingBreakdown,
  type CateringBreakdown,
  type ServicesBreakdown,
  type ViabilityScore,
  type ViabilityFactor,
} from "./calculator.types";

export function calculateStaffing(inputs: CalculatorInputs): StaffingBreakdown {
  const items = [];

  if (inputs.includeBartending) {
    items.push({
      name: "Bartending",
      qty: inputs.numBartenders,
      hours: inputs.bartenderHours,
      rate: BARTENDER_RATE,
      subtotal: inputs.numBartenders * inputs.bartenderHours * BARTENDER_RATE,
      locked: true,
    });
  }

  if (inputs.includeSecurity) {
    items.push({
      name: "Security",
      qty: inputs.numSecurity,
      hours: inputs.securityHours,
      rate: SECURITY_RATE,
      subtotal: inputs.numSecurity * inputs.securityHours * SECURITY_RATE,
      locked: true,
    });
  }

  if (inputs.includeDoorStaff) {
    items.push({
      name: "Door Staff",
      qty: inputs.numDoorStaff,
      hours: inputs.doorStaffHours,
      rate: inputs.doorStaffRate,
      subtotal: inputs.numDoorStaff * inputs.doorStaffHours * inputs.doorStaffRate,
      locked: false,
    });
  }

  if (inputs.includeSetupCrew) {
    items.push({
      name: "Setup/Teardown",
      qty: inputs.numSetupCrew,
      hours: inputs.setupCrewHours,
      rate: inputs.setupCrewRate,
      subtotal: inputs.numSetupCrew * inputs.setupCrewHours * inputs.setupCrewRate,
      locked: false,
    });
  }

  return {
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0),
  };
}

export function calculateCatering(inputs: CalculatorInputs): CateringBreakdown {
  if (!inputs.includeCatering) {
    return { cost: 0, mode: inputs.cateringMode, guests: 0, perPersonRate: 0, packageCost: 0 };
  }

  if (inputs.cateringMode === "per-person") {
    return {
      cost: inputs.cateringGuests * inputs.cateringCostPerPerson,
      mode: inputs.cateringMode,
      guests: inputs.cateringGuests,
      perPersonRate: inputs.cateringCostPerPerson,
      packageCost: 0,
    };
  }

  return {
    cost: inputs.cateringPackageCost,
    mode: inputs.cateringMode,
    guests: 0,
    perPersonRate: 0,
    packageCost: inputs.cateringPackageCost,
  };
}

export function calculateServices(
  staffing: StaffingBreakdown,
  catering: CateringBreakdown,
  markupPercent: number
): ServicesBreakdown {
  const subtotal = staffing.total + catering.cost;
  const markupAmount = subtotal * (markupPercent / 100);

  return {
    staffingCost: staffing.total,
    cateringCost: catering.cost,
    subtotal,
    markupPercent,
    markupAmount,
    total: subtotal + markupAmount,
  };
}

export function calculate(inputs: CalculatorInputs): CalculatorOutputs {
  const staffingBreakdown = calculateStaffing(inputs);
  const cateringBreakdown = calculateCatering(inputs);
  const servicesBreakdown = calculateServices(
    staffingBreakdown,
    cateringBreakdown,
    inputs.serviceMarkupPercent
  );

  const ticketRevenue = inputs.attendance * inputs.ticketPrice;
  const barRevenue = inputs.attendance * inputs.drinksPerAttendee * inputs.drinkPrice;
  const totalRevenue = ticketRevenue + barRevenue;
  const totalCosts = inputs.venueCost + inputs.equipmentCost + servicesBreakdown.total;
  const netEventProfit = Math.max(0, totalRevenue - totalCosts);

  let clublessFee: number;
  let feePercentage: number;

  if (inputs.isProfitShare) {
    clublessFee = netEventProfit * 0.5;
    feePercentage = 50;
  } else {
    const rate = inputs.serviceFeePercent / 100;
    clublessFee = netEventProfit * rate;
    feePercentage = inputs.serviceFeePercent;
  }

  const yourTakeHome = netEventProfit - clublessFee;
  const yourPercentage = netEventProfit > 0 ? (yourTakeHome / netEventProfit) * 100 : 0;
  const profitPerGuest = inputs.attendance > 0 ? yourTakeHome / inputs.attendance : 0;

  // Break-even: how many tickets needed to cover costs
  const revenuePerGuest = inputs.ticketPrice + inputs.drinksPerAttendee * inputs.drinkPrice;
  const breakEvenAttendance = revenuePerGuest > 0 ? Math.ceil(totalCosts / revenuePerGuest) : 0;

  // ROI
  const roi = totalCosts > 0 ? (yourTakeHome / totalCosts) * 100 : 0;

  return {
    ticketRevenue,
    barRevenue,
    totalRevenue,
    totalCosts,
    netEventProfit,
    clublessFee,
    feePercentage,
    yourTakeHome,
    yourPercentage,
    profitPerGuest,
    breakEvenAttendance,
    roi,
    staffingBreakdown,
    cateringBreakdown,
    servicesBreakdown,
  };
}

// ============================================
// Viability Scoring (rule-based, no AI needed)
// ============================================

export function scoreViability(inputs: CalculatorInputs, outputs: CalculatorOutputs): ViabilityScore {
  const factors: ViabilityFactor[] = [];

  // 1. Profit margin (weight: 30%)
  const margin = outputs.totalRevenue > 0 ? (outputs.yourTakeHome / outputs.totalRevenue) * 100 : 0;
  let marginScore: number;
  let marginDetail: string;
  if (margin >= 40) { marginScore = 10; marginDetail = `${margin.toFixed(0)}% margin — excellent`; }
  else if (margin >= 30) { marginScore = 8; marginDetail = `${margin.toFixed(0)}% margin — strong`; }
  else if (margin >= 20) { marginScore = 6; marginDetail = `${margin.toFixed(0)}% margin — healthy`; }
  else if (margin >= 10) { marginScore = 4; marginDetail = `${margin.toFixed(0)}% margin — tight`; }
  else if (margin > 0) { marginScore = 2; marginDetail = `${margin.toFixed(0)}% margin — risky`; }
  else { marginScore = 0; marginDetail = "No profit margin"; }
  factors.push({ name: "Profit Margin", score: marginScore, weight: 0.3, detail: marginDetail });

  // 2. Break-even safety (weight: 25%)
  const breakEvenPct = inputs.attendance > 0 ? (outputs.breakEvenAttendance / inputs.attendance) * 100 : 100;
  let beScore: number;
  let beDetail: string;
  if (breakEvenPct <= 40) { beScore = 10; beDetail = `Break even at ${breakEvenPct.toFixed(0)}% capacity — very safe`; }
  else if (breakEvenPct <= 55) { beScore = 8; beDetail = `Break even at ${breakEvenPct.toFixed(0)}% capacity — safe`; }
  else if (breakEvenPct <= 70) { beScore = 6; beDetail = `Break even at ${breakEvenPct.toFixed(0)}% capacity — moderate`; }
  else if (breakEvenPct <= 85) { beScore = 4; beDetail = `Break even at ${breakEvenPct.toFixed(0)}% capacity — tight`; }
  else if (breakEvenPct <= 100) { beScore = 2; beDetail = `Break even at ${breakEvenPct.toFixed(0)}% capacity — risky`; }
  else { beScore = 0; beDetail = "Cannot break even at full capacity"; }
  factors.push({ name: "Break-Even Safety", score: beScore, weight: 0.25, detail: beDetail });

  // 3. Revenue per guest (weight: 20%)
  const rpg = outputs.profitPerGuest;
  let rpgScore: number;
  let rpgDetail: string;
  if (rpg >= 30) { rpgScore = 10; rpgDetail = `$${rpg.toFixed(0)}/guest profit — premium`; }
  else if (rpg >= 20) { rpgScore = 8; rpgDetail = `$${rpg.toFixed(0)}/guest profit — strong`; }
  else if (rpg >= 12) { rpgScore = 6; rpgDetail = `$${rpg.toFixed(0)}/guest profit — good`; }
  else if (rpg >= 5) { rpgScore = 4; rpgDetail = `$${rpg.toFixed(0)}/guest profit — low`; }
  else { rpgScore = 2; rpgDetail = `$${rpg.toFixed(0)}/guest profit — very low`; }
  factors.push({ name: "Profit per Guest", score: rpgScore, weight: 0.2, detail: rpgDetail });

  // 4. Cost structure (weight: 15%)
  const costRatio = outputs.totalRevenue > 0 ? (outputs.totalCosts / outputs.totalRevenue) * 100 : 100;
  let costScore: number;
  let costDetail: string;
  if (costRatio <= 30) { costScore = 10; costDetail = `Costs are ${costRatio.toFixed(0)}% of revenue — lean`; }
  else if (costRatio <= 45) { costScore = 8; costDetail = `Costs are ${costRatio.toFixed(0)}% of revenue — efficient`; }
  else if (costRatio <= 60) { costScore = 6; costDetail = `Costs are ${costRatio.toFixed(0)}% of revenue — moderate`; }
  else if (costRatio <= 80) { costScore = 4; costDetail = `Costs are ${costRatio.toFixed(0)}% of revenue — heavy`; }
  else { costScore = 2; costDetail = `Costs are ${costRatio.toFixed(0)}% of revenue — unsustainable`; }
  factors.push({ name: "Cost Efficiency", score: costScore, weight: 0.15, detail: costDetail });

  // 5. Scale (weight: 10%)
  let scaleScore: number;
  let scaleDetail: string;
  if (inputs.attendance >= 300) { scaleScore = 10; scaleDetail = `${inputs.attendance} attendees — large event`; }
  else if (inputs.attendance >= 150) { scaleScore = 8; scaleDetail = `${inputs.attendance} attendees — mid-size`; }
  else if (inputs.attendance >= 75) { scaleScore = 6; scaleDetail = `${inputs.attendance} attendees — intimate`; }
  else if (inputs.attendance >= 30) { scaleScore = 4; scaleDetail = `${inputs.attendance} attendees — small`; }
  else { scaleScore = 2; scaleDetail = `${inputs.attendance} attendees — very small`; }
  factors.push({ name: "Event Scale", score: scaleScore, weight: 0.1, detail: scaleDetail });

  // Weighted total
  const totalScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const rounded = Math.round(totalScore * 10) / 10;

  let label: string;
  let color: string;
  if (rounded >= 8) { label = "Highly Viable"; color = "text-green-400"; }
  else if (rounded >= 6) { label = "Viable"; color = "text-blue-400"; }
  else if (rounded >= 4) { label = "Marginal"; color = "text-yellow-400"; }
  else { label = "High Risk"; color = "text-destructive"; }

  return { score: rounded, label, color, factors };
}

// ============================================
// Auto-fill staffing recommendations
// ============================================

export function getRecommendedStaffing(attendance: number, durationHours: number) {
  return {
    bartenders: Math.max(1, Math.ceil(attendance / 75)),
    security: Math.max(1, Math.ceil(attendance / 100)),
    hours: durationHours,
  };
}

export const DEFAULT_INPUTS: CalculatorInputs = {
  attendance: 200,
  ticketPrice: 25,
  drinksPerAttendee: 3,
  drinkPrice: 12,
  venueCost: 2000,
  equipmentCost: 500,
  eventDurationHours: 6,
  includeBartending: true,
  numBartenders: 2,
  bartenderHours: 6,
  includeSecurity: true,
  numSecurity: 2,
  securityHours: 6,
  includeDoorStaff: false,
  numDoorStaff: 1,
  doorStaffHours: 5,
  doorStaffRate: 25,
  includeSetupCrew: false,
  numSetupCrew: 2,
  setupCrewHours: 3,
  setupCrewRate: 30,
  includeCatering: false,
  cateringMode: "per-person",
  cateringGuests: 200,
  cateringCostPerPerson: 12,
  cateringPackageCost: 2500,
  serviceMarkupPercent: 20,
  isProfitShare: false,
  serviceFeePercent: 20,
};
