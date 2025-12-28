import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ArrowRight,
  Users,
  Ticket,
  Wine,
  TrendingUp,
  Info,
} from "lucide-react";

export default function Calculator() {
  const [guests, setGuests] = useState(200);
  const [ticketPrice, setTicketPrice] = useState(25);
  const [barSpendPerGuest, setBarSpendPerGuest] = useState(30);
  const [clublessRate, setClublessRate] = useState(20);

  const calculations = useMemo(() => {
    const ticketRevenue = guests * ticketPrice;
    const barRevenue = guests * barSpendPerGuest;
    const totalRevenue = ticketRevenue + barRevenue;

    const clublessFee = barRevenue * (clublessRate / 100);
    const processingFee = ticketRevenue * 0.029 + (ticketRevenue > 0 ? 0.3 * guests : 0);

    const yourProfit = totalRevenue - clublessFee - processingFee;
    const profitPerGuest = yourProfit / guests;
    const yourPercentage = (yourProfit / totalRevenue) * 100;

    return {
      ticketRevenue,
      barRevenue,
      totalRevenue,
      clublessFee,
      processingFee,
      yourProfit,
      profitPerGuest,
      yourPercentage,
    };
  }, [guests, ticketPrice, barSpendPerGuest, clublessRate]);

  return (
    <Layout>
      <section className="pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Profit <span className="text-gradient">Calculator</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              See exactly how much you could make hosting your own event. Adjust
              the sliders to match your expectations.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="glass rounded-2xl p-8">
              <h2 className="font-display text-xl font-semibold mb-8">
                Event Details
              </h2>

              <div className="space-y-8">
                {/* Guests */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Users className="w-4 h-4 text-primary" />
                      Expected Guests
                    </label>
                    <span className="text-2xl font-display font-bold text-gradient">
                      {guests}
                    </span>
                  </div>
                  <Slider
                    value={[guests]}
                    onValueChange={(v) => setGuests(v[0])}
                    min={50}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>50</span>
                    <span>1000</span>
                  </div>
                </div>

                {/* Ticket Price */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Ticket className="w-4 h-4 text-primary" />
                      Ticket Price
                    </label>
                    <span className="text-2xl font-display font-bold text-gradient">
                      ${ticketPrice}
                    </span>
                  </div>
                  <Slider
                    value={[ticketPrice]}
                    onValueChange={(v) => setTicketPrice(v[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Free</span>
                    <span>$100</span>
                  </div>
                </div>

                {/* Bar Spend */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Wine className="w-4 h-4 text-primary" />
                      Avg. Bar Spend per Guest
                    </label>
                    <span className="text-2xl font-display font-bold text-gradient">
                      ${barSpendPerGuest}
                    </span>
                  </div>
                  <Slider
                    value={[barSpendPerGuest]}
                    onValueChange={(v) => setBarSpendPerGuest(v[0])}
                    min={10}
                    max={80}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>$10</span>
                    <span>$80</span>
                  </div>
                </div>

                {/* Clubless Rate */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Clubless Fee (Bar Revenue)
                      <span className="text-xs text-muted-foreground">(varies by event)</span>
                    </label>
                    <span className="text-2xl font-display font-bold text-gradient">
                      {clublessRate}%
                    </span>
                  </div>
                  <Slider
                    value={[clublessRate]}
                    onValueChange={(v) => setClublessRate(v[0])}
                    min={15}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>15%</span>
                    <span>30%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              {/* Main Profit Card */}
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-primary opacity-90" />
                <div className="relative z-10 p-8 text-center">
                  <p className="text-primary-foreground/70 text-sm uppercase tracking-wider mb-2">
                    Your Estimated Profit
                  </p>
                  <div className="text-5xl md:text-6xl font-display font-bold text-primary-foreground mb-4">
                    ${calculations.yourProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-primary-foreground/80">
                    That's ${calculations.profitPerGuest.toFixed(2)} per guest •{" "}
                    {calculations.yourPercentage.toFixed(0)}% of total revenue
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-display font-semibold mb-6 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Revenue Breakdown
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Ticket Sales</span>
                    <span className="font-medium">
                      ${calculations.ticketRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground">Bar Revenue</span>
                    <span className="font-medium">
                      ${calculations.barRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-muted-foreground font-semibold">
                      Total Revenue
                    </span>
                    <span className="font-bold text-lg">
                      ${calculations.totalRevenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-center py-2 text-destructive/80">
                      <span>Clubless Fee ({clublessRate}% of bar)</span>
                      <span>
                        -${calculations.clublessFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-destructive/80">
                      <span>Processing Fees</span>
                      <span>
                        -${calculations.processingFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-4 border-t-2 border-primary/30">
                    <span className="font-display font-bold text-lg">
                      Your Take-Home
                    </span>
                    <span className="font-display font-bold text-2xl text-gradient">
                      ${calculations.yourProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comparison */}
              <div className="glass rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-2">
                  At a traditional club, you'd typically only receive:
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-bold text-destructive line-through opacity-60">
                    ${(calculations.totalRevenue * 0.2).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-sm text-muted-foreground">(~20% of revenue)</span>
                </div>
              </div>

              {/* CTA */}
              <Button variant="gradient" size="lg" className="w-full" asChild>
                <Link to="/submit">
                  Submit Your Event Proposal
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
