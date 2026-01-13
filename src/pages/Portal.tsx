import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Sparkles,
  Star,
  Zap,
  Shield,
  Clock,
  DollarSign,
  Mail,
  Settings
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

interface UserLevel {
  current_level: number;
  level_name: string;
  service_fee_percent: number;
  perks: Record<string, unknown>;
  next_level: number | null;
  next_level_name: string | null;
  events_to_next_level: number | null;
}

interface UserStats {
  lifetime_events_completed: number;
  lifetime_events_published: number;
  lifetime_profit_generated: number;
  lifetime_attendance: number;
}

const LEVEL_COLORS: Record<number, { text: string; bg: string; icon: string }> = {
  1: { text: "text-gray-400", bg: "bg-gray-500/20", icon: "text-gray-400" },
  2: { text: "text-blue-400", bg: "bg-blue-500/20", icon: "text-blue-400" },
  3: { text: "text-purple-400", bg: "bg-purple-500/20", icon: "text-purple-400" },
  4: { text: "text-yellow-400", bg: "bg-yellow-500/20", icon: "text-yellow-400" },
};

const PERK_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  service_fee_percent: { label: "Service Fee", icon: <DollarSign className="w-4 h-4" /> },
  priority_support: { label: "Priority Support", icon: <Shield className="w-4 h-4" /> },
  early_access_slots: { label: "Early Access Slots", icon: <Clock className="w-4 h-4" /> },
  priority_approval: { label: "Priority Approval", icon: <Zap className="w-4 h-4" /> },
  best_dates_priority: { label: "Best Dates Priority", icon: <Calendar className="w-4 h-4" /> },
  dedicated_rep: { label: "Dedicated Rep", icon: <Star className="w-4 h-4" /> },
};

export default function Portal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventProposal[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

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
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    // Fetch events
    const { data: eventsData } = await supabase
      .from("event_proposals")
      .select("id, status, city, preferred_event_date, projected_profit, created_at, submitter_name")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (eventsData) {
      setEvents(eventsData);
    }

    // Fetch user level
    const { data: levelData } = await supabase
      .rpc("get_user_level", { p_user_id: userId });

    if (levelData && levelData.length > 0) {
      setUserLevel(levelData[0] as UserLevel);
    }

    // Fetch user stats
    const { data: statsData } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (statsData) {
      setUserStats(statsData as UserStats);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
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

  const getLevelProgress = () => {
    if (!userLevel || userLevel.next_level === null || userLevel.events_to_next_level === null) {
      return 100; // Max level
    }
    
    const completedEvents = userStats?.lifetime_events_completed || 0;
    const eventsNeeded = completedEvents + userLevel.events_to_next_level;
    
    // Calculate progress based on level thresholds
    const levelThresholds = [0, 2, 5, 10];
    const currentThreshold = levelThresholds[userLevel.current_level - 1] || 0;
    const nextThreshold = levelThresholds[userLevel.current_level] || currentThreshold;
    
    if (nextThreshold === currentThreshold) return 100;
    
    const progress = ((completedEvents - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
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

  const levelColors = userLevel ? LEVEL_COLORS[userLevel.current_level] || LEVEL_COLORS[1] : LEVEL_COLORS[1];

  return (
    <Layout>
      <section className="pt-8 pb-20 md:pt-12 md:pb-32">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            {/* Help Banner */}
            <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Need help? Reply to your welcome email or email{" "}
                <a href="mailto:andrew@clublesscollective.com" className="text-primary hover:underline">
                  andrew@clublesscollective.com
                </a>
              </p>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  Welcome back, <span className="text-primary">{user?.user_metadata?.full_name || "Host"}</span>
                </h1>
                <p className="text-muted-foreground">
                  Manage your events and track your progress
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild className="w-fit">
                  <Link to="/profile">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleSignOut} className="w-fit">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Level & Stats Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {/* Your Level */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${levelColors.bg} flex items-center justify-center`}>
                    <Crown className={`w-6 h-6 ${levelColors.icon}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Level</p>
                    <p className={`text-xl font-bold ${levelColors.text}`}>
                      {userLevel?.level_name || "Starter"}
                    </p>
                  </div>
                </div>
                
                {/* Progress to next level */}
                {userLevel && userLevel.next_level !== null && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Progress to {userLevel.next_level_name}
                      </span>
                      <span className="font-medium">
                        {userLevel.events_to_next_level} events to go
                      </span>
                    </div>
                    <Progress value={getLevelProgress()} className="h-2" />
                  </div>
                )}
                
                {userLevel && userLevel.next_level === null && (
                  <p className="text-sm text-muted-foreground">
                    You've reached the highest level!
                  </p>
                )}
                
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Your Stats</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Completed: </span>
                      <span className="font-medium">{userStats?.lifetime_events_completed || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Published: </span>
                      <span className="font-medium">{userStats?.lifetime_events_published || 0}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Total Profit: </span>
                      <span className="font-medium text-green-400">
                        {formatCurrency(userStats?.lifetime_profit_generated || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Perks */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Perks</p>
                    <p className="text-lg font-semibold">Active Benefits</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Service Fee Highlight */}
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">
                        {userLevel ? `${userLevel.service_fee_percent}% Service Fee` : "15% Service Fee"}
                      </span>
                      {userLevel && userLevel.service_fee_percent < 15 && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          {15 - userLevel.service_fee_percent}% saved
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Other Perks */}
                  {userLevel?.perks && Object.entries(userLevel.perks).map(([key, value]) => {
                    if (key === "service_fee_percent") return null;
                    if (value === false) return null;
                    
                    const perkInfo = PERK_LABELS[key];
                    if (!perkInfo) return null;
                    
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
                        {perkInfo.icon}
                        <span>{perkInfo.label}</span>
                        <span className="text-green-400">✓</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Your Events */}
            <div className="glass rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Your Events
                </h2>
                <Button variant="default" size="sm" asChild>
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
