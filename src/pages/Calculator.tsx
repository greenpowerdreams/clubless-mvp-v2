import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  ArrowRight,
  Users,
  Ticket,
  Wine,
  Building2,
  UserCog,
  Wrench,
  TrendingUp,
  DollarSign,
  PieChart,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function Calculator() {
  // User inputs
  const [attendance, setAttendance] = useState(200);
  const [ticketPrice, setTicketPrice] = useState(25);
  const [drinksPerAttendee, setDrinksPerAttendee] = useState(3);
  const [drinkPrice, setDrinkPrice] = useState(12);
  const [venueCost, setVenueCost] = useState(2000);
  const [staffingCost, setStaffingCost] = useState(1500);
  const [equipmentCost, setEquipmentCost] = useState(500);
  
  // Fee model toggle: false = Service Fee (15%), true = Profit Share (50/50)
  const [isProfitShare, setIsProfitShare] = useState(false);

  const calculations = useMemo(() => {
    // Revenue calculations
    const ticketRevenue = attendance * ticketPrice;
    const barRevenue = attendance * drinksPerAttendee * drinkPrice;
    const totalRevenue = ticketRevenue + barRevenue;

    // Cost calculations
    const totalCosts = venueCost + staffingCost + equipmentCost;

    // Net profit before Clubless fee
    const netEventProfit = Math.max(0, totalRevenue - totalCosts);

    // Clubless fee calculation based on model
    let clublessFee: number;
    let feePercentage: number;
    
    if (isProfitShare) {
      // 50/50 profit split
      clublessFee = netEventProfit * 0.5;
      feePercentage = 50;
    } else {
      // 15% service fee
      clublessFee = netEventProfit * 0.15;
      feePercentage = 15;
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
  }, [attendance, ticketPrice, drinksPerAttendee, drinkPrice, venueCost, staffingCost, equipmentCost, isProfitShare]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate percentages for the visual bar
  const yourShareWidth = calculations.netEventProfit > 0 
    ? (calculations.yourTakeHome / calculations.netEventProfit) * 100 
    : 0;

  return (
    <Layout>
      <section className="pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Event Profit <span className="text-gradient">Calculator</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Model your event economics and see exactly how much you could take home.
              Adjust the inputs to match your event vision.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">
            {/* Inputs Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Attendance & Tickets */}
              <div className="glass rounded-2xl p-6 md:p-8">
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Attendance & Tickets
                </h2>
                
                <div className="space-y-8">
                  {/* Attendance Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-sm font-medium">Expected Attendance</Label>
                      <span className="text-2xl font-display font-bold text-gradient">{attendance}</span>
                    </div>
                    <Slider
                      value={[attendance]}
                      onValueChange={(v) => setAttendance(v[0])}
                      min={50}
                      max={1000}
                      step={10}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>50</span>
                      <span>1,000</span>
                    </div>
                  </div>

                  {/* Ticket Price */}
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

              {/* Bar Revenue */}
              <div className="glass rounded-2xl p-6 md:p-8">
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                  <Wine className="w-5 h-5 text-primary" />
                  Bar Revenue
                </h2>
                
                <div className="grid sm:grid-cols-2 gap-8">
                  {/* Drinks per Attendee */}
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

                  {/* Drink Price */}
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

              {/* Costs */}
              <div className="glass rounded-2xl p-6 md:p-8">
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Event Costs
                </h2>
                
                <div className="grid sm:grid-cols-3 gap-6">
                  {/* Venue */}
                  <div className="space-y-2">
                    <Label htmlFor="venue" className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      Venue Rental
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="venue"
                        type="number"
                        value={venueCost}
                        onChange={(e) => setVenueCost(Number(e.target.value) || 0)}
                        className="pl-7"
                      />
                    </div>
                  </div>

                  {/* Staffing */}
                  <div className="space-y-2">
                    <Label htmlFor="staffing" className="flex items-center gap-2 text-sm">
                      <UserCog className="w-4 h-4 text-muted-foreground" />
                      Staffing
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="staffing"
                        type="number"
                        value={staffingCost}
                        onChange={(e) => setStaffingCost(Number(e.target.value) || 0)}
                        className="pl-7"
                      />
                    </div>
                  </div>

                  {/* Equipment */}
                  <div className="space-y-2">
                    <Label htmlFor="equipment" className="flex items-center gap-2 text-sm">
                      <Wrench className="w-4 h-4 text-muted-foreground" />
                      Equipment / Misc
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="equipment"
                        type="number"
                        value={equipmentCost}
                        onChange={(e) => setEquipmentCost(Number(e.target.value) || 0)}
                        className="pl-7"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Model Toggle */}
              <div className="glass rounded-2xl p-6 md:p-8">
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Clubless Fee Model
                </h2>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className={`flex-1 p-4 rounded-xl transition-all ${!isProfitShare ? 'bg-primary/20 border border-primary/40' : 'bg-secondary/50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Service Fee</span>
                          {!isProfitShare && <Sparkles className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">15% of net profit</p>
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
                    : "Service Fee is our standard model. You keep 85% of net profits."}
                </p>
              </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Profit Card */}
              <div className="relative rounded-2xl overflow-hidden sticky top-24">
                <div className="absolute inset-0 bg-gradient-primary opacity-90" />
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
                    className="h-full bg-gradient-primary transition-all duration-500 flex items-center justify-center text-xs font-medium text-primary-foreground"
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
                    <span className="text-muted-foreground">Staffing</span>
                    <span className="font-medium text-destructive/80">-{formatCurrency(staffingCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Equipment / Misc</span>
                    <span className="font-medium text-destructive/80">-{formatCurrency(equipmentCost)}</span>
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
              <Button variant="gradient" size="lg" className="w-full" asChild>
                <Link 
                  to="/submit" 
                  state={{ 
                    calculatorData: {
                      attendance,
                      ticketPrice,
                      totalRevenue: calculations.totalRevenue,
                      totalCosts: calculations.totalCosts,
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
    </Layout>
  );
}
