import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSEO } from "@/shared/hooks/useSEO";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowRight,
  Users,
  Ticket,
  Wine,
  Building2,
  Wrench,
  TrendingUp,
  DollarSign,
  PieChart,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  GlassWater,
  DoorOpen,
  HardHat,
  Lock,
  UtensilsCrossed,
  Percent,
  Info,
  Zap,
  Clock,
  Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EVENT_TYPES, type EventTypeId } from "@/lib/eventTypes";

// Engine imports — single source of truth for all calculations
import {
  calculate,
  scoreViability,
  getViabilityTier,
} from "@/features/calculator/calculator.engine";
import type { CalculatorInputs } from "@/features/calculator/calculator.types";
import {
  BUDGET_DEFAULTS_BY_TYPE,
  CATERING_DEFAULTS_BY_TYPE,
  BARTENDER_RATE,
  SECURITY_RATE,
} from "@/features/calculator/calculator.types";

// New component imports
import { ViabilityScoreCard } from "@/features/calculator/ViabilityScoreCard";
import { BreakEvenIndicator } from "@/features/calculator/BreakEvenIndicator";
import { ScenarioComparison } from "@/features/calculator/ScenarioComparison";
import { AnnualPotentialModule } from "@/features/calculator/AnnualPotentialModule";
import { ShareableScoreCard } from "@/features/calculator/ShareableScoreCard";

interface UserLevel {
  current_level: number;
  level_name: string;
  service_fee_percent: number;
}

