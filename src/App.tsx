import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
const Portal = lazy(() => import("./pages/Portal"));
const PortalLogin = lazy(() => import("./pages/PortalLogin"));
const PortalEventDetail = lazy(() => import("./pages/PortalEventDetail"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("./pages/CheckoutCancel"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard"));
const VendorMarketplace = lazy(() => import("./pages/VendorMarketplace"));
const VendorDetail = lazy(() => import("./pages/VendorDetail"));
const Pricing = lazy(() => import("./pages/Pricing"));
const FAQ = lazy(() => import("./pages/FAQ"));
const VendorApply = lazy(() => import("./pages/VendorApply"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/submit" element={<SubmitEvent />} />
            <Route path="/status" element={<ProposalStatus />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/login" element={<AdminAuth />} />
            <Route path="/portal" element={<Portal />} />
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/portal/events/:id" element={<PortalEventDetail />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />
            <Route path="/profile" element={<ProfileSettings />} />
            <Route path="/creator" element={<CreatorDashboard />} />
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/vendor/apply" element={<VendorApply />} />
            <Route path="/vendors" element={<VendorMarketplace />} />
            <Route path="/vendors/:id" element={<VendorDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
