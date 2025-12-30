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
          user_id: string | null
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          event_type: string
          id?: string
          resolved?: boolean | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          event_type?: string
          id?: string
          resolved?: boolean | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
