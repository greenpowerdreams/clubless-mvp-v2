import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle
} from "lucide-react";

interface EventProposal {
  id: string;
  status: string;
  status_notes: string | null;
  status_updated_at: string;
  city: string;
  preferred_event_date: string;
  event_concept: string;
  fee_model: string;
  submitter_name: string;
  submitter_email: string;
  instagram_handle: string | null;
  full_calculator_json: Record<string, unknown> | null;
  projected_revenue: number | null;
  projected_costs: number | null;
  projected_profit: number | null;
  created_at: string;
  approved_at: string | null;
  published_at: string | null;
}

const STATUS_TIMELINE = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "approved", label: "Approved" },
  { key: "published", label: "Published" },
  { key: "completed", label: "Completed" },
];

export default function PortalEventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventProposal | null>(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/portal/login");
        return;
      }

      if (id) {
        const { data, error } = await supabase
          .from("event_proposals")
          .select("*")
          .eq("id", id)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching event:", error);
        } else if (!data) {
          navigate("/portal");
        } else {
          setEvent(data as EventProposal);
        }
      }
      
      setLoading(false);
    };

    checkAuthAndFetch();
  }, [id, navigate]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "—";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIndex = (status: string) => {
    const idx = STATUS_TIMELINE.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const getStatusIcon = (index: number, currentIndex: number, status: string) => {
    if (status === "rejected") {
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
    if (index < currentIndex) {
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    }
    if (index === currentIndex) {
      return <Clock className="w-5 h-5 text-primary" />;
    }
    return <Circle className="w-5 h-5 text-muted-foreground/30" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Event not found</p>
            <Button asChild>
              <Link to="/portal">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentStatusIndex = getStatusIndex(event.status);
  const calculatorData = event.full_calculator_json as Record<string, unknown> | null;

  return (
    <Layout>
      <section className="pt-8 pb-20 md:pt-12 md:pb-32">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button variant="ghost" asChild className="mb-6">
              <Link to="/portal">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>

            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-2xl md:text-3xl font-bold">
                  Event in <span className="text-gradient">{event.city}</span>
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.preferred_event_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {event.city}
                </span>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="glass rounded-2xl p-6 md:p-8 mb-8">
              <h2 className="font-display text-lg font-semibold mb-6">Status Timeline</h2>
              
              {event.status === "rejected" ? (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="font-medium text-red-400">Proposal Not Approved</p>
                    {event.status_notes && (
                      <p className="text-sm text-muted-foreground mt-1">{event.status_notes}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-muted-foreground/20" />
                  <div 
                    className="absolute left-[18px] top-6 w-0.5 bg-green-400 transition-all duration-500"
                    style={{ 
                      height: `${(currentStatusIndex / (STATUS_TIMELINE.length - 1)) * 100}%`,
                      maxHeight: "calc(100% - 48px)"
                    }}
                  />
                  
                  <div className="space-y-6">
                    {STATUS_TIMELINE.map((step, index) => (
                      <div key={step.key} className="flex items-start gap-4">
                        <div className="relative z-10 w-10 h-10 rounded-full bg-background border-2 border-muted flex items-center justify-center">
                          {getStatusIcon(index, currentStatusIndex, event.status)}
                        </div>
                        <div className="flex-1 pt-2">
                          <p className={`font-medium ${index <= currentStatusIndex ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </p>
                          {index === currentStatusIndex && event.status_notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.status_notes}
                            </p>
                          )}
                          {step.key === "submitted" && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.created_at).toLocaleDateString()}
                            </p>
                          )}
                          {step.key === "approved" && event.approved_at && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.approved_at).toLocaleDateString()}
                            </p>
                          )}
                          {step.key === "published" && event.published_at && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.published_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profit Breakdown */}
            <div className="glass rounded-2xl p-6 md:p-8 mb-8">
              <h2 className="font-display text-lg font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Profit Projection
              </h2>
              
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">Projected Revenue</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(event.projected_revenue)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">Projected Costs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(event.projected_costs)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-400 mb-1">Your Take-Home</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(event.projected_profit)}
                  </p>
                </div>
              </div>

              {calculatorData && (
                <div className="mt-6 p-4 rounded-xl bg-muted/30">
                  <p className="text-sm font-medium mb-2">Calculator Details</p>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {calculatorData.attendance && (
                      <p>Expected Attendance: {String(calculatorData.attendance)}</p>
                    )}
                    {calculatorData.ticketPrice && (
                      <p>Ticket Price: {formatCurrency(Number(calculatorData.ticketPrice))}</p>
                    )}
                    <p>Fee Model: {event.fee_model === "profit-share" ? "Profit Share (50/50)" : "Service Fee (15%)"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="glass rounded-2xl p-6 md:p-8">
              <h2 className="font-display text-lg font-semibold mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Submission Details
              </h2>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Event Concept</p>
                  <p className="text-foreground whitespace-pre-wrap">{event.event_concept}</p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Submitter</p>
                    <p className="text-foreground">{event.submitter_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="text-foreground">{event.submitter_email}</p>
                  </div>
                  {event.instagram_handle && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Instagram</p>
                      <p className="text-foreground">{event.instagram_handle}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fee Model</p>
                    <p className="text-foreground">
                      {event.fee_model === "profit-share" ? "Profit Share (50/50)" : "Service Fee (15%)"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
