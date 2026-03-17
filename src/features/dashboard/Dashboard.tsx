import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { DashboardOverview } from "./DashboardOverview";
import { DashboardEvents } from "./DashboardEvents";
import { DashboardProposals } from "./DashboardProposals";
import { DashboardRevenue } from "./DashboardRevenue";
import { DashboardSchedule } from "@/features/scheduling/DashboardSchedule";
import { DashboardTeam } from "@/features/collaboration/DashboardTeam";
import { LogOut, Settings, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) return null;

  return (
    <Layout>
      <section className="pt-8 pb-20 md:pt-12 md:pb-32">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            {/* Help Banner */}
            <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Need help? Email{" "}
                <a
                  href="mailto:andrew@clublesscollective.com"
                  className="text-primary hover:underline"
                >
                  andrew@clublesscollective.com
                </a>
              </p>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  Welcome back,{" "}
                  <span className="text-primary">
                    {user.user_metadata?.full_name || "Host"}
                  </span>
                </h1>
                <p className="text-muted-foreground">
                  Manage your events, track revenue, and grow your brand
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

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="glass mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="proposals">Proposals</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <DashboardOverview userId={user.id} />
              </TabsContent>

              <TabsContent value="events">
                <DashboardEvents userId={user.id} />
              </TabsContent>

              <TabsContent value="schedule">
                <DashboardSchedule userId={user.id} />
              </TabsContent>

              <TabsContent value="proposals">
                <DashboardProposals userId={user.id} />
              </TabsContent>

              <TabsContent value="team">
                <DashboardTeam userId={user.id} />
              </TabsContent>

              <TabsContent value="revenue">
                <DashboardRevenue userId={user.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </Layout>
  );
}
