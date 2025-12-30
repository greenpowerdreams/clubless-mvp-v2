import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { 
  Crown, 
  Gift, 
  Calendar, 
  MapPin, 
  TrendingUp,
  ChevronRight,
  LogOut,
  Sparkles
} from "lucide-react";

interface EventProposal {
  id: string;
  status: string;
  city: string;
  preferred_event_date: string;
  projected_profit: number | null;
  created_at: string;
  submitter_name: string;
}

export default function Portal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventProposal[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/portal/login");
        } else {
          setUser(session.user);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/portal/login");
      } else {
        setUser(session.user);
        fetchEvents(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchEvents = async (userId: string) => {
    const { data, error } = await supabase
      .from("event_proposals")
      .select("id, status, city, preferred_event_date, projected_profit, created_at, submitter_name")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data || []);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getUserLevel = () => {
    const completedEvents = events.filter(e => e.status === "completed").length;
    if (completedEvents >= 10) return { name: "Platinum Host", color: "text-purple-400" };
    if (completedEvents >= 5) return { name: "Gold Host", color: "text-yellow-400" };
    if (completedEvents >= 2) return { name: "Silver Host", color: "text-gray-300" };
    if (completedEvents >= 1) return { name: "Bronze Host", color: "text-amber-600" };
    return { name: "New Host", color: "text-muted-foreground" };
  };

  const getCurrentPerk = () => {
    const level = getUserLevel();
    switch (level.name) {
      case "Platinum Host": return "VIP venue access + priority booking + 20% fee reduction";
      case "Gold Host": return "Priority venue booking + 10% fee reduction";
      case "Silver Host": return "Early access to premium venues";
      case "Bronze Host": return "Access to community events";
      default: return "Submit your first event to unlock perks!";
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "—";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-blue-500/20 text-blue-400";
      case "under_review": return "bg-yellow-500/20 text-yellow-400";
      case "needs_info": return "bg-orange-500/20 text-orange-400";
      case "approved": return "bg-green-500/20 text-green-400";
      case "published": return "bg-purple-500/20 text-purple-400";
      case "completed": return "bg-emerald-500/20 text-emerald-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
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

  const level = getUserLevel();

  return (
    <Layout>
      <section className="pt-8 pb-20 md:pt-12 md:pb-32">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  Welcome back, <span className="text-gradient">{user?.user_metadata?.full_name || "Host"}</span>
                </h1>
                <p className="text-muted-foreground">
                  Manage your events and track your progress
                </p>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="w-fit">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Level & Perk Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {/* Your Level */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Crown className={`w-6 h-6 ${level.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Level</p>
                    <p className={`text-xl font-bold ${level.color}`}>{level.name}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {events.filter(e => e.status === "completed").length} completed events
                </p>
              </div>

              {/* Current Perk */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Current Perk</p>
                    <p className="text-lg font-semibold">Active Benefits</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{getCurrentPerk()}</p>
              </div>
            </div>

            {/* Your Events */}
            <div className="glass rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Your Events
                </h2>
                <Button variant="gradient" size="sm" asChild>
                  <Link to="/submit">Submit New Event</Link>
                </Button>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">You haven't submitted any events yet.</p>
                  <Button variant="outline" asChild>
                    <Link to="/calculator">Start with Calculator</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <Link
                      key={event.id}
                      to={`/portal/events/${event.id}`}
                      className="block p-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                              {formatStatus(event.status)}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.city}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(event.preferred_event_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1 text-green-400">
                              <TrendingUp className="w-3.5 h-3.5" />
                              {formatCurrency(event.projected_profit)} projected
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground hidden sm:block" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
