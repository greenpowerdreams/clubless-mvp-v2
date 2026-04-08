import { Layout } from "@/components/layout/Layout";

export default function Terms() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">
            Last updated: April 7, 2026
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">1. Platform Overview</h2>
          <p>
            Clubless Collective is an event operating system that connects event hosts with vendors, venues, and attendees. By using our platform, you agree to these terms.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">2. For Event Hosts</h2>
          <p>
            Hosts are responsible for the accuracy of their event listings, compliance with local laws and venue policies, and fulfilling the experience described in their event. Clubless charges a platform fee of 8-10% on ticketed events, as detailed on our pricing page.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">3. For Attendees</h2>
          <p>
            Ticket purchases are subject to the refund policy set by each event host. A buyer service fee (5% or $1.50 flat per ticket) is added at checkout and is non-refundable. All ticket sales are final unless the event is cancelled by the host.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">4. For Vendors</h2>
          <p>
            Vendors on the Clubless marketplace agree to provide services as described in their profiles. Clubless charges a commission on vendor bookings made through the platform. There are no monthly fees or lead fees.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">5. Bar Service</h2>
          <p>
            Clubless Collective holds a Washington State liquor and catering license. All bar service operations comply with WA State Liquor and Cannabis Board regulations. Hosts booking bar service agree to adhere to all applicable laws regarding alcohol service.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">6. Payouts</h2>
          <p>
            Host payouts are processed after event completion via Stripe. Platform fees are deducted before payout. Payout timing and methods are detailed in your creator dashboard.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">7. Intellectual Property</h2>
          <p>
            Event content (descriptions, images, branding) remains the property of the host. Clubless may use event listings for promotional purposes on the platform.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">8. Contact</h2>
          <p>
            For questions about these terms, contact{" "}
            <a href="mailto:andrew@clublesscollective.com" className="text-primary hover:underline">
              andrew@clublesscollective.com
            </a>.
          </p>
        </div>
      </div>
    </Layout>
  );
}
