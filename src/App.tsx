import { lazy, Suspense } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

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

// New unified dashboard + scheduling + profiles
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));
const WhosPlaying = lazy(() => import("./features/scheduling/WhosPlaying"));
const CreatorProfile = lazy(() => import("./features/profiles/CreatorProfile"));
const CreatorDirectory = lazy(() => import("./features/profiles/CreatorDirectory"));
const PortalEventDetail = lazy(() => import("./pages/PortalEventDetail"));

const queryClient = new QueryClient();

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/submit" element={<SubmitEvent />} />
              <Route path="/status" element={<ProposalStatus />} />
              <Route path="/whos-playing" element={<WhosPlaying />} />
              <Route path="/creators" element={<CreatorDirectory />} />
              <Route path="/u/:identifier" element={<CreatorProfile />} />
              <Route path="/vendors" element={<VendorMarketplace />} />
              <Route path="/vendors/:id" element={<VendorDetail />} />
              <Route path="/vendor/apply" element={<VendorApply />} />

              {/* Auth */}
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected: Dashboard */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/proposals/:id" element={<ProtectedRoute><PortalEventDetail /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
              <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />

              {/* Protected: Checkout */}
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/checkout/cancel" element={<CheckoutCancel />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/login" element={<AdminAuth />} />

              {/* Redirects: old routes → new */}
              <Route path="/portal" element={<Navigate to="/dashboard" replace />} />
              <Route path="/portal/login" element={<Navigate to="/login" replace />} />
              <Route path="/portal/events/:id" element={<PortalEventRedirect />} />
              <Route path="/creator" element={<Navigate to="/dashboard?tab=events" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
