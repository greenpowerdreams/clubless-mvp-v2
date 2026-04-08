import { Layout } from "@/components/layout/Layout";

export default function Privacy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">
            Last updated: April 7, 2026
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">1. Information We Collect</h2>
          <p>
            When you use Clubless Collective, we collect information you provide directly: your name, email address, and payment information when purchasing tickets or booking services. We also collect usage data such as pages visited, events browsed, and features used to improve our platform.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">2. How We Use Your Information</h2>
          <p>
            We use your information to process ticket purchases and payouts, connect you with event hosts and vendors, send event confirmations and updates, and improve the Clubless platform. We do not sell your personal information to third parties.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">3. Data Ownership</h2>
          <p>
            Event creators own their attendee data. Clubless provides tools to export attendee lists and analytics. We believe creators should have full control over their audience relationships.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">4. Payment Processing</h2>
          <p>
            All payments are processed securely through Stripe. Clubless does not store credit card numbers or sensitive payment details on our servers.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">5. Cookies</h2>
          <p>
            We use essential cookies to maintain your session and preferences. We do not use third-party advertising cookies.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8">6. Contact</h2>
          <p>
            For privacy inquiries, contact us at{" "}
            <a href="mailto:andrew@clublesscollective.com" className="text-primary hover:underline">
              andrew@clublesscollective.com
            </a>.
          </p>
        </div>
      </div>
    </Layout>
  );
}
