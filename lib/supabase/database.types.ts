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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          allowed_sections: string[] | null
          auth_user_id: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["admin_role"]
        }
        Insert: {
          allowed_sections?: string[] | null
          auth_user_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
        }
        Update: {
          allowed_sections?: string[] | null
          auth_user_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
        }
        Relationships: []
      }
      booking_passengers: {
        Row: {
          booking_id: string
          created_at: string
          gender: Database["public"]["Enums"]["passenger_gender"] | null
          id: string
          national_id: string | null
          passenger_full_name: string
          passenger_phone: string | null
          trip_seat_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          gender?: Database["public"]["Enums"]["passenger_gender"] | null
          id?: string
          national_id?: string | null
          passenger_full_name: string
          passenger_phone?: string | null
          trip_seat_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          gender?: Database["public"]["Enums"]["passenger_gender"] | null
          id?: string
          national_id?: string | null
          passenger_full_name?: string
          passenger_phone?: string | null
          trip_seat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_passengers_trip_seat_id_fkey"
            columns: ["trip_seat_id"]
            isOneToOne: true
            referencedRelation: "trip_seats"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_reference: string
          cancelled_at: string | null
          confirmed_at: string | null
          contact_name: string
          contact_phone: string
          coupon_discount_amount: number
          coupon_id: string | null
          created_at: string
          currency: string
          customer_id: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          seats_count: number
          service_fee_amount: number
          status: Database["public"]["Enums"]["booking_status"]
          subtotal_amount: number
          tier_discount_amount: number
          total_amount: number
          trip_id: string
          wallet_amount_used: number
        }
        Insert: {
          booking_reference: string
          cancelled_at?: string | null
          confirmed_at?: string | null
          contact_name: string
          contact_phone: string
          coupon_discount_amount?: number
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          seats_count: number
          service_fee_amount?: number
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_amount: number
          tier_discount_amount?: number
          total_amount: number
          trip_id: string
          wallet_amount_used?: number
        }
        Update: {
          booking_reference?: string
          cancelled_at?: string | null
          confirmed_at?: string | null
          contact_name?: string
          contact_phone?: string
          coupon_discount_amount?: number
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          seats_count?: number
          service_fee_amount?: number
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_amount?: number
          tier_discount_amount?: number
          total_amount?: number
          trip_id?: string
          wallet_amount_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_coupon"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          amenities: string[]
          bus_type: Database["public"]["Enums"]["bus_type"]
          code: string
          created_at: string
          id: string
          plate_number: string | null
          status: Database["public"]["Enums"]["bus_status"]
          total_seats: number
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          bus_type: Database["public"]["Enums"]["bus_type"]
          code: string
          created_at?: string
          id?: string
          plate_number?: string | null
          status?: Database["public"]["Enums"]["bus_status"]
          total_seats: number
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          bus_type?: Database["public"]["Enums"]["bus_type"]
          code?: string
          created_at?: string
          id?: string
          plate_number?: string | null
          status?: Database["public"]["Enums"]["bus_status"]
          total_seats?: number
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name_en: string
          name_fa: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name_en: string
          name_fa: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name_en?: string
          name_fa?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          amount_saved: number
          booking_id: string
          coupon_id: string
          created_at: string
          customer_id: string | null
          id: string
        }
        Insert: {
          amount_saved: number
          booking_id: string
          coupon_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
        }
        Update: {
          amount_saved?: number
          booking_id?: string
          coupon_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by_admin_id: string | null
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          id: string
          is_active: boolean
          is_stackable_with_tier: boolean
          usage_limit: number | null
          used_count: number
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by_admin_id?: string | null
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          id?: string
          is_active?: boolean
          is_stackable_with_tier?: boolean
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by_admin_id?: string | null
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          id?: string
          is_active?: boolean
          is_stackable_with_tier?: boolean
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_registered: boolean
          lifetime_completed_trips: number
          loyalty_tier_id: string
          phone: string
          referral_code: string | null
          referred_by_customer_id: string | null
          updated_at: string
          wallet_balance: number
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_registered?: boolean
          lifetime_completed_trips?: number
          loyalty_tier_id: string
          phone: string
          referral_code?: string | null
          referred_by_customer_id?: string | null
          updated_at?: string
          wallet_balance?: number
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_registered?: boolean
          lifetime_completed_trips?: number
          loyalty_tier_id?: string
          phone?: string
          referral_code?: string | null
          referred_by_customer_id?: string | null
          updated_at?: string
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_loyalty_tier_id_fkey"
            columns: ["loyalty_tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_referred_by_customer_id_fkey"
            columns: ["referred_by_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          license_number: string | null
          phone: string
          status: Database["public"]["Enums"]["driver_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          license_number?: string | null
          phone: string
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          license_number?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_settings: {
        Row: {
          id: boolean
          referral_reward_amount: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          referral_reward_amount?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          referral_reward_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_tiers: {
        Row: {
          discount_percent: number
          id: string
          is_active: boolean
          min_completed_trips: number
          name_en: string
          name_fa: string
          sort_order: number
          tier_key: string
          updated_at: string
        }
        Insert: {
          discount_percent?: number
          id?: string
          is_active?: boolean
          min_completed_trips?: number
          name_en: string
          name_fa: string
          sort_order: number
          tier_key: string
          updated_at?: string
        }
        Update: {
          discount_percent?: number
          id?: string
          is_active?: boolean
          min_completed_trips?: number
          name_en?: string
          name_fa?: string
          sort_order?: number
          tier_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          confirmed_at: string | null
          confirmed_by_admin_id: string | null
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          booking_id: string
          confirmed_at?: string | null
          confirmed_by_admin_id?: string | null
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          booking_id?: string
          confirmed_at?: string | null
          confirmed_by_admin_id?: string | null
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_confirmed_by_admin_id_fkey"
            columns: ["confirmed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referred_customer_id: string
          referrer_customer_id: string
          reward_amount: number
          status: Database["public"]["Enums"]["referral_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referred_customer_id: string
          referrer_customer_id: string
          reward_amount?: number
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referred_customer_id?: string
          referrer_customer_id?: string
          reward_amount?: number
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_customer_id_fkey"
            columns: ["referred_customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_customer_id_fkey"
            columns: ["referrer_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string
          destination_city_id: string
          distance_km: number | null
          id: string
          is_active: boolean
          origin_city_id: string
          typical_duration_minutes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_city_id: string
          distance_km?: number | null
          id?: string
          is_active?: boolean
          origin_city_id: string
          typical_duration_minutes: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_city_id?: string
          distance_km?: number | null
          id?: string
          is_active?: boolean
          origin_city_id?: string
          typical_duration_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_destination_city_id_fkey"
            columns: ["destination_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_origin_city_id_fkey"
            columns: ["origin_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_seats: {
        Row: {
          col_label: string
          created_at: string
          held_until: string | null
          id: string
          row_number: number
          seat_number: string
          status: Database["public"]["Enums"]["seat_status"]
          trip_id: string
        }
        Insert: {
          col_label: string
          created_at?: string
          held_until?: string | null
          id?: string
          row_number: number
          seat_number: string
          status?: Database["public"]["Enums"]["seat_status"]
          trip_id: string
        }
        Update: {
          col_label?: string
          created_at?: string
          held_until?: string | null
          id?: string
          row_number?: number
          seat_number?: string
          status?: Database["public"]["Enums"]["seat_status"]
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_seats_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          bus_id: string | null
          created_at: string
          departure_time: string | null
          driver_id: string | null
          id: string
          price_per_seat: number
          route_id: string
          schedule_type: Database["public"]["Enums"]["trip_schedule_type"]
          service_date: string
          status: Database["public"]["Enums"]["trip_status"]
          total_seats_snapshot: number
          updated_at: string
        }
        Insert: {
          bus_id?: string | null
          created_at?: string
          departure_time?: string | null
          driver_id?: string | null
          id?: string
          price_per_seat: number
          route_id: string
          schedule_type?: Database["public"]["Enums"]["trip_schedule_type"]
          service_date: string
          status?: Database["public"]["Enums"]["trip_status"]
          total_seats_snapshot: number
          updated_at?: string
        }
        Update: {
          bus_id?: string | null
          created_at?: string
          departure_time?: string | null
          driver_id?: string | null
          id?: string
          price_per_seat?: number
          route_id?: string
          schedule_type?: Database["public"]["Enums"]["trip_schedule_type"]
          service_date?: string
          status?: Database["public"]["Enums"]["trip_status"]
          total_seats_snapshot?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          id: string
          note: string | null
          related_booking_id: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          id?: string
          note?: string | null
          related_booking_id?: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          note?: string | null
          related_booking_id?: string | null
          type?: Database["public"]["Enums"]["wallet_tx_type"]
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_cancel_booking: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      admin_confirm_offline_payment: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      confirm_booking: {
        Args: {
          p_contact_name: string
          p_contact_phone: string
          p_coupon_code?: string
          p_customer_id?: string
          p_passengers: Json
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_seat_ids: string[]
          p_trip_id: string
        }
        Returns: {
          booking_id: string
          booking_reference: string
          coupon_discount_amount: number
          service_fee_amount: number
          subtotal_amount: number
          tier_discount_amount: number
          total_amount: number
        }[]
      }
      current_customer_id: { Args: never; Returns: string }
      has_admin_section: { Args: { section: string }; Returns: boolean }
      hold_seats: {
        Args: {
          p_hold_minutes?: number
          p_seat_ids: string[]
          p_trip_id: string
        }
        Returns: {
          col_label: string
          created_at: string
          held_until: string | null
          id: string
          row_number: number
          seat_number: string
          status: Database["public"]["Enums"]["seat_status"]
          trip_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "trip_seats"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      normalize_phone: { Args: { p_input: string }; Returns: string }
      release_seats: {
        Args: { p_seat_ids: string[]; p_trip_id: string }
        Returns: undefined
      }
      request_booking_cancellation: {
        Args: { p_phone: string; p_reference: string }
        Returns: undefined
      }
      signup_customer: {
        Args: {
          p_email?: string
          p_full_name?: string
          p_phone: string
          p_referral_code?: string
        }
        Returns: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_registered: boolean
          lifetime_completed_trips: number
          loyalty_tier_id: string
          phone: string
          referral_code: string | null
          referred_by_customer_id: string | null
          updated_at: string
          wallet_balance: number
        }
        SetofOptions: {
          from: "*"
          to: "customers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_booking_contact_phone: {
        Args: { p_new_phone: string; p_phone: string; p_reference: string }
        Returns: undefined
      }
    }
    Enums: {
      admin_role: "super_admin" | "limited_admin"
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "refunded"
      bus_status: "active" | "maintenance" | "retired"
      bus_type: "vip" | "standard"
      coupon_discount_type: "percent" | "fixed"
      driver_status: "active" | "inactive"
      passenger_gender: "male" | "female"
      payment_method: "online" | "offline"
      payment_status: "pending" | "confirmed" | "failed" | "refunded"
      referral_status: "pending" | "completed"
      seat_status: "available" | "held" | "booked"
      trip_schedule_type: "fixed_time" | "fill_and_go"
      trip_status:
        | "scheduled"
        | "boarding"
        | "departed"
        | "completed"
        | "cancelled"
      wallet_tx_type:
        | "cashback"
        | "referral_bonus"
        | "redeemed"
        | "manual_adjustment"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      admin_role: ["super_admin", "limited_admin"],
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "refunded",
      ],
      bus_status: ["active", "maintenance", "retired"],
      bus_type: ["vip", "standard"],
      coupon_discount_type: ["percent", "fixed"],
      driver_status: ["active", "inactive"],
      passenger_gender: ["male", "female"],
      payment_method: ["online", "offline"],
      payment_status: ["pending", "confirmed", "failed", "refunded"],
      referral_status: ["pending", "completed"],
      seat_status: ["available", "held", "booked"],
      trip_schedule_type: ["fixed_time", "fill_and_go"],
      trip_status: [
        "scheduled",
        "boarding",
        "departed",
        "completed",
        "cancelled",
      ],
      wallet_tx_type: [
        "cashback",
        "referral_bonus",
        "redeemed",
        "manual_adjustment",
      ],
    },
  },
} as const
