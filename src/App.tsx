import { lazy, Suspense } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { ScrollToTop } from "@/shared/components/ScrollToTop";
import { InstallPrompt } from "@/shared/components/InstallPrompt";
import { ErrorBoundary } from "@/app/ErrorBoundary";

// Eager load: lightweight, always needed
import NotFound from "./pages/NotFound";

// Lazy load: all page components
const Index = lazy(() => import("./pages/Index"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Calculator = lazy(() => import("./pages/Calculator"));
const SubmitEvent = lazy(() => import("./pages/SubmitEvent"));
const ProposalStatus = lazy(() => import("./pages/ProposalStatus"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("./pages/CheckoutCancel"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard"));
const VendorMarketplace = lazy(() => import("./pages/VendorMarketplace"));
const VendorDetail = lazy(() => import("./pages/VendorDetail"));
const Pricing = lazy(() => import("./pages/Pricing"));
const FAQ = lazy(() => import("./pages/FAQ"));
const VendorApply = lazy(() => import("./pages/VendorApply"));
const BarService = lazy(() => import("./pages/BarService"));
const PortalLogin = lazy(() => import("./pages/PortalLogin"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const WhatIsClubless = lazy(() => import("./pages/WhatIsClubless"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));

// Production: unified dashboard + profiles
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));
const CreatorProfile = lazy(() => import("./features/profiles/CreatorProfile"));
const CreatorDirectory = lazy(() => import("./features/profiles/CreatorDirectory"));
const PortalEventDetail = lazy(() => import("./pages/PortalEventDetail"));

// Phase 3: QR ticketing, community, analytics, payments
const MyTickets = lazy(() => import("./pages/MyTickets"));
const TicketVerify = lazy(() => import("./pages/TicketVerify"));
const EventCheckin = lazy(() => import("./pages/EventCheckin"));
const EventAnalytics = lazy(() => import("./pages/EventAnalytics"));
const PaymentSettings = lazy(() => import("./pages/PaymentSettings"));
const Community = lazy(() => import("./pages/Community"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

// Redirect component that preserves :id param
function PortalEventRedirect() {
  const { id } = useParams();
  return <Navigate to={`/dashboard/proposals/${id}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <InstallPrompt />
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/e/:slug" element={<EventDetail />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/submit" element={<SubmitEvent />} />
              <Route path="/status" element={<ProposalStatus />} />
              <Route path="/whos-playing" element={<Navigate to="/events" replace />} />
              <Route path="/creators" element={<CreatorDirectory />} />
              <Route path="/u/:identifier" element={<CreatorProfile />} />
              <Route path="/vendors" element={<VendorMarketplace />} />
              <Route path="/vendors/:id" element={<VendorDetail />} />
              <Route path="/vendor/apply" element={<VendorApply />} />
              <Route path="/bar-service" element={<BarService />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/what-is-clubless" element={<WhatIsClubless />} />

              {/* Public: Phase 3 */}
              <Route path="/ticket/verify/:token" element={<TicketVerify />} />

              {/* Auth */}
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/portal/login" element={<PortalLogin />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected: Dashboard */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/events/new" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
              <Route path="/dashboard/proposals/:id" element={<ProtectedRoute><PortalEventDetail /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
              <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />

              {/* Protected: Phase 3 */}
              <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
              <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
              <Route path="/events/:id/checkin" element={<ProtectedRoute><EventCheckin /></ProtectedRoute>} />
              <Route path="/events/:id/analytics" element={<ProtectedRoute><EventAnalytics /></ProtectedRoute>} />
              <Route path="/settings/payments" element={<ProtectedRoute><PaymentSettings /></ProtectedRoute>} />

              {/* Protected: Checkout */}
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/checkout/cancel" element={<CheckoutCancel />} />

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/login" element={<AdminAuth />} />

              {/* Redirects: old routes → new */}
              <Route path="/portal" element={<Navigate to="/dashboard" replace />} />
              <Route path="/portal/events/:id" element={<PortalEventRedirect />} />
              <Route path="/creator" element={<Navigate to="/dashboard?tab=events" replace />} />

              {/* Phase 3: public profile (uses /profile/:handle to avoid collision with /u/:identifier) */}
              <Route path="/profile/:handle" element={<PublicProfile />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
