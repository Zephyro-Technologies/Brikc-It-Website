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
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          blurb: string
          id: string
          image: string
          name: Database["public"]["Enums"]["product_category"]
          sort: number
          updated_at: string
        }
        Insert: {
          blurb: string
          id?: string
          image: string
          name: Database["public"]["Enums"]["product_category"]
          sort?: number
          updated_at?: string
        }
        Update: {
          blurb?: string
          id?: string
          image?: string
          name?: Database["public"]["Enums"]["product_category"]
          sort?: number
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          id: string
          question: string
          sort: number
        }
        Insert: {
          answer: string
          id?: string
          question: string
          sort?: number
        }
        Update: {
          answer?: string
          id?: string
          question?: string
          sort?: number
        }
        Relationships: []
      }
      order_lines: {
        Row: {
          format: Database["public"]["Enums"]["format_key"]
          id: string
          image: string
          name: string
          order_id: string
          product_id: string | null
          qty: number
          slug: string
          unit_price: number
        }
        Insert: {
          format: Database["public"]["Enums"]["format_key"]
          id?: string
          image?: string
          name: string
          order_id: string
          product_id?: string | null
          qty?: number
          slug: string
          unit_price: number
        }
        Update: {
          format?: Database["public"]["Enums"]["format_key"]
          id?: string
          image?: string
          name?: string
          order_id?: string
          product_id?: string | null
          qty?: number
          slug?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          at: string
          author: string
          body: string
          id: string
          order_id: string
        }
        Insert: {
          at?: string
          author?: string
          body: string
          id?: string
          order_id: string
        }
        Update: {
          at?: string
          author?: string
          body?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_events: {
        Row: {
          at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          number: string
          ship_city: string
          ship_country: string
          ship_line1: string
          ship_line2: string | null
          ship_postcode: string
          ship_province: string
          shipping: number
          source: Database["public"]["Enums"]["order_source"]
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_courier: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string
          id?: string
          number?: string
          ship_city: string
          ship_country?: string
          ship_line1: string
          ship_line2?: string | null
          ship_postcode?: string
          ship_province?: string
          shipping?: number
          source?: Database["public"]["Enums"]["order_source"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_courier?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          number?: string
          ship_city?: string
          ship_country?: string
          ship_line1?: string
          ship_line2?: string | null
          ship_postcode?: string
          ship_province?: string
          shipping?: number
          source?: Database["public"]["Enums"]["order_source"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_courier?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt: string
          id: string
          product_id: string
          sort: number
          url: string
        }
        Insert: {
          alt?: string
          id?: string
          product_id: string
          sort?: number
          url: string
        }
        Update: {
          alt?: string
          id?: string
          product_id?: string
          sort?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          blurb: string
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          description: string
          edition: string
          featured: boolean
          id: string
          in_stock: boolean
          name: string
          pieces: number
          price: number
          price_boxed: number
          price_built: number
          price_framed: number
          scale: string
          sells_boxed: boolean
          sells_built: boolean
          sells_framed: boolean
          slug: string
          team: string
          updated_at: string
        }
        Insert: {
          blurb: string
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description: string
          edition?: string
          featured?: boolean
          id?: string
          in_stock?: boolean
          name: string
          pieces?: number
          price?: number
          price_boxed: number
          price_built: number
          price_framed: number
          scale: string
          sells_boxed?: boolean
          sells_built?: boolean
          sells_framed?: boolean
          slug: string
          team: string
          updated_at?: string
        }
        Update: {
          blurb?: string
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string
          edition?: string
          featured?: boolean
          id?: string
          in_stock?: boolean
          name?: string
          pieces?: number
          price?: number
          price_boxed?: number
          price_built?: number
          price_framed?: number
          scale?: string
          sells_boxed?: boolean
          sells_built?: boolean
          sells_framed?: boolean
          slug?: string
          team?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          build: string
          handle: string
          id: string
          name: string
          quote: string
          sort: number
        }
        Insert: {
          build: string
          handle: string
          id?: string
          name: string
          quote: string
          sort?: number
        }
        Update: {
          build?: string
          handle?: string
          id?: string
          name?: string
          quote?: string
          sort?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          bank_account_number: string
          bank_account_title: string
          bank_iban: string
          bank_name: string
          contact_email: string
          currency: string
          easypaisa_number: string
          easypaisa_title: string
          id: boolean
          instagram: string
          jazzcash_number: string
          jazzcash_title: string
          lead_time_framed: string
          lead_time_standard: string
          store_name: string
          updated_at: string
          uplift_built: number
          uplift_framed: number
          whatsapp: string
        }
        Insert: {
          bank_account_number?: string
          bank_account_title?: string
          bank_iban?: string
          bank_name?: string
          contact_email?: string
          currency?: string
          easypaisa_number?: string
          easypaisa_title?: string
          id?: boolean
          instagram?: string
          jazzcash_number?: string
          jazzcash_title?: string
          lead_time_framed?: string
          lead_time_standard?: string
          store_name?: string
          updated_at?: string
          uplift_built?: number
          uplift_framed?: number
          whatsapp?: string
        }
        Update: {
          bank_account_number?: string
          bank_account_title?: string
          bank_iban?: string
          bank_name?: string
          contact_email?: string
          currency?: string
          easypaisa_number?: string
          easypaisa_title?: string
          id?: boolean
          instagram?: string
          jazzcash_number?: string
          jazzcash_title?: string
          lead_time_framed?: string
          lead_time_standard?: string
          store_name?: string
          updated_at?: string
          uplift_built?: number
          uplift_framed?: number
          whatsapp?: string
        }
        Relationships: []
      }
    }
    Views: {
      customers: {
        Row: {
          email: string | null
          first_order_at: string | null
          id: string | null
          last_order_at: string | null
          name: string | null
          orders_count: number | null
          phone: string | null
          total_spent: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      place_order: {
        Args: {
          p_city: string
          p_email: string
          p_line1: string
          p_line2: string
          p_lines: Json
          p_name: string
          p_phone: string
          p_postcode: string
          p_province: string
        }
        Returns: Json
      }
    }
    Enums: {
      format_key: "boxed" | "built" | "framed"
      order_source: "storefront" | "manual"
      order_status:
        | "pending_payment"
        | "paid"
        | "in_production"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      product_category: "F1" | "Cars" | "Bikes" | "Collector"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      format_key: ["boxed", "built", "framed"],
      order_source: ["storefront", "manual"],
      order_status: [
        "pending_payment",
        "paid",
        "in_production",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      product_category: ["F1", "Cars", "Bikes", "Collector"],
    },
  },
} as const
