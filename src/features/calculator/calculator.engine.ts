// Calculator Engine — Pure calculation functions (no React, no Supabase)

import {
  BARTENDER_RATE,
  SECURITY_RATE,
  BUDGET_DEFAULTS_BY_TYPE,
  type CalculatorInputs,
  type CalculatorOutputs,
  type CalculatorResult,
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

// Fix 2: Markup applies ONLY to staffingTotal — catering is a pass-through cost
export function calculateServices(
  staffing: StaffingBreakdown,
  catering: CateringBreakdown,
  markupPercent: number
): ServicesBreakdown {
  const subtotal = staffing.total + catering.cost;
  // was: subtotal * (markupPercent / 100) — incorrectly applied markup to catering
  const markupAmount = staffing.total * (markupPercent / 100);

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

  const isNightlife = inputs.eventType === "nightlife";
  const isBudgetMode = ["wedding", "corporate", "birthday"].includes(inputs.eventType);

  const ticketRevenue = inputs.attendance * inputs.ticketPrice;
  const barRevenue = inputs.attendance * inputs.drinksPerAttendee * inputs.drinkPrice;

  // Fix 3: Bar revenue ownership — when venue keeps the bar, host gets $0 from it
  const effectiveBarRevenue = inputs.barRevenueOwnership === "host" ? barRevenue : 0;
  const totalRevenue = ticketRevenue + effectiveBarRevenue;

  // Fix 4: Nightlife-specific costs
  const djCost = isNightlife ? inputs.djTalentCost : 0;
  const marketingCost = isNightlife ? inputs.marketingBudget : 0;
  const insuranceCost = isNightlife ? inputs.eventInsurance : 0;

  // Fix 5: Wedding-specific costs
  const weddingCosts =
    inputs.eventType === "wedding"
      ? inputs.photographyCost +
        inputs.floralsCost +
        inputs.officiantCost +
        inputs.cakeCost +
        inputs.videographerCost
      : 0;

  // Fix 6: Corporate-specific costs
  const corporateCosts =
    inputs.eventType === "corporate"
      ? inputs.avEquipmentCost + inputs.speakerFee
      : 0;

  // Fix 7: Birthday-specific costs
  const birthdayCosts =
    inputs.eventType === "birthday" ? inputs.entertainmentCost : 0;

  const baseCosts =
    inputs.venueCost +
    inputs.equipmentCost +
    servicesBreakdown.total +
    djCost +
    marketingCost +
    insuranceCost +
    weddingCosts +
    corporateCosts +
    birthdayCosts;

  // Fix 9: Platform fee for non-nightlife budget types
  // Applied only to vendor services coordinated through Clubless (staffing + catering)
  const servicesTotal = staffingBreakdown.total + cateringBreakdown.cost;
  const budgetModePlatformFee = isBudgetMode
    ? servicesTotal * (inputs.eventType === "corporate" ? 0.10 : 0.08)
    : 0;

  const totalCostsBeforeContingency = baseCosts + budgetModePlatformFee;

  // Fix 8: Contingency buffer applied to total costs
  const contingencyAmount =
    totalCostsBeforeContingency * (inputs.contingencyPercent / 100);
  const totalCostsWithContingency = totalCostsBeforeContingency + contingencyAmount;

  const totalCosts = totalCostsWithContingency;

  // Fix 1: No Math.max(0) clamp — negative profit surfaces correctly for red loss state
  const netEventProfit = totalRevenue - totalCosts;

  let clublessFee: number;
  let feePercentage: number;

  if (isBudgetMode) {
    // Budget mode platform fee already included in totalCosts above
    clublessFee = budgetModePlatformFee;
    feePercentage = inputs.eventType === "corporate" ? 10 : 8;
  } else if (inputs.isProfitShare) {
    clublessFee = netEventProfit > 0 ? netEventProfit * 0.5 : 0;
    feePercentage = 50;
  } else {
    const rate = inputs.serviceFeePercent / 100;
    clublessFee = netEventProfit > 0 ? netEventProfit * rate : 0;
    feePercentage = inputs.serviceFeePercent;
  }

  const yourTakeHome = isBudgetMode
    ? netEventProfit // budget mode: "take home" is budget remaining after all costs
    : netEventProfit - clublessFee;

  const yourPercentage = netEventProfit > 0 ? (yourTakeHome / netEventProfit) * 100 : 0;
  const profitPerGuest = inputs.attendance > 0 ? yourTakeHome / inputs.attendance : 0;

  // Fix 10: Cost per attendee
  const costPerAttendee = inputs.attendance > 0 ? totalCosts / inputs.attendance : 0;

  // Break-even: how many tickets needed to cover costs
  const revenuePerGuest =
    inputs.ticketPrice +
    (inputs.barRevenueOwnership === "host"
      ? inputs.drinksPerAttendee * inputs.drinkPrice
      : 0);
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
    costPerAttendee,
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

// Fix 11: Event-type-specific viability scoring

function scoreNightlifeViability(
  inputs: CalculatorInputs,
  outputs: CalculatorOutputs
): ViabilityFactor[] {
  const factors: ViabilityFactor[] = [];

  // Factor 1: Profit Margin (weight 0.30)
  const margin =
    outputs.totalRevenue > 0
      ? (outputs.yourTakeHome / outputs.totalRevenue) * 100
      : 0;
  let marginScore: number;
  let marginDetail: string;
  if (margin >= 40) { marginScore = 10; marginDetail = `${margin.toFixed(0)}% margin — excellent`; }
  else if (margin >= 30) { marginScore = 8; marginDetail = `${margin.toFixed(0)}% margin — strong`; }
  else if (margin >= 20) { marginScore = 6; marginDetail = `${margin.toFixed(0)}% margin — healthy`; }
  else if (margin >= 10) { marginScore = 4; marginDetail = `${margin.toFixed(0)}% margin — tight`; }
  else if (margin > 0) { marginScore = 2; marginDetail = `${margin.toFixed(0)}% margin — risky`; }
  else { marginScore = 0; marginDetail = "No profit margin"; }
  factors.push({ name: "Profit Margin", score: marginScore, weight: 0.30, detail: marginDetail });

  // Factor 2: Break-Even Safety (weight 0.25)
  const breakEvenPct =
    inputs.attendance > 0
      ? (outputs.breakEvenAttendance / inputs.attendance) * 100
      : 100;
  let beScore: number;
  let beDetail: string;
  if (breakEvenPct <= 40) { beScore = 10; beDetail = `Break even at ${breakEvenPct.toFixed(0)}% capacity — very safe`; }
  else if (breakEvenPct <= 55) { beScore = 8; beDetail = `Break even at ${breakEvenPct.toFixed(0)}% capacity — safe`; }
  else if (breakEvenPct <= 70) { beScore = 6; beDetail = `Break even at ${breakEvenPct.toFixed(0)}% capacity — moderate`; }
  else if (breakEvenPct <= 85) { beScore = 4; beDetail = `Break even at ${breakEvenPct.toFixed(0)}% capacity — tight`; }
  else if (breakEvenPct <= 100) { beScore = 2; beDetail = `Break even at ${breakEvenPct.toFixed(0)}% capacity — risky`; }
  else { beScore = 0; beDetail = "Cannot break even at full capacity"; }
  factors.push({ name: "Break-Even Safety", score: beScore, weight: 0.25, detail: beDetail });

  // Factor 3: Profit per Guest (weight 0.20)
  const rpg = outputs.profitPerGuest;
  let rpgScore: number;
  let rpgDetail: string;
  if (rpg >= 30) { rpgScore = 10; rpgDetail = `$${rpg.toFixed(0)}/guest profit — premium`; }
  else if (rpg >= 20) { rpgScore = 8; rpgDetail = `$${rpg.toFixed(0)}/guest profit — strong`; }
  else if (rpg >= 12) { rpgScore = 6; rpgDetail = `$${rpg.toFixed(0)}/guest profit — good`; }
  else if (rpg >= 5) { rpgScore = 4; rpgDetail = `$${rpg.toFixed(0)}/guest profit — low`; }
  else { rpgScore = 2; rpgDetail = `$${rpg.toFixed(0)}/guest profit — very low`; }
  factors.push({ name: "Profit per Guest", score: rpgScore, weight: 0.20, detail: rpgDetail });

  // Factor 4: Cost Efficiency (weight 0.15)
  const costRatio =
    outputs.totalRevenue > 0
      ? (outputs.totalCosts / outputs.totalRevenue) * 100
      : 100;
  const costEfficiency = 1 - outputs.totalCosts / Math.max(1, outputs.totalRevenue);
  let costScore: number;
  let costDetail: string;
  if (costRatio <= 30) { costScore = 10; costDetail = `Costs are ${costRatio.toFixed(0)}% of revenue — lean`; }
  else if (costRatio <= 45) { costScore = 8; costDetail = `Costs are ${costRatio.toFixed(0)}% of revenue — efficient`; }
  else if (costRatio <= 60) { costScore = 6; costDetail = `Costs are ${costRatio.toFixed(0)}% of revenue — moderate`; }
  else if (costRatio <= 80) { costScore = 4; costDetail = `Costs are ${costRatio.toFixed(0)}% of revenue — heavy`; }
  else { costScore = 2; costDetail = `Costs are ${costRatio.toFixed(0)}% of revenue — unsustainable`; }
  // suppress unused variable warning
  void costEfficiency;
  factors.push({ name: "Cost Efficiency", score: costScore, weight: 0.15, detail: costDetail });

  // Factor 5: Event Scale (weight 0.10)
  let scaleScore: number;
  let scaleDetail: string;
  if (inputs.attendance >= 300) { scaleScore = 10; scaleDetail = `${inputs.attendance} attendees — large event`; }
  else if (inputs.attendance >= 150) { scaleScore = 8; scaleDetail = `${inputs.attendance} attendees — mid-size`; }
  else if (inputs.attendance >= 75) { scaleScore = 6; scaleDetail = `${inputs.attendance} attendees — intimate`; }
  else if (inputs.attendance >= 30) { scaleScore = 4; scaleDetail = `${inputs.attendance} attendees — small`; }
  else { scaleScore = 2; scaleDetail = `${inputs.attendance} attendees — very small`; }
  factors.push({ name: "Event Scale", score: scaleScore, weight: 0.10, detail: scaleDetail });

  return factors;
}

function scoreBudgetModeViability(
  inputs: CalculatorInputs,
  outputs: CalculatorOutputs
): ViabilityFactor[] {
  const factors: ViabilityFactor[] = [];
  const budgetLimit =
    inputs.totalBudget > 0
      ? inputs.totalBudget
      : (BUDGET_DEFAULTS_BY_TYPE[inputs.eventType as keyof typeof BUDGET_DEFAULTS_BY_TYPE] ??
         BUDGET_DEFAULTS_BY_TYPE.other);

  // Factor 1: Budget Utilization (weight 0.30)
  const utilization = Math.min(1, outputs.totalCosts / budgetLimit);
  const utilizationPct = utilization * 100;
  let utilScore: number;
  let utilDetail: string;
  if (utilizationPct <= 70) { utilScore = 10; utilDetail = `${utilizationPct.toFixed(0)}% of budget used — lots of headroom`; }
  else if (utilizationPct <= 85) { utilScore = 8; utilDetail = `${utilizationPct.toFixed(0)}% of budget used — comfortable`; }
  else if (utilizationPct <= 95) { utilScore = 6; utilDetail = `${utilizationPct.toFixed(0)}% of budget used — tight`; }
  else if (utilizationPct <= 105) { utilScore = 4; utilDetail = `${utilizationPct.toFixed(0)}% of budget used — over budget`; }
  else { utilScore = 0; utilDetail = `${utilizationPct.toFixed(0)}% of budget used — significantly over`; }
  factors.push({ name: "Budget Utilization", score: utilScore, weight: 0.30, detail: utilDetail });

  // Factor 2: Per-Attendee Metric (weight 0.25)
  const cpp = outputs.costPerAttendee;
  let cppScore: number;
  let cppDetail: string;
  if (inputs.eventType === "corporate") {
    if (cpp < 100) { cppScore = 10; cppDetail = `$${cpp.toFixed(0)}/attendee — efficient`; }
    else if (cpp < 150) { cppScore = 8; cppDetail = `$${cpp.toFixed(0)}/attendee — solid`; }
    else if (cpp < 200) { cppScore = 6; cppDetail = `$${cpp.toFixed(0)}/attendee — moderate`; }
    else { cppScore = 2; cppDetail = `$${cpp.toFixed(0)}/attendee — high cost`; }
  } else if (inputs.eventType === "wedding") {
    if (cpp < 200) { cppScore = 10; cppDetail = `$${cpp.toFixed(0)}/guest — excellent value`; }
    else if (cpp < 350) { cppScore = 8; cppDetail = `$${cpp.toFixed(0)}/guest — strong`; }
    else if (cpp < 500) { cppScore = 6; cppDetail = `$${cpp.toFixed(0)}/guest — moderate`; }
    else { cppScore = 2; cppDetail = `$${cpp.toFixed(0)}/guest — premium spend`; }
  } else {
    // birthday / other
    if (cpp < 75) { cppScore = 10; cppDetail = `$${cpp.toFixed(0)}/guest — great value`; }
    else if (cpp < 125) { cppScore = 8; cppDetail = `$${cpp.toFixed(0)}/guest — solid`; }
    else if (cpp < 200) { cppScore = 6; cppDetail = `$${cpp.toFixed(0)}/guest — moderate`; }
    else { cppScore = 2; cppDetail = `$${cpp.toFixed(0)}/guest — high spend`; }
  }
  factors.push({ name: "Per-Attendee Cost", score: cppScore, weight: 0.25, detail: cppDetail });

  // Factor 3: Vendor Coverage (weight 0.20)
  // Count how many recommended vendor categories are filled in
  let vendorsFilled = 0;
  let vendorsTotal = 0;
  if (inputs.eventType === "wedding") {
    vendorsTotal = 5;
    if (inputs.photographyCost > 0) vendorsFilled++;
    if (inputs.floralsCost > 0) vendorsFilled++;
    if (inputs.officiantCost > 0) vendorsFilled++;
    if (inputs.cakeCost > 0) vendorsFilled++;
    if (inputs.videographerCost > 0) vendorsFilled++;
  } else if (inputs.eventType === "corporate") {
    vendorsTotal = 3;
    if (inputs.avEquipmentCost > 0) vendorsFilled++;
    if (inputs.includeCatering) vendorsFilled++;
    if (inputs.speakerFee > 0) vendorsFilled++;
  } else if (inputs.eventType === "birthday") {
    vendorsTotal = 3;
    if (inputs.entertainmentCost > 0) vendorsFilled++;
    if (inputs.includeCatering) vendorsFilled++;
    if (inputs.venueCost > 0) vendorsFilled++;
  }
  const coveragePct = vendorsTotal > 0 ? (vendorsFilled / vendorsTotal) * 100 : 50;
  let coverageScore: number;
  let coverageDetail: string;
  if (coveragePct >= 100) { coverageScore = 10; coverageDetail = "All vendor categories planned"; }
  else if (coveragePct >= 80) { coverageScore = 8; coverageDetail = `${coveragePct.toFixed(0)}% vendor coverage — nearly complete`; }
  else if (coveragePct >= 60) { coverageScore = 6; coverageDetail = `${coveragePct.toFixed(0)}% vendor coverage — gaps present`; }
  else if (coveragePct >= 40) { coverageScore = 4; coverageDetail = `${coveragePct.toFixed(0)}% vendor coverage — many gaps`; }
  else { coverageScore = 2; coverageDetail = `${coveragePct.toFixed(0)}% vendor coverage — incomplete plan`; }
  factors.push({ name: "Vendor Coverage", score: coverageScore, weight: 0.20, detail: coverageDetail });

  // Factor 4: Cost Efficiency (weight 0.15)
  const costToBudgetRatio = outputs.totalCosts / budgetLimit;
  let effScore: number;
  let effDetail: string;
  if (costToBudgetRatio <= 0.70) { effScore = 10; effDetail = "Well within budget — very efficient"; }
  else if (costToBudgetRatio <= 0.85) { effScore = 8; effDetail = "Efficiently within budget"; }
  else if (costToBudgetRatio <= 1.00) { effScore = 6; effDetail = "Near budget ceiling"; }
  else if (costToBudgetRatio <= 1.15) { effScore = 3; effDetail = "Over budget — review costs"; }
  else { effScore = 1; effDetail = "Significantly over budget"; }
  factors.push({ name: "Cost Efficiency", score: effScore, weight: 0.15, detail: effDetail });

  // Factor 5: Event Scale (weight 0.10)
  let scaleScore: number;
  let scaleDetail: string;
  if (inputs.attendance >= 300) { scaleScore = 10; scaleDetail = `${inputs.attendance} guests — large event`; }
  else if (inputs.attendance >= 150) { scaleScore = 8; scaleDetail = `${inputs.attendance} guests — mid-size`; }
  else if (inputs.attendance >= 75) { scaleScore = 6; scaleDetail = `${inputs.attendance} guests — intimate`; }
  else if (inputs.attendance >= 30) { scaleScore = 4; scaleDetail = `${inputs.attendance} guests — small`; }
  else { scaleScore = 2; scaleDetail = `${inputs.attendance} guests — very small`; }
  factors.push({ name: "Event Scale", score: scaleScore, weight: 0.10, detail: scaleDetail });

  return factors;
}

export function scoreViability(inputs: CalculatorInputs, outputs: CalculatorOutputs): ViabilityScore {
  const isBudgetMode = ["wedding", "corporate", "birthday"].includes(inputs.eventType);

  const factors: ViabilityFactor[] = isBudgetMode
    ? scoreBudgetModeViability(inputs, outputs)
    : scoreNightlifeViability(inputs, outputs);

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
// Fix 12: Named viability tier (0-100 scale)
// ============================================

export function getViabilityTier(score: number): {
  label: string;
  emoji: string;
  description: string;
  color: string;
} {
  if (score >= 85) return { label: "Top Shelf", emoji: "🥂", description: "Exceptional economics. This event is worth scaling.", color: "text-purple-500" };
  if (score >= 70) return { label: "Solid Night", emoji: "⚡", description: "Top-quartile margin for this event type.", color: "text-blue-500" };
  if (score >= 55) return { label: "Worth Running", emoji: "✅", description: "Solid event. You're in the profitable zone.", color: "text-green-500" };
  if (score >= 40) return { label: "Tread Carefully", emoji: "⚠️", description: "Breakeven is possible. See the tips below.", color: "text-yellow-500" };
  return { label: "Don't Book It", emoji: "🚫", description: "This event loses money at current inputs.", color: "text-red-500" };
}

// ============================================
// Fix 13: Scenario comparison helper
// ============================================

export function calculateScenarios(inputs: CalculatorInputs) {
  const conservative = calculate({ ...inputs, attendance: Math.floor(inputs.attendance * 0.60) });
  const realistic = calculate({ ...inputs, attendance: Math.floor(inputs.attendance * 0.80) });
  const optimistic = calculate({ ...inputs }); // full attendance
  return { conservative, realistic, optimistic };
}

// ============================================
// Fix 14: Annual potential helper
// ============================================

export function calculateAnnualPotential(result: CalculatorResult, eventsPerYear: number) {
  return {
    annualRevenue: result.totalRevenue * eventsPerYear,
    annualCosts: result.totalCosts * eventsPerYear,
    annualTakeHome: result.yourTakeHome * eventsPerYear,
    annualClublessFees: result.clublessFee * eventsPerYear,
  };
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
  eventType: "nightlife",

  // Revenue
  attendance: 200,
  ticketPrice: 22,           // was 25 — Seattle club night median
  drinksPerAttendee: 3,
  drinkPrice: 12,

  // Base costs
  venueCost: 2500,           // was 2000 — updated Seattle market rate
  equipmentCost: 500,

  // Duration
  eventDurationHours: 6,

  // Staffing
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

  // Catering
  includeCatering: false,
  cateringMode: "per-person",
  cateringGuests: 200,
  cateringCostPerPerson: 12,
  cateringPackageCost: 2500,

  // Fees
  serviceMarkupPercent: 20,
  isProfitShare: false,
  serviceFeePercent: 20,

  // Nightlife-specific
  djTalentCost: 700,
  marketingBudget: 400,
  barRevenueOwnership: "host",
  eventInsurance: 150,

  // All event types
  contingencyPercent: 10,

  // Budget mode default
  totalBudget: 10000,

  // Wedding-specific
  photographyCost: 5000,
  floralsCost: 5500,
  officiantCost: 450,
  cakeCost: 600,
  videographerCost: 0,

  // Corporate-specific
  avEquipmentCost: 2000,
  speakerFee: 0,

  // Birthday-specific
  entertainmentCost: 800,
};
