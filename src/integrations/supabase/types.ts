export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata_json: Json | null
          new_values_json: Json | null
          old_values_json: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata_json?: Json | null
          new_values_json?: Json | null
          old_values_json?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata_json?: Json | null
          new_values_json?: Json | null
          old_values_json?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          metadata: Json | null
          open_count: number | null
          opened_at: string | null
          provider_message_id: string | null
          status: string
          template_name: string
          to_email: string
          tracking_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          open_count?: number | null
          opened_at?: string | null
          provider_message_id?: string | null
          status?: string
          template_name: string
          to_email: string
          tracking_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          open_count?: number | null
          opened_at?: string | null
          provider_message_id?: string | null
          status?: string
          template_name?: string
          to_email?: string
          tracking_id?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          details: Json | null
          error_message: string | null
          event_type: string
          id: string
          resolved: boolean | null
          timestamp: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          event_type: string
          id?: string
          resolved?: boolean | null
          timestamp?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          event_type?: string
          id?: string
          resolved?: boolean | null
          timestamp?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_budgets: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: string
          id: string
          is_locked: boolean | null
          line_items_json: Json
          margin_rules_json: Json | null
          totals_json: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
          is_locked?: boolean | null
          line_items_json?: Json
          margin_rules_json?: Json | null
          totals_json?: Json
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
          is_locked?: boolean | null
          line_items_json?: Json
          margin_rules_json?: Json | null
          totals_json?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_budgets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_proposals: {
        Row: {
          approved_at: string | null
          city: string
          completed_at: string | null
          created_at: string
          event_concept: string
          eventbrite_status: string | null
          eventbrite_url: string | null
          fee_model: string
          full_calculator_json: Json | null
          id: string
          instagram_handle: string | null
          preferred_event_date: string
          projected_costs: number | null
          projected_profit: number | null
          projected_revenue: number | null
          published_at: string | null
          status: string
          status_notes: string | null
          status_updated_at: string | null
          submitter_email: string
          submitter_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          city: string
          completed_at?: string | null
          created_at?: string
          event_concept: string
          eventbrite_status?: string | null
          eventbrite_url?: string | null
          fee_model: string
          full_calculator_json?: Json | null
          id?: string
          instagram_handle?: string | null
          preferred_event_date: string
          projected_costs?: number | null
          projected_profit?: number | null
          projected_revenue?: number | null
          published_at?: string | null
          status?: string
          status_notes?: string | null
          status_updated_at?: string | null
          submitter_email: string
          submitter_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          city?: string
          completed_at?: string | null
          created_at?: string
          event_concept?: string
          eventbrite_status?: string | null
          eventbrite_url?: string | null
          fee_model?: string
          full_calculator_json?: Json | null
          id?: string
          instagram_handle?: string | null
          preferred_event_date?: string
          projected_costs?: number | null
          projected_profit?: number | null
          projected_revenue?: number | null
          published_at?: string | null
          status?: string
          status_notes?: string | null
          status_updated_at?: string | null
          submitter_email?: string
          submitter_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_vendor_quotes: {
        Row: {
          created_at: string
          details_json: Json | null
          event_id: string
          expires_at: string | null
          id: string
          notes: string | null
          quoted_price: number | null
          requested_hours: number | null
          requested_qty: number | null
          responded_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          updated_at: string
          vendor_service_id: string
        }
        Insert: {
          created_at?: string
          details_json?: Json | null
          event_id: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          quoted_price?: number | null
          requested_hours?: number | null
          requested_qty?: number | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
          vendor_service_id: string
        }
        Update: {
          created_at?: string
          details_json?: Json | null
          event_id?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          quoted_price?: number | null
          requested_hours?: number | null
          requested_qty?: number | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
          vendor_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_vendor_quotes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_vendor_quotes_vendor_service_id_fkey"
            columns: ["vendor_service_id"]
            isOneToOne: false
            referencedRelation: "vendor_services"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          capacity: number
          city: string
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          end_at: string
          id: string
          images_json: Json | null
          is_private: boolean | null
          proposal_id: string | null
          risk_score: number | null
          slug: string | null
          start_at: string
          status: Database["public"]["Enums"]["event_status"]
          theme: string | null
          title: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          address?: string | null
          capacity: number
          city: string
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          end_at: string
          id?: string
          images_json?: Json | null
          is_private?: boolean | null
          proposal_id?: string | null
          risk_score?: number | null
          slug?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["event_status"]
          theme?: string | null
          title: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number
          city?: string
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          end_at?: string
          id?: string
          images_json?: Json | null
          is_private?: boolean | null
          proposal_id?: string | null
          risk_score?: number | null
          slug?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          theme?: string | null
          title?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "event_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          buyer_email: string
          buyer_name: string | null
          buyer_phone: string | null
          buyer_user_id: string | null
          created_at: string
          creator_amount_cents: number
          currency: string
          event_id: string
          id: string
          line_items_json: Json
          metadata_json: Json | null
          platform_fee_cents: number
          refund_amount_cents: number | null
          refund_reason: string | null
          reservation_expires_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          buyer_email: string
          buyer_name?: string | null
          buyer_phone?: string | null
          buyer_user_id?: string | null
          created_at?: string
          creator_amount_cents?: number
          currency?: string
          event_id: string
          id?: string
          line_items_json: Json
          metadata_json?: Json | null
          platform_fee_cents?: number
          refund_amount_cents?: number | null
          refund_reason?: string | null
          reservation_expires_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          buyer_email?: string
          buyer_name?: string | null
          buyer_phone?: string | null
          buyer_user_id?: string | null
          created_at?: string
          creator_amount_cents?: number
          currency?: string
          event_id?: string
          id?: string
          line_items_json?: Json
          metadata_json?: Json | null
          platform_fee_cents?: number
          refund_amount_cents?: number | null
          refund_reason?: string | null
          reservation_expires_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string
          creator_id: string
          currency: string
          event_id: string
          failure_reason: string | null
          id: string
          metadata_json: Json | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["payout_status"]
          stripe_payout_id: string | null
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string
          creator_id: string
          currency?: string
          event_id: string
          failure_reason?: string | null
          id?: string
          metadata_json?: Json | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          currency?: string
          event_id?: string
          failure_reason?: string | null
          id?: string
          metadata_json?: Json | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          id: string
          instagram_handle: string | null
          phone: string | null
          twitter_handle: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          instagram_handle?: string | null
          phone?: string | null
          twitter_handle?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          instagram_handle?: string | null
          phone?: string | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          event_id: string
          id: string
          max_per_order: number | null
          name: string
          price_cents: number
          qty_reserved: number
          qty_sold: number
          qty_total: number
          sale_ends_at: string | null
          sale_starts_at: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          max_per_order?: number | null
          name: string
          price_cents: number
          qty_reserved?: number
          qty_sold?: number
          qty_total: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          max_per_order?: number | null
          name?: string
          price_cents?: number
          qty_reserved?: number
          qty_sold?: number
          qty_total?: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_levels: {
        Row: {
          level: number
          name: string
          perks_json: Json
          requirements_json: Json
        }
        Insert: {
          level: number
          name: string
          perks_json: Json
          requirements_json: Json
        }
        Update: {
          level?: number
          name?: string
          perks_json?: Json
          requirements_json?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          lifetime_attendance: number
          lifetime_events_completed: number
          lifetime_events_published: number
          lifetime_profit_generated: number
          updated_at: string
          user_id: string
        }
        Insert: {
          lifetime_attendance?: number
          lifetime_events_completed?: number
          lifetime_events_published?: number
          lifetime_profit_generated?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          lifetime_attendance?: number
          lifetime_events_completed?: number
          lifetime_events_published?: number
          lifetime_profit_generated?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_services: {
        Row: {
          active: boolean | null
          add_ons_json: Json | null
          created_at: string
          description: string | null
          id: string
          lead_time_days: number | null
          max_qty: number | null
          min_qty: number | null
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          title: string
          unit_price: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          active?: boolean | null
          add_ons_json?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          lead_time_days?: number | null
          max_qty?: number | null
          min_qty?: number | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          title: string
          unit_price: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          active?: boolean | null
          add_ons_json?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          lead_time_days?: number | null
          max_qty?: number | null
          min_qty?: number | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          title?: string
          unit_price?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          business_name: string
          category: Database["public"]["Enums"]["vendor_category"]
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          featured: boolean | null
          id: string
          insurance_verified: boolean | null
          license_verified: boolean | null
          rating_avg: number | null
          review_count: number | null
          service_area: string[] | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["vendor_status"]
          website_url: string | null
        }
        Insert: {
          business_name: string
          category: Database["public"]["Enums"]["vendor_category"]
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          insurance_verified?: boolean | null
          license_verified?: boolean | null
          rating_avg?: number | null
          review_count?: number | null
          service_area?: string[] | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["vendor_status"]
          website_url?: string | null
        }
        Update: {
          business_name?: string
          category?: Database["public"]["Enums"]["vendor_category"]
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          insurance_verified?: boolean | null
          license_verified?: boolean | null
          rating_avg?: number | null
          review_count?: number | null
          service_area?: string[] | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["vendor_status"]
          website_url?: string | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string | null
          amenities_json: Json | null
          base_cost_amount: number | null
          base_cost_model: string | null
          capacity: number | null
          city: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          images_json: Json | null
          name: string
          rules_json: Json | null
          status: Database["public"]["Enums"]["venue_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities_json?: Json | null
          base_cost_amount?: number | null
          base_cost_model?: string | null
          capacity?: number | null
          city: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          images_json?: Json | null
          name: string
          rules_json?: Json | null
          status?: Database["public"]["Enums"]["venue_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities_json?: Json | null
          base_cost_amount?: number | null
          base_cost_model?: string | null
          capacity?: number | null
          city?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          images_json?: Json | null
          name?: string
          rules_json?: Json | null
          status?: Database["public"]["Enums"]["venue_status"]
          updated_at?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          city: string
          created_at: string
          email: string
          first_name: string | null
          id: string
          interest_type: string
          source_page: string | null
        }
        Insert: {
          city?: string
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          interest_type?: string
          source_page?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          interest_type?: string
          source_page?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_ticket_sale: { Args: { p_order_id: string }; Returns: boolean }
      get_proposal_status: {
        Args: { lookup_email: string }
        Returns: {
          city: string
          created_at: string
          eventbrite_status: string
          eventbrite_url: string
          id: string
          preferred_date: string
          status: string
        }[]
      }
      get_user_level: {
        Args: { p_user_id: string }
        Returns: {
          current_level: number
          events_to_next_level: number
          level_name: string
          next_level: number
          next_level_name: string
          perks: Json
          service_fee_percent: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      release_ticket_reservations: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      reserve_tickets: {
        Args: { p_order_id: string; p_quantity: number; p_ticket_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "vendor"
      event_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "published"
        | "live"
        | "completed"
        | "cancelled"
      order_status:
        | "pending"
        | "processing"
        | "completed"
        | "refunded"
        | "partially_refunded"
        | "failed"
        | "cancelled"
      payout_status:
        | "pending"
        | "scheduled"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      pricing_model: "hourly" | "flat" | "per_head" | "tiered"
      quote_status: "requested" | "quoted" | "accepted" | "rejected" | "expired"
      vendor_category:
        | "bartending"
        | "security"
        | "catering"
        | "av_equipment"
        | "decor"
        | "photo_video"
        | "staffing"
        | "dj_equipment"
        | "other"
      vendor_status: "pending" | "verified" | "suspended" | "archived"
      venue_status: "pending" | "approved" | "suspended" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "vendor"],
      event_status: [
        "draft",
        "pending_approval",
        "approved",
        "published",
        "live",
        "completed",
        "cancelled",
      ],
      order_status: [
        "pending",
        "processing",
        "completed",
        "refunded",
        "partially_refunded",
        "failed",
        "cancelled",
      ],
      payout_status: [
        "pending",
        "scheduled",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      pricing_model: ["hourly", "flat", "per_head", "tiered"],
      quote_status: ["requested", "quoted", "accepted", "rejected", "expired"],
      vendor_category: [
        "bartending",
        "security",
        "catering",
        "av_equipment",
        "decor",
        "photo_video",
        "staffing",
        "dj_equipment",
        "other",
      ],
      vendor_status: ["pending", "verified", "suspended", "archived"],
      venue_status: ["pending", "approved", "suspended", "archived"],
    },
  },
} as const
