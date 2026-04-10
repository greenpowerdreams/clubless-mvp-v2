import { Link } from "react-router-dom";
import { useSEO } from "@/shared/hooks/useSEO";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Beer, Users, DollarSign, Calendar } from "lucide-react";

export default function WhatIsClubless() {
  useSEO({
    title: "What is Clubless? | Clubless Collective",
    description:
      "Clubless Collective is an event operating system for nightlife creators in Seattle. Host profitable events without owning a venue. Licensed mobile bar, ticketing, vendors, and creator tools all in one place.",
    keywords:
      "what is clubless, clubless collective, clubless seattle, clubless explained, nightlife operating system, clubless meaning, clubless app",
    url: "/what-is-clubless",
    type: "article",
  });

  return (
    <Layout>
      <article className="container mx-auto px-4 py-20 max-w-3xl">
        <header className="mb-12 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
            What is <span className="text-primary">Clubless</span>?
          </h1>
          <p className="text-xl text-muted-foreground">
            The Personal Event Operating System for nightlife creators in Seattle.
          </p>
        </header>

        <section className="prose prose-invert max-w-none space-y-8">
          <p className="text-lg leading-relaxed">
            <strong>Clubless Collective</strong> is a platform that lets DJs, promoters, and event creators
            host profitable nightlife events without owning a venue. We handle the licensing, the bar, the
            ticketing, the vendors, and the operations — you bring the vibe, the music, and the audience.
          </p>

          <p className="text-lg leading-relaxed">
            We're built in Seattle and licensed by the Washington State Liquor and Cannabis Board. That
            means when you throw an event with Clubless, you're working with a licensed mobile bar
            operator, MAST-certified bartenders, and a full operational team — not just a tech platform.
          </p>

          <h2 className="font-display text-3xl font-bold mt-12 mb-4">Why "Clubless"?</h2>
          <p className="text-lg leading-relaxed">
            The traditional nightlife industry forces DJs and promoters to depend on clubs that take the
            biggest cut, control the door, and own the audience. Clubless flips that. You don't need a
            club to throw a great event — you need a platform that gives you the tools, the license, and
            the infrastructure to do it on your own terms.
          </p>

          <h2 className="font-display text-3xl font-bold mt-12 mb-4">What Clubless Offers</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose mt-6">
            <div className="rounded-lg border border-border p-6 bg-card">
              <Beer className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2">Licensed Mobile Bar</h3>
              <p className="text-muted-foreground">
                Washington State licensed bar service with MAST-certified bartenders for any private
                event in Seattle.
              </p>
            </div>
            <div className="rounded-lg border border-border p-6 bg-card">
              <Calendar className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2">Event Ticketing</h3>
              <p className="text-muted-foreground">
                Built-in ticketing with Stripe checkout, QR-code tickets, and creator payouts. Just
                8-10% platform fee.
              </p>
            </div>
            <div className="rounded-lg border border-border p-6 bg-card">
              <Users className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2">Vendor Marketplace</h3>
              <p className="text-muted-foreground">
                Book DJs, photographers, security, and more — all vetted by Clubless and ready to work
                in Seattle.
              </p>
            </div>
            <div className="rounded-lg border border-border p-6 bg-card">
              <DollarSign className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2">Creator Payouts</h3>
              <p className="text-muted-foreground">
                Transparent revenue split with fast Stripe payouts. You see every dollar that comes in
                and out.
              </p>
            </div>
          </div>

          <h2 className="font-display text-3xl font-bold mt-12 mb-4">Who Clubless Is For</h2>
          <ul className="text-lg space-y-2 list-disc list-inside">
            <li>DJs who want to throw their own ticketed events without splitting profits with a club</li>
            <li>Promoters running pop-up parties, art nights, or themed experiences</li>
            <li>Hosts planning weddings, birthdays, and corporate events that need a real bar</li>
            <li>Creators who want to build a brand, audience, and recurring revenue around live events</li>
          </ul>

          <h2 className="font-display text-3xl font-bold mt-12 mb-4">Built in Seattle</h2>
          <p className="text-lg leading-relaxed">
            Clubless Collective is based in Seattle and currently serves the greater Seattle metro area
            including Bellevue, Kirkland, Redmond, and Tacoma. We're expanding to other cities next.
          </p>
        </section>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/submit">
              Start Your Event <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/how-it-works">
              <Sparkles className="mr-2 w-4 h-4" /> How It Works
            </Link>
          </Button>
        </div>
      </article>
    </Layout>
  );
}
