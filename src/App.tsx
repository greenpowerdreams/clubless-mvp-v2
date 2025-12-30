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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/submit" element={<SubmitEvent />} />
          <Route path="/status" element={<ProposalStatus />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route path="/portal/events/:id" element={<PortalEventDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
