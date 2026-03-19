import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

// Locked rates (non-editable)
const BARTENDER_RATE = 40;
const SECURITY_RATE = 25;

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

  // User inputs - Revenue
  const [attendance, setAttendance] = useState(200);
  const [ticketPrice, setTicketPrice] = useState(25);
  const [drinksPerAttendee, setDrinksPerAttendee] = useState(3);
  const [drinkPrice, setDrinkPrice] = useState(12);
  
  // Base costs
  const [venueCost, setVenueCost] = useState(2000);
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
  const [cateringGuests, setCateringGuests] = useState(200); // Will sync with attendance
  const [cateringCostPerPerson, setCateringCostPerPerson] = useState(12);
  const [cateringPackageCost, setCateringPackageCost] = useState(2500);
  
  // Service markup
  const [serviceMarkupPercent, setServiceMarkupPercent] = useState(20);

  // Fee model toggle — pre-select from prop or URL param (?model=profit-share)
  const [isProfitShare, setIsProfitShare] = useState(() => (defaultModel ?? searchParams.get("model")) === "profit-share");

  // Get effective service fee (user's level fee or default 20%)
  const effectiveServiceFee = useMemo(() => {
    if (isProfitShare) return 50; // Profit share is always 50%
    return userLevel?.service_fee_percent ?? 20;
  }, [userLevel, isProfitShare]);

  // Smart staffing auto-fill function
  const handleAutoFillStaffing = () => {
    // Bartenders: 1 per 75 attendees, minimum 1
    const recommendedBartenders = Math.max(1, Math.ceil(attendance / 75));
    // Security: 1 per 100 attendees, minimum 1
    const recommendedSecurity = Math.max(1, Math.ceil(attendance / 100));
    
    // Enable and set bartending
    setIncludeBartending(true);
    setNumBartenders(recommendedBartenders);
    setBartenderHours(eventDurationHours);
    
    // Enable and set security
    setIncludeSecurity(true);
    setNumSecurity(recommendedSecurity);
    setSecurityHours(eventDurationHours);
    
    // Show the override note
    setShowAutoFillNote(true);
  };
  const staffingBreakdown = useMemo(() => {
    const items = [];
    
    if (includeBartending) {
      items.push({
        name: "Bartending",
        qty: numBartenders,
        hours: bartenderHours,
        rate: BARTENDER_RATE,
        subtotal: numBartenders * bartenderHours * BARTENDER_RATE,
        locked: true,
      });
    }
    
    if (includeSecurity) {
      items.push({
        name: "Security",
        qty: numSecurity,
        hours: securityHours,
        rate: SECURITY_RATE,
        subtotal: numSecurity * securityHours * SECURITY_RATE,
        locked: true,
      });
    }
    
    if (includeDoorStaff) {
      items.push({
        name: "Door Staff",
        qty: numDoorStaff,
        hours: doorStaffHours,
        rate: doorStaffRate,
        subtotal: numDoorStaff * doorStaffHours * doorStaffRate,
        locked: false,
      });
    }
    
    if (includeSetupCrew) {
      items.push({
        name: "Setup/Teardown",
        qty: numSetupCrew,
        hours: setupCrewHours,
        rate: setupCrewRate,
        subtotal: numSetupCrew * setupCrewHours * setupCrewRate,
        locked: false,
      });
    }
    
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    
    return { items, total };
  }, [
    includeBartending, numBartenders, bartenderHours,
    includeSecurity, numSecurity, securityHours,
    includeDoorStaff, numDoorStaff, doorStaffHours, doorStaffRate,
    includeSetupCrew, numSetupCrew, setupCrewHours, setupCrewRate,
  ]);

  // Catering calculations
  const cateringBreakdown = useMemo(() => {
    if (!includeCatering) {
      return { cost: 0, mode: cateringMode, guests: 0, perPersonRate: 0, packageCost: 0 };
    }
    
    if (cateringMode === "per-person") {
      return {
        cost: cateringGuests * cateringCostPerPerson,
        mode: cateringMode,
        guests: cateringGuests,
        perPersonRate: cateringCostPerPerson,
        packageCost: 0,
      };
    } else {
      return {
        cost: cateringPackageCost,
        mode: cateringMode,
        guests: 0,
        perPersonRate: 0,
        packageCost: cateringPackageCost,
      };
    }
  }, [includeCatering, cateringMode, cateringGuests, cateringCostPerPerson, cateringPackageCost]);

  // Services total with markup (staffing + catering only, not venue)
  const servicesBreakdown = useMemo(() => {
    const staffingCost = staffingBreakdown.total;
    const cateringCost = cateringBreakdown.cost;
    const subtotal = staffingCost + cateringCost;
    const markupPercent = serviceMarkupPercent / 100;
    const markupAmount = subtotal * markupPercent;
    const total = subtotal + markupAmount;
    
    return {
      staffingCost,
      cateringCost,
      subtotal,
      markupPercent: serviceMarkupPercent,
      markupAmount,
      total,
    };
  }, [staffingBreakdown.total, cateringBreakdown.cost, serviceMarkupPercent]);

  const calculations = useMemo(() => {
    // Revenue calculations
    const ticketRevenue = attendance * ticketPrice;
    const barRevenue = attendance * drinksPerAttendee * drinkPrice;
    const totalRevenue = ticketRevenue + barRevenue;

    // Cost calculations (venue + equipment + services total with markup)
    const totalCosts = venueCost + equipmentCost + servicesBreakdown.total;

    // Net profit before Clubless fee
    const netEventProfit = Math.max(0, totalRevenue - totalCosts);

    // Clubless fee calculation - use user's level fee or default
    let clublessFee: number;
    let feePercentage: number;
    
    if (isProfitShare) {
      clublessFee = netEventProfit * 0.5;
      feePercentage = 50;
    } else {
      const serviceFeeRate = effectiveServiceFee / 100;
      clublessFee = netEventProfit * serviceFeeRate;
      feePercentage = effectiveServiceFee;
    }

    // Final take-home
    const yourTakeHome = netEventProfit - clublessFee;
    const yourPercentage = netEventProfit > 0 ? (yourTakeHome / netEventProfit) * 100 : 0;
    const profitPerGuest = attendance > 0 ? yourTakeHome / attendance : 0;

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
    };
  }, [attendance, ticketPrice, drinksPerAttendee, drinkPrice, venueCost, equipmentCost, servicesBreakdown.total, isProfitShare, effectiveServiceFee]);

  // Sync catering guests with attendance when in per-person mode
  const handleAttendanceChange = (value: number) => {
    setAttendance(value);
    if (cateringMode === "per-person" && cateringGuests === attendance) {
      setCateringGuests(value);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const yourShareWidth = calculations.netEventProfit > 0 
    ? (calculations.yourTakeHome / calculations.netEventProfit) * 100 
    : 0;

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
                Revenue
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

          <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">
            {/* Inputs Column */}
            <div className="lg:col-span-3 space-y-6">
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
                  </div>

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
                </div>
              </div>

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
              </div>

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
                
                {/* Smart Staffing Suggestions */}
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
                        <div className={`p-4 rounded-xl border transition-all cursor-pointer ${cateringMode === "per-person" ? 'bg-primary/20 border-primary/40' : 'bg-secondary/30 border-border/50'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <RadioGroupItem value="per-person" id="per-person" />
                            <Label htmlFor="per-person" className="font-semibold cursor-pointer">Per-Person</Label>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">Cost per guest</p>
                        </div>
                        <div className={`p-4 rounded-xl border transition-all cursor-pointer ${cateringMode === "flat" ? 'bg-primary/20 border-primary/40' : 'bg-secondary/30 border-border/50'}`}>
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
                                max={100}
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
                        <p>This markup covers the cost of staff coordination, scheduling, and operational overhead. Applied to staffing + catering only (not venue rental).</p>
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
                      <div className={`flex-1 p-4 rounded-xl transition-all ${!isProfitShare ? 'bg-primary/20 border border-primary/40' : 'bg-secondary/50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Service Fee</span>
                          {!isProfitShare && <Sparkles className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {effectiveServiceFee}% of net profit
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
                      
                      <div className={`flex-1 p-4 rounded-xl transition-all ${isProfitShare ? 'bg-accent/20 border border-accent/40' : 'bg-secondary/50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Profit Share</span>
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
                      ? `As a ${userLevel.level_name}, you keep ${100 - effectiveServiceFee}% of net profits.`
                      : "Service Fee is our standard model. You keep 80% of net profits."}
                </p>
              </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Profit Card */}
              <div className="relative rounded-2xl overflow-hidden sticky top-24">
                <div className="absolute inset-0 bg-primary opacity-90" />
                <div className="relative z-10 p-6 md:p-8 text-center">
                  <p className="text-primary-foreground/70 text-sm uppercase tracking-wider mb-2">
                    You Take Home
                  </p>
                  <div className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-2">
                    {formatCurrency(calculations.yourTakeHome)}
                  </div>
                  <p className="text-primary-foreground/80 text-sm">
                    {formatCurrency(calculations.profitPerGuest)} per guest • {calculations.yourPercentage.toFixed(0)}% of profit
                  </p>
                </div>
              </div>

              {/* Profit Split Visualization */}
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
                    <span className="font-semibold text-primary">{formatCurrency(calculations.yourTakeHome)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clubless: </span>
                    <span className="font-semibold text-accent">{formatCurrency(calculations.clublessFee)}</span>
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Revenue
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Ticket className="w-4 h-4" /> Ticket Sales
                    </span>
                    <span className="font-medium">{formatCurrency(calculations.ticketRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Wine className="w-4 h-4" /> Bar Revenue
                    </span>
                    <span className="font-medium">{formatCurrency(calculations.barRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-semibold">Total Revenue</span>
                    <span className="font-bold text-lg">{formatCurrency(calculations.totalRevenue)}</span>
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
                  <div className="flex justify-between items-center py-3">
                    <span className="font-semibold">Total Costs</span>
                    <span className="font-bold text-lg text-destructive">-{formatCurrency(calculations.totalCosts)}</span>
                  </div>
                </div>
              </div>

              {/* Final Summary */}
              <div className="glass rounded-2xl p-6 border-2 border-primary/30">
                <h3 className="font-display font-semibold mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Net Event Profit</span>
                    <span className="font-medium">{formatCurrency(calculations.netEventProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">
                      Clubless Fee ({calculations.feePercentage}%)
                    </span>
                    <span className="font-medium text-accent">-{formatCurrency(calculations.clublessFee)}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-t-2 border-primary/30">
                    <span className="font-display font-bold text-lg">You Take Home</span>
                    <span className="font-display font-bold text-2xl text-gradient">
                      {formatCurrency(calculations.yourTakeHome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  These numbers are estimates based on your inputs. Actual results may vary based on 
                  attendance, bar sales, and other factors. Final costs and fees will be confirmed 
                  during event planning.
                </p>
              </div>

              {/* CTA */}
              <Button variant="default" size="lg" className="w-full" asChild>
                <Link 
                  to="/submit" 
                  state={{ 
                    calculatorData: {
                      attendance,
                      ticketPrice,
                      totalRevenue: calculations.totalRevenue,
                      totalCosts: calculations.totalCosts,
                      staffingCost: staffingBreakdown.total,
                      netProfit: calculations.netEventProfit,
                      yourTakeHome: calculations.yourTakeHome,
                      feeModel: isProfitShare ? "profit-share" : "service-fee",
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
  return (
    <Layout>
      <CalculatorContent />
    </Layout>
  );
}
