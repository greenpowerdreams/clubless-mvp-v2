import { DollarSign, Shield, Clock, Zap, Calendar, Star } from "lucide-react";
import { type ReactNode, createElement } from "react";

// === User Level & Stats ===

export interface UserLevel {
  current_level: number;
  level_name: string;
  service_fee_percent: number;
  perks: Record<string, unknown>;
  next_level: number | null;
  next_level_name: string | null;
  events_to_next_level: number | null;
}

export interface UserStats {
  lifetime_events_completed: number;
  lifetime_events_published: number;
  lifetime_profit_generated: number;
  lifetime_attendance: number;
}

// === Event Proposals ===

export interface EventProposal {
  id: string;
  status: string;
  city: string;
  preferred_event_date: string;
  projected_profit: number | null;
  projected_revenue: number | null;
  projected_costs: number | null;
  created_at: string;
  submitter_name: string;
  submitter_email: string;
  event_concept: string;
  instagram_handle: string | null;
  fee_model: string;
  full_calculator_json: Record<string, unknown> | null;
  status_notes: string | null;
  eventbrite_url: string | null;
  eventbrite_status: string | null;
}

// === Creator Events ===

export interface CreatorEvent {
  id: string;
  title: string;
  description: string | null;
  city: string;
  start_at: string;
  end_at: string;
  status: string;
  capacity: number;
  cover_image_url: string | null;
}

export interface Ticket {
  id: string;
  name: string;
  price_cents: number;
  qty_total: number;
  qty_sold: number;
  qty_reserved: number;
  event_id: string;
}

export interface Order {
  id: string;
  amount_cents: number;
  creator_amount_cents: number;
  platform_fee_cents: number;
  status: string;
  created_at: string;
  buyer_email: string;
  buyer_name: string | null;
  event_id: string;
}

export interface Payout {
  id: string;
  amount_cents: number;
  status: string;
  scheduled_for: string | null;
  completed_at: string | null;
  event_id: string;
}

export interface CreatorData {
  events: CreatorEvent[];
  tickets: Ticket[];
  orders: Order[];
  payouts: Payout[];
}

// === UI Constants ===

export const LEVEL_COLORS: Record<number, { text: string; bg: string; icon: string }> = {
  1: { text: "text-gray-400", bg: "bg-gray-500/20", icon: "text-gray-400" },
  2: { text: "text-blue-400", bg: "bg-blue-500/20", icon: "text-blue-400" },
  3: { text: "text-purple-400", bg: "bg-purple-500/20", icon: "text-purple-400" },
  4: { text: "text-yellow-400", bg: "bg-yellow-500/20", icon: "text-yellow-400" },
};

export const PERK_LABELS: Record<string, { label: string; icon: ReactNode }> = {
  service_fee_percent: { label: "Service Fee", icon: createElement(DollarSign, { className: "w-4 h-4" }) },
  priority_support: { label: "Priority Support", icon: createElement(Shield, { className: "w-4 h-4" }) },
  early_access_slots: { label: "Early Access Slots", icon: createElement(Clock, { className: "w-4 h-4" }) },
  priority_approval: { label: "Priority Approval", icon: createElement(Zap, { className: "w-4 h-4" }) },
  best_dates_priority: { label: "Best Dates Priority", icon: createElement(Calendar, { className: "w-4 h-4" }) },
  dedicated_rep: { label: "Dedicated Rep", icon: createElement(Star, { className: "w-4 h-4" }) },
};

// === Helpers ===

export function formatCurrency(cents: number | null): string {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatCurrencyWhole(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    submitted: "bg-blue-500/20 text-blue-400",
    under_review: "bg-yellow-500/20 text-yellow-400",
    needs_info: "bg-orange-500/20 text-orange-400",
    pending_approval: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-green-500/20 text-green-400",
    published: "bg-purple-500/20 text-purple-400",
    live: "bg-primary/20 text-primary",
    completed: "bg-emerald-500/20 text-emerald-400",
    cancelled: "bg-destructive/20 text-destructive",
    rejected: "bg-red-500/20 text-red-400",
  };
  return colors[status] || "bg-muted text-muted-foreground";
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
