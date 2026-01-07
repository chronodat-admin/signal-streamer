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
      audit_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      integration_deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          integration_id: string
          response_body: string | null
          response_code: number | null
          signal_id: string
          status: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          integration_id: string
          response_body?: string | null
          response_code?: number | null
          signal_id: string
          status?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string
          response_body?: string | null
          response_code?: number | null
          signal_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_deliveries_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_deliveries_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          error_count: number
          id: string
          last_delivery_at: string | null
          name: string
          status: Database["public"]["Enums"]["integration_status"]
          strategy_id: string | null
          type: Database["public"]["Enums"]["integration_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          error_count?: number
          id?: string
          last_delivery_at?: string | null
          name: string
          status?: Database["public"]["Enums"]["integration_status"]
          strategy_id?: string | null
          type: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          error_count?: number
          id?: string
          last_delivery_at?: string | null
          name?: string
          status?: Database["public"]["Enums"]["integration_status"]
          strategy_id?: string | null
          type?: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_type"]
          plan_expires_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          plan_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          plan_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          blocked_until: string | null
          created_at: string
          id: string
          is_blocked: boolean
          request_count: number
          strategy_id: string
          window_start: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          is_blocked?: boolean
          request_count?: number
          strategy_id: string
          window_start?: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          is_blocked?: boolean
          request_count?: number
          strategy_id?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          alert_id: string | null
          created_at: string
          id: string
          interval: string | null
          price: number
          processed_at: string | null
          raw_payload: Json | null
          signal_time: string
          signal_type: string
          strategy_id: string
          symbol: string
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          created_at?: string
          id?: string
          interval?: string | null
          price: number
          processed_at?: string | null
          raw_payload?: Json | null
          signal_time: string
          signal_type: string
          strategy_id: string
          symbol: string
          user_id: string
        }
        Update: {
          alert_id?: string | null
          created_at?: string
          id?: string
          interval?: string | null
          price?: number
          processed_at?: string | null
          raw_payload?: Json | null
          signal_time?: string
          signal_type?: string
          strategy_id?: string
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          created_at: string
          description: string | null
          exchange: string | null
          id: string
          is_deleted: boolean
          is_public: boolean
          name: string
          secret_token: string
          slug: string | null
          timeframe: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exchange?: string | null
          id?: string
          is_deleted?: boolean
          is_public?: boolean
          name: string
          secret_token?: string
          slug?: string | null
          timeframe?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exchange?: string | null
          id?: string
          is_deleted?: boolean
          is_public?: boolean
          name?: string
          secret_token?: string
          slug?: string | null
          timeframe?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategy_stats: {
        Row: {
          avg_loss: number | null
          avg_win: number | null
          id: string
          last_signal_at: string | null
          losing_trades: number
          max_drawdown: number | null
          profit_factor: number | null
          strategy_id: string
          total_pnl: number | null
          total_signals: number
          total_trades: number
          updated_at: string
          win_rate: number | null
          winning_trades: number
        }
        Insert: {
          avg_loss?: number | null
          avg_win?: number | null
          id?: string
          last_signal_at?: string | null
          losing_trades?: number
          max_drawdown?: number | null
          profit_factor?: number | null
          strategy_id: string
          total_pnl?: number | null
          total_signals?: number
          total_trades?: number
          updated_at?: string
          win_rate?: number | null
          winning_trades?: number
        }
        Update: {
          avg_loss?: number | null
          avg_win?: number | null
          id?: string
          last_signal_at?: string | null
          losing_trades?: number
          max_drawdown?: number | null
          profit_factor?: number | null
          strategy_id?: string
          total_pnl?: number | null
          total_signals?: number
          total_trades?: number
          updated_at?: string
          win_rate?: number | null
          winning_trades?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategy_stats_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: true
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_stats_daily: {
        Row: {
          created_at: string
          cumulative_pnl: number | null
          date: string
          id: string
          pnl: number | null
          signals_count: number
          strategy_id: string
          trades_count: number
          winning_trades: number
        }
        Insert: {
          created_at?: string
          cumulative_pnl?: number | null
          date: string
          id?: string
          pnl?: number | null
          signals_count?: number
          strategy_id: string
          trades_count?: number
          winning_trades?: number
        }
        Update: {
          created_at?: string
          cumulative_pnl?: number | null
          date?: string
          id?: string
          pnl?: number | null
          signals_count?: number
          strategy_id?: string
          trades_count?: number
          winning_trades?: number
        }
        Relationships: [
          {
            foreignKeyName: "trade_stats_daily_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          created_at: string
          direction: Database["public"]["Enums"]["trade_direction"]
          entry_price: number
          entry_signal_id: string | null
          entry_time: string
          exit_price: number | null
          exit_signal_id: string | null
          exit_time: string | null
          id: string
          pnl: number | null
          pnl_percent: number | null
          quantity: number | null
          status: Database["public"]["Enums"]["trade_status"]
          strategy_id: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: Database["public"]["Enums"]["trade_direction"]
          entry_price: number
          entry_signal_id?: string | null
          entry_time: string
          exit_price?: number | null
          exit_signal_id?: string | null
          exit_time?: string | null
          id?: string
          pnl?: number | null
          pnl_percent?: number | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["trade_status"]
          strategy_id: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: Database["public"]["Enums"]["trade_direction"]
          entry_price?: number
          entry_signal_id?: string | null
          entry_time?: string
          exit_price?: number | null
          exit_signal_id?: string | null
          exit_time?: string | null
          id?: string
          pnl?: number | null
          pnl_percent?: number | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["trade_status"]
          strategy_id?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_entry_signal_id_fkey"
            columns: ["entry_signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_exit_signal_id_fkey"
            columns: ["exit_signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          created_at: string
          date: string
          id: string
          invalid_requests: number
          signals_received: number
          strategy_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          invalid_requests?: number
          signals_received?: number
          strategy_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          invalid_requests?: number
          signals_received?: number
          strategy_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
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
      webhook_failures: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string
          id: string
          ip_address: string | null
          payload: Json | null
          strategy_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
          strategy_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
          strategy_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_failures_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_queue: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          max_attempts: number
          payload: Json
          processed_at: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["job_status"]
          strategy_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          payload: Json
          processed_at?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["job_status"]
          strategy_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          processed_at?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["job_status"]
          strategy_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: { Args: { p_strategy_id: string }; Returns: boolean }
      count_user_strategies: { Args: { uid: string }; Returns: number }
      get_plan_limits: {
        Args: { plan_name: Database["public"]["Enums"]["plan_type"] }
        Returns: Json
      }
      get_strategy_by_token: {
        Args: { token_value: string }
        Returns: {
          id: string
          is_deleted: boolean
          name: string
          user_id: string
        }[]
      }
      get_user_plan: {
        Args: { uid: string }
        Returns: Database["public"]["Enums"]["plan_type"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage_counter: {
        Args: {
          p_invalid?: number
          p_signals?: number
          p_strategy_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      update_strategy_stats: {
        Args: { p_strategy_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      audit_event_type:
        | "LOGIN"
        | "LOGOUT"
        | "STRATEGY_CREATED"
        | "STRATEGY_UPDATED"
        | "STRATEGY_DELETED"
        | "TOKEN_ROTATED"
        | "PLAN_CHANGED"
        | "WEBHOOK_RECEIVED"
        | "WEBHOOK_FAILED"
        | "SUBSCRIPTION_CREATED"
        | "SUBSCRIPTION_CANCELLED"
        | "PAYMENT_SUCCEEDED"
        | "PAYMENT_FAILED"
      integration_status: "active" | "paused" | "error" | "deleted"
      integration_type: "telegram" | "discord" | "email" | "webhook"
      job_status: "pending" | "processing" | "completed" | "failed" | "dead"
      plan_type: "FREE" | "PRO" | "ELITE"
      trade_direction: "long" | "short"
      trade_status: "open" | "closed" | "cancelled"
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
      app_role: ["admin", "moderator", "user"],
      audit_event_type: [
        "LOGIN",
        "LOGOUT",
        "STRATEGY_CREATED",
        "STRATEGY_UPDATED",
        "STRATEGY_DELETED",
        "TOKEN_ROTATED",
        "PLAN_CHANGED",
        "WEBHOOK_RECEIVED",
        "WEBHOOK_FAILED",
        "SUBSCRIPTION_CREATED",
        "SUBSCRIPTION_CANCELLED",
        "PAYMENT_SUCCEEDED",
        "PAYMENT_FAILED",
      ],
      integration_status: ["active", "paused", "error", "deleted"],
      integration_type: ["telegram", "discord", "email", "webhook"],
      job_status: ["pending", "processing", "completed", "failed", "dead"],
      plan_type: ["FREE", "PRO", "ELITE"],
      trade_direction: ["long", "short"],
      trade_status: ["open", "closed", "cancelled"],
    },
  },
} as const
