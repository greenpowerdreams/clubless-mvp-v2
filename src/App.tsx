import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
import Calculator from "./pages/Calculator";
import SubmitEvent from "./pages/SubmitEvent";
import ProposalStatus from "./pages/ProposalStatus";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAuth from "./pages/AdminAuth";
import Portal from "./pages/Portal";
import PortalLogin from "./pages/PortalLogin";
import PortalEventDetail from "./pages/PortalEventDetail";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import ProfileSettings from "./pages/ProfileSettings";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import CreatorDashboard from "./pages/CreatorDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import VendorMarketplace from "./pages/VendorMarketplace";
import VendorDetail from "./pages/VendorDetail";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import VendorApply from "./pages/VendorApply";
import Community from "./pages/Community";
import PublicProfile from "./pages/PublicProfile";
import MyTickets from "./pages/MyTickets";
import TicketVerify from "./pages/TicketVerify";
import EventCheckin from "./pages/EventCheckin";
import EventAnalytics from "./pages/EventAnalytics";
import PaymentSettings from "./pages/PaymentSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/community" element={<Community />} />
          <Route path="/u/:handle" element={<PublicProfile />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="/ticket/verify/:token" element={<TicketVerify />} />
          <Route path="/events/:id/checkin" element={<EventCheckin />} />
          <Route path="/events/:id/analytics" element={<EventAnalytics />} />
          <Route path="/settings/payments" element={<PaymentSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
