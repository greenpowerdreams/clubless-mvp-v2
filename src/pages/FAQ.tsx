import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ArrowRight, Mail } from "lucide-react";

const faqCategories = [
  {
    title: "For Event Creators",
    faqs: [
      {
        q: "How does the profit split work?",
        a: "You choose between two models: Service Fee (you keep 80%, we take 20% of net profit) or Profit Share (50/50 split, but we cover more upfront costs). Both models are designed so you only pay when you profit."
      },
      {
        q: "What costs are covered by Clubless?",
        a: "We handle venue licensing support, insurance coordination, and operational structure. Staffing costs (bartenders, security) are included in your event budget and deducted before profit calculations. You always see the full breakdown in our calculator."
      },
      {
        q: "How do I get paid after my event?",
        a: "After your event, you'll receive a full itemized revenue breakdown by email. Our team processes payouts and will reach out to coordinate your payment. You'll always know exactly what you made before anything is finalized."
      },
      {
        q: "Can I set my own ticket prices?",
        a: "Absolutely. Our calculator provides recommendations based on your costs and target profit margin, but you have full control over pricing. We'll warn you if your margin looks too thin."
      },
      {
        q: "What happens if my event doesn't sell enough tickets?",
        a: "With the Profit Share model, we share the risk with you. With Service Fee, you're responsible for covering costs, but our calculator helps you set realistic targets. We also help with promotion strategies."
      },
      {
        q: "How long does event approval take?",
        a: "Most events are reviewed within 24-48 hours. You'll receive email updates at each stage: submitted → under review → approved → published. Once approved, we help you get your event live."
      }
    ]
  },
  {
    title: "For Attendees",
    faqs: [
      {
        q: "How do I purchase tickets?",
        a: "Browse events on our Events page, select your tickets, and checkout securely via Stripe. You'll receive a confirmation email with your tickets immediately after purchase."
      },
      {
        q: "Are tickets refundable?",
        a: "Refund policies vary by event. Check the specific event page for details. Generally, refunds are available up to 48 hours before an event."
      },
      {
        q: "How do I access my tickets?",
        a: "After purchase, you'll receive a confirmation email with your ticket details and order number. On event day, show your confirmation email at the door for entry."
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All payments are processed through Stripe, a PCI-compliant payment processor. We never store your credit card information on our servers."
      }
    ]
  },
  {
    title: "For Vendors",
    faqs: [
      {
        q: "How do I become a verified vendor?",
        a: "Apply through our vendor application form. We review applications within 3-5 business days. Once approved, you can list your services and receive quote requests from event creators."
      },
      {
        q: "What vendor categories do you support?",
        a: "We support bartending, security, catering, AV equipment, decor, photo/video, DJ equipment, and general staffing. If your category isn't listed, select 'Other' and describe your services."
      },
      {
        q: "How do vendor payments work?",
        a: "Vendors are paid according to the quote they provide for each event. Payment is processed after the event completes, typically within 5-7 business days."
      },
      {
        q: "Can I set my own pricing?",
        a: "Yes. You define your pricing model (hourly, flat fee, or per-head) and rates. Event creators see your rates when requesting quotes."
      }
    ]
  },
  {
    title: "General",
    faqs: [
      {
        q: "What cities do you operate in?",
        a: "We're currently focused on Seattle, with plans to expand to other cities. If you're interested in hosting events in a new city, reach out. We're always looking to grow."
      },
      {
        q: "Do I need a liquor license to host an event?",
        a: "No. Clubless operates under existing licenses and handles the legal requirements. You focus on creating the experience; we handle the paperwork."
      },
      {
        q: "How do I contact support?",
        a: "Email us at andrew@clublesscollective.com. We typically respond within 24 hours. For logged-in users, you can also reply directly to any email we send you."
      },
      {
        q: "Is Clubless available for private events?",
        a: "Yes! Our platform supports both public ticketed events and private events. Contact us to discuss your specific needs."
      }
    ]
  }
];

export default function FAQ() {
  return (
    <Layout>
      {/* Hero */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <HelpCircle className="w-3 h-3 mr-1" />
              FAQ
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-5">
              Frequently Asked
              <br />
              <span className="text-primary">Questions</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Everything you need to know about hosting events, buying tickets, 
              and working with Clubless.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="pb-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            {faqCategories.map((category) => (
              <div key={category.title}>
                <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
                  {category.title}
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.faqs.map((faq, i) => (
                    <AccordionItem 
                      key={i} 
                      value={`${category.title}-${i}`}
                      className="bg-card border border-border rounded-xl px-6 data-[state=open]:bg-secondary/30"
                    >
                      <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-20 bg-card">
        <div className="container px-4">
          <div className="max-w-xl mx-auto text-center">
            <Mail className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Still Have Questions?
            </h2>
            <p className="text-muted-foreground mb-8">
              Can't find what you're looking for? We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <a href="mailto:andrew@clublesscollective.com">
                  Contact Support
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/calculator">Try the Calculator</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