export function CalculatorContent({ defaultModel }: { defaultModel?: string } = {}) {
  const [searchParams] = useSearchParams();

  // User level state
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fetch user level on mount
  useEffect(() => {
    const fetchUserLevel = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setIsLoggedIn(true);
        const { data } = await supabase.rpc("get_user_level", { p_user_id: session.user.id });
        if (data && data.length > 0) {
          setUserLevel(data[0] as UserLevel);
        }
      }
    };

    fetchUserLevel();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsLoggedIn(true);
        supabase.rpc("get_user_level", { p_user_id: session.user.id }).then(({ data }) => {
          if (data && data.length > 0) {
            setUserLevel(data[0] as UserLevel);
          }
        });
      } else {
        setIsLoggedIn(false);
        setUserLevel(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Event type
  const [eventType, setEventType] = useState<EventTypeId>("nightlife");
  const isNightlife = eventType === "nightlife";
  const isBudgetMode = !isNightlife;

  // Budget mode: total budget input (replaces revenue for non-nightlife)
  const [totalBudget, setTotalBudget] = useState(10000);

  // User inputs - Revenue
  const [attendance, setAttendance] = useState(200);
  const [ticketPrice, setTicketPrice] = useState(22);
  const [drinksPerAttendee, setDrinksPerAttendee] = useState(3);
  const [drinkPrice, setDrinkPrice] = useState(12);

  // Base costs
  const [venueCost, setVenueCost] = useState(2500);
  const [equipmentCost, setEquipmentCost] = useState(500);

  // Event duration for smart staffing
  const [eventDurationHours, setEventDurationHours] = useState(6);
  const [showAutoFillNote, setShowAutoFillNote] = useState(false);

  // Staffing toggles and inputs
  const [includeBartending, setIncludeBartending] = useState(true);
  const [numBartenders, setNumBartenders] = useState(2);
  const [bartenderHours, setBartenderHours] = useState(6);

  const [includeSecurity, setIncludeSecurity] = useState(true);
  const [numSecurity, setNumSecurity] = useState(2);
  const [securityHours, setSecurityHours] = useState(6);

  const [includeDoorStaff, setIncludeDoorStaff] = useState(false);
  const [numDoorStaff, setNumDoorStaff] = useState(1);
  const [doorStaffHours, setDoorStaffHours] = useState(5);
  const [doorStaffRate, setDoorStaffRate] = useState(25);

  const [includeSetupCrew, setIncludeSetupCrew] = useState(false);
  const [numSetupCrew, setNumSetupCrew] = useState(2);
  const [setupCrewHours, setSetupCrewHours] = useState(3);
  const [setupCrewRate, setSetupCrewRate] = useState(30);

  // Catering inputs
  const [includeCatering, setIncludeCatering] = useState(false);
  const [cateringMode, setCateringMode] = useState<"per-person" | "flat">("per-person");
  const [cateringGuests, setCateringGuests] = useState(200);
  const [cateringCostPerPerson, setCateringCostPerPerson] = useState(12);
  const [cateringPackageCost, setCateringPackageCost] = useState(2500);

  // Service markup
  const [serviceMarkupPercent, setServiceMarkupPercent] = useState(20);

  // Fee model toggle — pre-select from prop or URL param (?model=profit-share)
  const [isProfitShare, setIsProfitShare] = useState(() => (defaultModel ?? searchParams.get("model")) === "profit-share");

  // ── New state variables (Change 3) ────────────────────────────────────────

  // Nightlife-specific
  const [djTalentCost, setDjTalentCost] = useState(700);
  const [marketingBudget, setMarketingBudget] = useState(400);
  const [barRevenueOwnership, setBarRevenueOwnership] = useState<"host" | "venue">("host");
  const [eventInsurance, setEventInsurance] = useState(150);

  // All types
  const [contingencyPercent, setContingencyPercent] = useState(10);

  // Wedding-specific
  const [photographyCost, setPhotographyCost] = useState(5000);
  const [floralsCost, setFloralsCost] = useState(5500);
  const [officiantCost, setOfficiantCost] = useState(450);
  const [cakeCost, setCakeCost] = useState(600);
  const [videographerCost, setVideographerCost] = useState(0);

  // Corporate-specific
  const [avEquipmentCost, setAvEquipmentCost] = useState(2000);
  const [speakerFee, setSpeakerFee] = useState(0);

  // Birthday-specific
  const [entertainmentCost, setEntertainmentCost] = useState(800);

  // ── Effective service fee ──────────────────────────────────────────────────
  const effectiveServiceFee = useMemo(() => {
    if (isProfitShare) return 50;
    return userLevel?.service_fee_percent ?? 20;
  }, [userLevel, isProfitShare]);

  // ── Change 4: Reset defaults when event type changes ──────────────────────
  // Budget default tracking
  const hasCustomBudget = useRef(false);

  useEffect(() => {
    hasCustomBudget.current = false;
    setTotalBudget(BUDGET_DEFAULTS_BY_TYPE[eventType as keyof typeof BUDGET_DEFAULTS_BY_TYPE] ?? 10000);
    setCateringCostPerPerson(CATERING_DEFAULTS_BY_TYPE[eventType as keyof typeof CATERING_DEFAULTS_BY_TYPE] ?? 12);
    // Reset nightlife-specific staffing defaults
    if (eventType !== "nightlife") {
      setIncludeBartending(false);
      setIncludeSecurity(false);
    } else {
      setIncludeBartending(true);
      setIncludeSecurity(true);
    }
  }, [eventType]);

  // ── Build engine inputs object ─────────────────────────────────────────────
  const engineInputs: CalculatorInputs = {
    eventType: eventType as CalculatorInputs["eventType"],
    attendance,
    ticketPrice,
    drinksPerAttendee,
    drinkPrice,
    venueCost,
    equipmentCost,
    eventDurationHours,
    includeBartending,
    numBartenders,
    bartenderHours,
    includeSecurity,
    numSecurity,
    securityHours,
    includeDoorStaff,
    numDoorStaff,
    doorStaffHours,
    doorStaffRate,
    includeSetupCrew,
    numSetupCrew,
    setupCrewHours,
    setupCrewRate,
    includeCatering,
    cateringMode,
    cateringGuests,
    cateringCostPerPerson,
    cateringPackageCost,
    serviceMarkupPercent,
    isProfitShare,
    serviceFeePercent: effectiveServiceFee,
    djTalentCost,
    marketingBudget,
    barRevenueOwnership,
    eventInsurance,
    contingencyPercent,
    totalBudget,
    photographyCost,
    floralsCost,
    officiantCost,
    cakeCost,
    videographerCost,
    avEquipmentCost,
    speakerFee,
    entertainmentCost,
  };

  // ── Single engine computation (Change 2) ──────────────────────────────────
  const result = useMemo(() => calculate(engineInputs), [
    eventType, attendance, ticketPrice, drinksPerAttendee, drinkPrice,
    venueCost, equipmentCost, eventDurationHours,
    includeBartending, numBartenders, bartenderHours,
    includeSecurity, numSecurity, securityHours,
    includeDoorStaff, numDoorStaff, doorStaffHours, doorStaffRate,
    includeSetupCrew, numSetupCrew, setupCrewHours, setupCrewRate,
    includeCatering, cateringMode, cateringGuests, cateringCostPerPerson, cateringPackageCost,
    serviceMarkupPercent, isProfitShare, effectiveServiceFee,
    djTalentCost, marketingBudget, barRevenueOwnership, eventInsurance,
    contingencyPercent, totalBudget,
    photographyCost, floralsCost, officiantCost, cakeCost, videographerCost,
    avEquipmentCost, speakerFee, entertainmentCost,
  ]);

  // ── Viability score (0-10 from engine, 0-100 for ViabilityScoreCard) ──────
  const viability = useMemo(() => scoreViability(engineInputs, result), [result]);

  // The ViabilityScoreCard expects score 0-100 and factors with `label` field
  const viabilityScore100 = Math.round(viability.score * 10);
  const viabilityFactorsForCard = viability.factors.map((f) => ({
    label: f.name,
    weight: f.weight,
    score: f.score,
  }));

  // CalculatorResult = CalculatorOutputs + viability (for AnnualPotentialModule & ShareableScoreCard)
  const calculatorResult = useMemo(() => ({ ...result, viability }), [result, viability]);

  // Viability tier for ShareableScoreCard
  const viabilityTier = getViabilityTier(viabilityScore100);

  // Convenience aliases (keep the same names used in JSX below)
  const staffingBreakdown = result.staffingBreakdown;
  const cateringBreakdown = result.cateringBreakdown;
  const servicesBreakdown = result.servicesBreakdown;

  // Profit-split bar width
  const yourShareWidth = result.netEventProfit > 0
    ? (result.yourTakeHome / result.netEventProfit) * 100
    : 0;

  // Smart staffing auto-fill function
  const handleAutoFillStaffing = () => {
    const recommendedBartenders = Math.max(1, Math.ceil(attendance / 75));
    const recommendedSecurity = Math.max(1, Math.ceil(attendance / 100));

    setIncludeBartending(true);
    setNumBartenders(recommendedBartenders);
    setBartenderHours(eventDurationHours);

    setIncludeSecurity(true);
    setNumSecurity(recommendedSecurity);
    setSecurityHours(eventDurationHours);

    setShowAutoFillNote(true);
  };

  // Sync catering guests with attendance when in per-person mode
  const handleAttendanceChange = (value: number) => {
    setAttendance(value);
    if (cateringMode === "per-person" && cateringGuests === attendance) {
      setCateringGuests(value);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <section className="pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Event Profit <span className="text-gradient">Calculator</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Model your event economics and see exactly how much you could take home.
            </p>
            {/* Step indicator for mobile UX */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">1</span>
                {isBudgetMode ? "Budget" : "Revenue"}
              </span>
              <ArrowRight className="w-4 h-4" />
              <span className="flex items-center gap-1">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">2</span>
                Costs
              </span>
              <ArrowRight className="w-4 h-4" />
              <span className="flex items-center gap-1">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">3</span>
                Results
              </span>
            </div>
          </div>

          {/* Event Type Selector */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {EVENT_TYPES.map((type) => {
                const Icon = type.Icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setEventType(type.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      eventType === type.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card border border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">
            {/* Inputs Column */}
            <div className="lg:col-span-3 space-y-6 min-w-0">
              {/* Attendance & Tickets */}
              <div className="glass rounded-2xl p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Attendance & Tickets
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">How many people you expect and what you'll charge at the door</p>
                </div>
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-sm font-medium">Expected Attendance</Label>
                      <span className="text-2xl font-display font-bold text-gradient">{attendance}</span>
                    </div>
                    <Slider
                      value={[attendance]}
                      onValueChange={(v) => handleAttendanceChange(v[0])}
                      min={50}
                      max={1000}
                      step={10}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>50</span>
                      <span>1,000</span>
                    </div>
                    {/* Change 10: BreakEvenIndicator below attendance slider */}
                    {isNightlife && (
                      <BreakEvenIndicator
                        currentAttendance={attendance}
                        breakEvenAttendance={result.breakEvenAttendance ?? 0}
                        maxAttendance={500}
                        eventType={eventType}
                      />
                    )}
                  </div>

                  {isNightlife && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Ticket className="w-4 h-4 text-primary" />
                        Avg. Ticket Price
                      </Label>
                      <span className="text-2xl font-display font-bold text-gradient">${ticketPrice}</span>
                    </div>
                    <Slider
                      value={[ticketPrice]}
                      onValueChange={(v) => setTicketPrice(v[0])}
                      min={0}
                      max={150}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Free</span>
                      <span>$150</span>
                    </div>
                  </div>
                  )}
                </div>
              </div>

              {isNightlife && (
                <div className="glass rounded-2xl p-6 md:p-8">
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                      <Wine className="w-5 h-5 text-primary" />
                      Bar Revenue
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Estimated drink sales based on guest consumption</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <Label className="text-sm font-medium">Drinks per Guest</Label>
                        <span className="text-2xl font-display font-bold text-gradient">{drinksPerAttendee}</span>
                      </div>
                      <Slider
                        value={[drinksPerAttendee]}
                        onValueChange={(v) => setDrinksPerAttendee(v[0])}
                        min={1}
                        max={8}
                        step={1}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>1</span>
                        <span>8</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <Label className="text-sm font-medium">Avg. Drink Price</Label>
                        <span className="text-2xl font-display font-bold text-gradient">${drinkPrice}</span>
                      </div>
                      <Slider
                        value={[drinkPrice]}
                        onValueChange={(v) => setDrinkPrice(v[0])}
                        min={5}
                        max={25}
                        step={1}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>$5</span>
                        <span>$25</span>
                      </div>
                    </div>
                  </div>

                  {/* Change 6: Bar Revenue Ownership toggle */}
                  <div className="space-y-2 mt-6">
                    <Label className="text-sm font-medium">Bar Revenue</Label>
                    <p className="text-xs text-muted-foreground">Who keeps bar sales? Most venue deals give bar to the venue.</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={barRevenueOwnership === "host" ? "default" : "outline"}
                        onClick={() => setBarRevenueOwnership("host")}
                      >
                        I keep bar revenue
                      </Button>
                      <Button
                        size="sm"
                        variant={barRevenueOwnership === "venue" ? "default" : "outline"}
                        onClick={() => setBarRevenueOwnership("venue")}
                      >
                        Venue keeps bar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Change 6: Nightlife-specific costs (DJ + Marketing) */}
              {isNightlife && (
                <div className="glass rounded-2xl p-6 md:p-8">
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Nightlife Costs
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">DJ talent, marketing, and insurance. Common nightlife expenses.</p>
                  </div>
                  <div className="space-y-6">
                    {/* DJ/Talent Cost */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">DJ / Artist Fee</Label>
                      <p className="text-xs text-muted-foreground">Seattle working DJ: $500–$1,500 for a 4–6 hr set</p>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[djTalentCost]}
                          onValueChange={([v]) => setDjTalentCost(v)}
                          min={0}
                          max={5000}
                          step={100}
                          className="flex-1"
                        />
                        <span className="text-sm font-semibold w-20 text-right">${djTalentCost.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Marketing/Promo Budget */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Marketing / Promo Budget</Label>
                      <p className="text-xs text-muted-foreground">Typical: $200–$800 (5–15% of expected gross)</p>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[marketingBudget]}
                          onValueChange={([v]) => setMarketingBudget(v)}
                          min={0}
                          max={3000}
                          step={50}
                          className="flex-1"
                        />
                        <span className="text-sm font-semibold w-20 text-right">${marketingBudget.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Event Insurance */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Event Insurance</Label>
                      <p className="text-xs text-muted-foreground">Liability insurance, typically $100–$300</p>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[eventInsurance]}
                          onValueChange={([v]) => setEventInsurance(v)}
                          min={0}
                          max={1000}
                          step={25}
                          className="flex-1"
                        />
                        <span className="text-sm font-semibold w-20 text-right">${eventInsurance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isBudgetMode && (
                <div className="glass rounded-2xl p-6 md:p-8">
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      Total Budget
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Your total available budget for this event</p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-sm font-medium">Total Budget</Label>
                      <span className="text-2xl font-display font-bold text-gradient">{formatCurrency(totalBudget)}</span>
                    </div>
                    <Slider
                      value={[totalBudget]}
                      onValueChange={(v) => { hasCustomBudget.current = true; setTotalBudget(v[0]); }}
                      min={1000}
                      max={100000}
                      step={500}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>$1,000</span>
                      <span>$100,000</span>
                    </div>
                  </div>

                  {/* Change 7: Wedding-specific vendor fields */}
                  {eventType === "wedding" && (
                    <div className="space-y-4 border-t pt-4 mt-6">
                      <h4 className="text-sm font-medium">Wedding Vendors</h4>
                      <p className="text-xs text-muted-foreground">Seattle averages shown. Adjust to your actual quotes.</p>
                      {/* Photography */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Photography</Label>
                          <p className="text-xs text-muted-foreground">Seattle avg: $4,500–$6,500</p>
                        </div>
                        <Input
                          type="number"
                          value={photographyCost}
                          onChange={(e) => setPhotographyCost(Number(e.target.value))}
                          className="w-32"
                        />
                      </div>
                      {/* Florals */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Florals / Decor</Label>
                          <p className="text-xs text-muted-foreground">Seattle avg: $5,000–$8,000</p>
                        </div>
                        <Input
                          type="number"
                          value={floralsCost}
                          onChange={(e) => setFloralsCost(Number(e.target.value))}
                          className="w-32"
                        />
                      </div>
                      {/* Officiant */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Officiant</Label>
                          <p className="text-xs text-muted-foreground">Seattle avg: $300–$600</p>
                        </div>
                        <Input
                          type="number"
                          value={officiantCost}
                          onChange={(e) => setOfficiantCost(Number(e.target.value))}
                          className="w-32"
                        />
                      </div>
                      {/* Cake */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Wedding Cake / Desserts</Label>
                          <p className="text-xs text-muted-foreground">Typical: $400–$800</p>
                        </div>
                        <Input
                          type="number"
                          value={cakeCost}
                          onChange={(e) => setCakeCost(Number(e.target.value))}
                          className="w-32"
                        />
                      </div>
                      {/* Videographer */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Videographer (optional)</Label>
                          <p className="text-xs text-muted-foreground">Seattle avg: $2,500–$5,000</p>
                        </div>
                        <Input
                          type="number"
                          value={videographerCost}
                          onChange={(e) => setVideographerCost(Number(e.target.value))}
                          className="w-32"
                        />
                      </div>
                    </div>
                  )}

                  {/* Corporate-specific vendor fields */}
                  {eventType === "corporate" && (
                    <div className="space-y-4 border-t pt-4 mt-6">
                      <h4 className="text-sm font-medium">Corporate Extras</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">AV / Tech Equipment</Label>
                          <p className="text-xs text-muted-foreground">Screens, sound, lighting</p>
                        </div>
                        <Input
                          type="number"
                          value={avEquipmentCost}
                          onChange={(e) => setAvEquipmentCost(Number(e.target.value))}
                          className="w-32"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Speaker / Keynote Fee</Label>
                          <p className="text-xs text-muted-foreground">Optional external speaker</p>
                        </div>
                        <Input
                          type="number"
                          value={speakerFee}
                          onChange={(e) => setSpeakerFee(Number(e.target.value))}
                          className="w-32"
                        />
                      </div>
                    </div>
                  )}

                  {/* Birthday-specific vendor fields */}
                  {eventType === "birthday" && (
                    <div className="space-y-4 border-t pt-4 mt-6">
                      <h4 className="text-sm font-medium">Entertainment</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Entertainment Cost</Label>
                          <p className="text-xs text-muted-foreground">DJ, photo booth, performers</p>
                        </div>
                        <Input
                          type="number"
                          value={entertainmentCost}
                          onChange={(e) => setEntertainmentCost(Number(e.target.value))}
                          className="w-32"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="glass rounded-2xl p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Base Costs
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Fixed expenses you'll pay regardless of attendance</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="venue" className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      Venue Rental
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <NumberInput
                        id="venue"
                        value={venueCost}
                        onChange={setVenueCost}
                        min={0}
                        max={50000}
                        defaultValue={0}
                        className="pl-7"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="equipment" className="flex items-center gap-2 text-sm">
                      <Wrench className="w-4 h-4 text-muted-foreground" />
                      Equipment / Misc
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <NumberInput
                        id="equipment"
                        value={equipmentCost}
                        onChange={setEquipmentCost}
                        min={0}
                        max={20000}
                        defaultValue={0}
                        className="pl-7"
                      />
                    </div>
                  </div>
                </div>

                {/* Change 9: Contingency buffer input (all types) */}
                <div className="space-y-2 mt-6 pt-6 border-t border-border/50">
                  <Label className="text-sm font-medium">Contingency Buffer</Label>
                  <p className="text-xs text-muted-foreground">Industry standard: 10–15% buffer for overages</p>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[contingencyPercent]}
                      onValueChange={([v]) => setContingencyPercent(v)}
                      min={0}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-semibold w-12 text-right">{contingencyPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Staffing & Services */}
              <div className="glass rounded-2xl p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Staffing & Services
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Staff you'll need to run your event. We handle hiring and coordination.</p>
                </div>

                {/* Change 5: Smart Staffing Suggestions — nightlife only */}
                {isNightlife && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="font-semibold text-sm mb-1">Smart Staffing Suggestions</h3>
                          <p className="text-xs text-muted-foreground">
                            Auto-fill recommended staffing based on your event size and duration
                          </p>
                        </div>

                        <div className="flex items-end gap-4">
                          <div className="flex-1 space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Event Duration (hours)
                            </Label>
                            <NumberInput
                              min={1}
                              max={24}
                              value={eventDurationHours}
                              onChange={setEventDurationHours}
                              defaultValue={6}
                              className="h-9"
                            />
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleAutoFillStaffing}
                            className="gap-2"
                          >
                            <Zap className="w-4 h-4" />
                            Auto-fill Staffing
                          </Button>
                        </div>

                        {showAutoFillNote && (
                          <p className="text-xs text-primary flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Staffing auto-filled! You can override these numbers below.
                          </p>
                        )}

                        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
                          <p>• Bartenders: 1 per 75 guests ({Math.max(1, Math.ceil(attendance / 75))} recommended)</p>
                          <p>• Security: 1 per 100 guests ({Math.max(1, Math.ceil(attendance / 100))} recommended)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Bartending - Locked Rate */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <GlassWater className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Bartending</span>
                            <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              <Lock className="w-3 h-3" />
                              ${BARTENDER_RATE}/hr
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Professional bartenders</p>
                        </div>
                      </div>
                      <Switch checked={includeBartending} onCheckedChange={setIncludeBartending} />
                    </div>

                    {includeBartending && (
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                        <div className="space-y-2">
                          <Label className="text-xs">Number of Bartenders</Label>
                          <NumberInput
                            min={1}
                            max={10}
                            value={numBartenders}
                            onChange={setNumBartenders}
                            defaultValue={1}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Hours</Label>
                          <NumberInput
                            min={1}
                            max={12}
                            value={bartenderHours}
                            onChange={setBartenderHours}
                            defaultValue={6}
                            className="h-9"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Security - Locked Rate */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Security</span>
                            <span className="inline-flex items-center gap-1 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                              <Lock className="w-3 h-3" />
                              ${SECURITY_RATE}/hr
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Licensed security personnel</p>
                        </div>
                      </div>
                      <Switch checked={includeSecurity} onCheckedChange={setIncludeSecurity} />
                    </div>

                    {includeSecurity && (
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                        <div className="space-y-2">
                          <Label className="text-xs">Number of Security</Label>
                          <NumberInput
                            min={1}
                            max={10}
                            value={numSecurity}
                            onChange={setNumSecurity}
                            defaultValue={1}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Hours</Label>
                          <NumberInput
                            min={1}
                            max={12}
                            value={securityHours}
                            onChange={setSecurityHours}
                            defaultValue={6}
                            className="h-9"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Door Staff - Editable Rate */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <DoorOpen className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="font-semibold">Door Staff</span>
                          <p className="text-xs text-muted-foreground">ID check & guest list</p>
                        </div>
                      </div>
                      <Switch checked={includeDoorStaff} onCheckedChange={setIncludeDoorStaff} />
                    </div>

                    {includeDoorStaff && (
                      <div className="grid grid-cols-3 sm:gap-4 gap-3 mt-4 pt-4 border-t border-border/50">
                        <div className="space-y-2">
                          <Label className="text-xs">Qty</Label>
                          <NumberInput
                            min={1}
                            max={5}
                            value={numDoorStaff}
                            onChange={setNumDoorStaff}
                            defaultValue={1}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Hours</Label>
                          <NumberInput
                            min={1}
                            max={12}
                            value={doorStaffHours}
                            onChange={setDoorStaffHours}
                            defaultValue={5}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Rate ($/hr)</Label>
                          <NumberInput
                            min={15}
                            max={50}
                            value={doorStaffRate}
                            onChange={setDoorStaffRate}
                            defaultValue={25}
                            className="h-9"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Setup/Teardown Crew - Editable Rate */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <HardHat className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="font-semibold">Setup/Teardown Crew</span>
                          <p className="text-xs text-muted-foreground">Event setup & cleanup</p>
                        </div>
                      </div>
                      <Switch checked={includeSetupCrew} onCheckedChange={setIncludeSetupCrew} />
                    </div>

                    {includeSetupCrew && (
                      <div className="grid grid-cols-3 sm:gap-4 gap-3 mt-4 pt-4 border-t border-border/50">
                        <div className="space-y-2">
                          <Label className="text-xs">Qty</Label>
                          <NumberInput
                            min={1}
                            max={10}
                            value={numSetupCrew}
                            onChange={setNumSetupCrew}
                            defaultValue={2}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Hours</Label>
                          <NumberInput
                            min={1}
                            max={12}
                            value={setupCrewHours}
                            onChange={setSetupCrewHours}
                            defaultValue={3}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Rate ($/hr)</Label>
                          <NumberInput
                            min={15}
                            max={60}
                            value={setupCrewRate}
                            onChange={setSetupCrewRate}
                            defaultValue={30}
                            className="h-9"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Staffing Breakdown Table */}
                  {staffingBreakdown.items.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h3 className="text-sm font-semibold mb-4">Staffing Cost Breakdown</h3>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-xs">Service</TableHead>
                              <TableHead className="text-xs text-center">Qty</TableHead>
                              <TableHead className="text-xs text-center">Hours</TableHead>
                              <TableHead className="text-xs text-center">Rate</TableHead>
                              <TableHead className="text-xs text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {staffingBreakdown.items.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium text-sm">
                                  <div className="flex items-center gap-2">
                                    {item.name}
                                    {item.locked && (
                                      <Lock className="w-3 h-3 text-muted-foreground" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-sm">{item.qty}</TableCell>
                                <TableCell className="text-center text-sm">{item.hours}</TableCell>
                                <TableCell className="text-center text-sm">${item.rate}/hr</TableCell>
                                <TableCell className="text-right font-medium text-sm">
                                  {formatCurrency(item.subtotal)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={4} className="font-semibold">
                                Staffing Subtotal
                              </TableCell>
                              <TableCell className="text-right font-bold text-primary">
                                {formatCurrency(staffingBreakdown.total)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Catering Section */}
              <div className="glass rounded-2xl p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-primary" />
                    Catering
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Optional food service for your guests</p>
                </div>
                <div className="space-y-6">
                  {/* Include Catering Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold">Include Catering</span>
                        <p className="text-xs text-muted-foreground">Food service for your event</p>
                      </div>
                    </div>
                    <Switch checked={includeCatering} onCheckedChange={setIncludeCatering} />
                  </div>

                  {includeCatering && (
                    <div className="space-y-6">
                      {/* Catering Mode Selection */}
                      <RadioGroup
                        value={cateringMode}
                        onValueChange={(v) => setCateringMode(v as "per-person" | "flat")}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className={`p-4 rounded-xl border transition-all cursor-pointer ${cateringMode === "per-person" ? "bg-primary/20 border-primary/40" : "bg-secondary/30 border-border/50"}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <RadioGroupItem value="per-person" id="per-person" />
                            <Label htmlFor="per-person" className="font-semibold cursor-pointer">Per-Person</Label>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">Cost per guest</p>
                        </div>
                        <div className={`p-4 rounded-xl border transition-all cursor-pointer ${cateringMode === "flat" ? "bg-primary/20 border-primary/40" : "bg-secondary/30 border-border/50"}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <RadioGroupItem value="flat" id="flat" />
                            <Label htmlFor="flat" className="font-semibold cursor-pointer">Flat Package</Label>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">Fixed package price</p>
                        </div>
                      </RadioGroup>

                      {/* Per-Person Inputs */}
                      {cateringMode === "per-person" && (
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50">
                          <div className="space-y-2">
                            <Label className="text-xs">Number of Guests</Label>
                            <NumberInput
                              min={1}
                              max={1000}
                              value={cateringGuests}
                              onChange={setCateringGuests}
                              defaultValue={200}
                              className="h-9"
                            />
                            <p className="text-xs text-muted-foreground">Defaults to attendance</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Cost per Person</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <NumberInput
                                min={1}
                                max={200}
                                value={cateringCostPerPerson}
                                onChange={setCateringCostPerPerson}
                                defaultValue={12}
                                className="h-9 pl-7"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Flat Package Input */}
                      {cateringMode === "flat" && (
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                          <div className="space-y-2">
                            <Label className="text-xs">Package Cost</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <NumberInput
                                min={0}
                                max={50000}
                                value={cateringPackageCost}
                                onChange={setCateringPackageCost}
                                defaultValue={0}
                                className="h-9 pl-7"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Catering Summary */}
                      <div className="flex justify-between items-center p-4 rounded-xl bg-muted/30 border border-border">
                        <span className="font-medium">Catering Cost</span>
                        <span className="font-bold text-primary">{formatCurrency(cateringBreakdown.cost)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Markup Section */}
              <TooltipProvider>
                <div className="glass rounded-2xl p-6 md:p-8">
                  <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                    <Percent className="w-5 h-5 text-primary" />
                    Service Markup
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>This markup covers the cost of staff coordination, scheduling, and operational overhead. Applied to staffing only (not venue rental or catering).</p>
                      </TooltipContent>
                    </Tooltip>
                  </h2>

                  <div className="space-y-6">
                    {/* Markup Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <Label className="text-sm font-medium">Markup Percentage</Label>
                        <span className="text-2xl font-display font-bold text-gradient">{serviceMarkupPercent}%</span>
                      </div>
                      <Slider
                        value={[serviceMarkupPercent]}
                        onValueChange={(v) => setServiceMarkupPercent(v[0])}
                        min={0}
                        max={30}
                        step={1}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>0%</span>
                        <span>30%</span>
                      </div>
                    </div>

                    {/* Services Breakdown Table */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs">Item</TableHead>
                            <TableHead className="text-xs text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="text-sm">Staffing Subtotal</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(servicesBreakdown.staffingCost)}</TableCell>
                          </TableRow>
                          {includeCatering && (
                            <TableRow>
                              <TableCell className="text-sm">Catering</TableCell>
                              <TableCell className="text-right text-sm">{formatCurrency(servicesBreakdown.cateringCost)}</TableCell>
                            </TableRow>
                          )}
                          <TableRow className="border-t border-border">
                            <TableCell className="font-medium text-sm">Services Subtotal</TableCell>
                            <TableCell className="text-right font-medium text-sm">{formatCurrency(servicesBreakdown.subtotal)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-sm text-muted-foreground">
                              Markup ({servicesBreakdown.markupPercent}%)
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              +{formatCurrency(servicesBreakdown.markupAmount)}
                            </TableCell>
                          </TableRow>
                          <TableRow className="bg-muted/30">
                            <TableCell className="font-semibold">Services Total</TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              {formatCurrency(servicesBreakdown.total)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </TooltipProvider>

              {isNightlife && (
              <div className="glass rounded-2xl p-6 md:p-8">
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Clubless Fee Model
                </h2>

                {/* User Level Discount Banner */}
                {isLoggedIn && userLevel && userLevel.service_fee_percent < 20 && !isProfitShare && (
                  <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-green-400">
                          {userLevel.level_name} Discount Applied!
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Your service fee is {userLevel.service_fee_percent}% instead of 20%, saving you {20 - userLevel.service_fee_percent}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className={`flex-1 p-4 rounded-xl transition-all ${!isProfitShare ? "bg-primary/20 border border-primary/40" : "bg-secondary/50"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Service Fee</span>
                          {!isProfitShare && <Sparkles className="w-4 h-4 text-primary" />}
                        </div>
                        {/* Change 16: Updated fee label */}
                        <p className="text-sm text-muted-foreground">
                          {effectiveServiceFee}% of your net profit (after costs)
                          {isLoggedIn && userLevel && userLevel.service_fee_percent < 20 && (
                            <span className="ml-1 text-green-400">(Level discount)</span>
                          )}
                        </p>
                      </div>

                      <Switch
                        checked={isProfitShare}
                        onCheckedChange={setIsProfitShare}
                        className="data-[state=checked]:bg-accent"
                      />

                      <div className={`flex-1 p-4 rounded-xl transition-all ${isProfitShare ? "bg-accent/20 border border-accent/40" : "bg-secondary/50"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Partnership Model</span>
                          {isProfitShare && <Sparkles className="w-4 h-4 text-accent" />}
                        </div>
                        <p className="text-sm text-muted-foreground">50/50 split</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  {isProfitShare
                    ? "Profit Share includes premium services: marketing support, venue sourcing, and priority scheduling."
                    : isLoggedIn && userLevel
                      ? `As a ${userLevel.level_name}, you keep ${100 - effectiveServiceFee}% of your net profit after costs.`
                      : "Service Fee is our standard model. You keep 80% of your net profit after costs."}
                </p>
              </div>
              )}
            </div>

            {/* Results Column */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {/* Main Profit Card */}
              <div className="relative rounded-2xl overflow-hidden sticky top-24">
                <div className={`absolute inset-0 opacity-90 ${isBudgetMode && result.yourTakeHome < 0 ? "bg-destructive" : "bg-primary"}`} />
                <div className="relative z-10 p-6 md:p-8 text-center">
                  <p className="text-primary-foreground/70 text-sm uppercase tracking-wider mb-2">
                    {isBudgetMode
                      ? result.yourTakeHome < 0
                        ? "Over Budget By"
                        : "Remaining Budget"
                      : "You Take Home"}
                  </p>
                  <div className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-2">
                    {isBudgetMode && result.yourTakeHome < 0
                      ? formatCurrency(Math.abs(result.yourTakeHome))
                      : formatCurrency(result.yourTakeHome)}
                  </div>
                  <p className="text-primary-foreground/80 text-sm">
                    {isBudgetMode
                      ? `${formatCurrency(result.totalCosts)} spent of ${formatCurrency(totalBudget)}`
                      : `${formatCurrency(result.profitPerGuest)} per guest • ${result.yourPercentage.toFixed(0)}% of profit`}
                  </p>
                </div>
              </div>

              {/* Profit Split Visualization */}
              {isNightlife && (
              <div className="glass rounded-2xl p-6">
                <h3 className="font-display font-semibold mb-4">Profit Split</h3>
                <div className="h-8 rounded-full overflow-hidden bg-secondary flex">
                  <div
                    className="h-full bg-primary transition-all duration-500 flex items-center justify-center text-xs font-medium text-primary-foreground"
                    style={{ width: `${yourShareWidth}%` }}
                  >
                    {yourShareWidth > 20 && `You: ${yourShareWidth.toFixed(0)}%`}
                  </div>
                  <div
                    className="h-full bg-accent/60 transition-all duration-500 flex items-center justify-center text-xs font-medium text-accent-foreground"
                    style={{ width: `${100 - yourShareWidth}%` }}
                  >
                    {(100 - yourShareWidth) > 20 && `Clubless: ${(100 - yourShareWidth).toFixed(0)}%`}
                  </div>
                </div>
                <div className="flex justify-between mt-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Your share: </span>
                    <span className="font-semibold text-primary">{formatCurrency(result.yourTakeHome)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clubless: </span>
                    <span className="font-semibold text-accent">{formatCurrency(result.clublessFee)}</span>
                  </div>
                </div>
              </div>
              )}

              {/* Revenue Breakdown */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {isBudgetMode ? "Total Budget" : "Revenue"}
                </h3>
                <div className="space-y-3">
                  {isNightlife && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Ticket className="w-4 h-4" /> Ticket Sales
                        </span>
                        <span className="font-medium">{formatCurrency(result.ticketRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Wine className="w-4 h-4" /> Bar Revenue
                          {barRevenueOwnership === "venue" && (
                            <span className="text-xs text-muted-foreground">(venue keeps)</span>
                          )}
                        </span>
                        <span className="font-medium">{formatCurrency(result.barRevenue)}</span>
                      </div>
                    </>
                  )}
                  {isBudgetMode && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Budget
                      </span>
                      <span className="font-medium">{formatCurrency(totalBudget)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3">
                    <span className="font-semibold">{isBudgetMode ? "Total Budget" : "Total Revenue"}</span>
                    <span className="font-bold text-lg">{formatCurrency(result.totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Costs Breakdown */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-destructive" />
                  Costs
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Venue</span>
                    <span className="font-medium text-destructive/80">-{formatCurrency(venueCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Equipment / Misc</span>
                    <span className="font-medium text-destructive/80">-{formatCurrency(equipmentCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-muted-foreground flex items-center gap-2 cursor-help">
                            <Users className="w-4 h-4" /> Services (incl. markup)
                            <Info className="w-3 h-3" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Staffing + Catering + {servicesBreakdown.markupPercent}% markup</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="font-medium text-destructive/80">-{formatCurrency(servicesBreakdown.total)}</span>
                  </div>
                  {/* Change 8: Cost per attendee for corporate */}
                  {eventType === "corporate" && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Cost Per Attendee</span>
                      <span className="text-lg font-bold">${result.costPerAttendee.toFixed(0)}</span>
                    </div>
                  )}
                  {eventType === "wedding" && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Cost Per Guest</span>
                      <span className="text-lg font-bold">${result.costPerAttendee?.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3">
                    <span className="font-semibold">Total Costs</span>
                    <span className="font-bold text-lg text-destructive">-{formatCurrency(result.totalCosts)}</span>
                  </div>
                </div>
              </div>

              {/* Final Summary */}
              <div className="glass rounded-2xl p-6 border-2 border-primary/30">
                <h3 className="font-display font-semibold mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{isBudgetMode ? "Budget vs. Costs" : "Net Event Profit"}</span>
                    <span className={`font-medium ${isBudgetMode && result.netEventProfit < 0 ? "text-destructive" : ""}`}>
                      {formatCurrency(result.netEventProfit)}
                    </span>
                  </div>
                  {isNightlife && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">
                      Clubless Fee ({result.feePercentage}%)
                    </span>
                    <span className="font-medium text-accent">-{formatCurrency(result.clublessFee)}</span>
                  </div>
                  )}
                  <div className="flex justify-between items-center py-4 border-t-2 border-primary/30">
                    <span className="font-display font-bold text-lg">
                      {isBudgetMode
                        ? result.yourTakeHome < 0
                          ? "Over Budget By"
                          : "Remaining Budget"
                        : "You Take Home"}
                    </span>
                    <span className={`font-display font-bold text-2xl ${isBudgetMode && result.yourTakeHome < 0 ? "text-destructive" : "text-gradient"}`}>
                      {isBudgetMode && result.yourTakeHome < 0
                        ? formatCurrency(Math.abs(result.yourTakeHome))
                        : formatCurrency(result.yourTakeHome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Change 11: ViabilityScoreCard */}
              <ViabilityScoreCard
                score={viabilityScore100}
                factors={viabilityFactorsForCard}
                inputs={engineInputs}
                result={result}
                eventType={eventType}
              />

              {/* Change 12: ScenarioComparison */}
              <ScenarioComparison
                baseInputs={engineInputs}
                eventType={eventType}
                isNightlife={isNightlife}
              />

              {/* Change 13: AnnualPotentialModule */}
              <AnnualPotentialModule
                result={calculatorResult}
                eventType={eventType}
                isNightlife={isNightlife}
              />

              {/* Change 14: ShareableScoreCard */}
              <ShareableScoreCard
                result={calculatorResult}
                inputs={engineInputs}
                viabilityScore={viabilityScore100}
                viabilityTier={viabilityTier}
                eventType={eventType}
              />

              {/* Disclaimer */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  These numbers are estimates based on your inputs. Actual results may vary based on
                  attendance, bar sales, and other factors. Final costs and fees will be confirmed
                  during event planning.
                </p>
              </div>

              {/* Change 15: Viability score-based CTA */}
              {(() => {
                const score = viabilityScore100;
                if (score >= 60) return (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                    <p className="font-semibold text-green-400">Your event is ready.</p>
                    <p className="text-sm text-muted-foreground mb-3">List it on Clubless. Takes 10 minutes.</p>
                    <Button asChild>
                      <Link to="/submit">Submit This Event →</Link>
                    </Button>
                  </div>
                );
                if (score >= 40) return (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
                    <p className="font-semibold text-yellow-400">We've seen events like this succeed.</p>
                    <p className="text-sm text-muted-foreground mb-3">Adjust a few numbers or talk to an event advisor.</p>
                    <Button
                      asChild
                      variant="outline"
                    >
                      <Link to="/submit">Talk to an Advisor →</Link>
                    </Button>
                  </div>
                );
                return (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                    <p className="font-semibold text-red-400">Let's fix this plan.</p>
                    <p className="text-sm text-muted-foreground mb-3">Adjust ticket price, venue cost, or attendance to improve your score.</p>
                    <Button asChild variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                      <Link to="/submit">Talk to an Event Advisor →</Link>
                    </Button>
                  </div>
                );
              })()}

              {/* Hidden data passthrough for submit page */}
              <Button variant="default" size="lg" className="w-full sr-only" asChild>
                <Link
                  to="/submit"
                  state={{
                    calculatorData: {
                      attendance,
                      ticketPrice,
                      totalRevenue: result.totalRevenue,
                      totalCosts: result.totalCosts,
                      staffingCost: staffingBreakdown.total,
                      netProfit: result.netEventProfit,
                      yourTakeHome: result.yourTakeHome,
                      feeModel: isProfitShare ? "profit-share" : "service-fee",
                      eventType,
                    }
                  }}
                >
                  Submit This Event to Clubless
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Calculator() {
  useSEO({
    title: "Event Profit Calculator | Clubless Collective",
    description:
      "Free event profit calculator. Plan your nightlife event budget — bartenders, security, ticketing, marketing, and net profit. Built by Clubless Collective.",
    keywords:
      "event profit calculator, dj booking profit, event budget, nightlife profit, party profit calculator, event planning seattle",
    url: "/calculator",
    type: "website",
  });
  return (
    <Layout>
      <CalculatorContent />
    </Layout>
  );
}
