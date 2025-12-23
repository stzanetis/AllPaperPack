export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          full_name: string
          email: string
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          city: string | null
          country: string | null
          street: string | null
          zip: string | null
          company_name: string | null
          afm_number: string | null
        }
        Insert: {
          id?: number
          full_name: string
          email: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          city?: string | null
          country?: string | null
          street?: string | null
          zip?: string | null
          company_name?: string | null
          afm_number?: string | null
        }
        Update: {
          id?: number
          full_name?: string
          email?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          city?: string | null
          country?: string | null
          street?: string | null
          zip?: string | null
          company_name?: string | null
          afm_number?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: number
          name: string
          description: string | null
          parent_id: number | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          parent_id?: number | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          parent_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: number
          name: string
          description: string | null
          price: number
          stock: number
          image_url: string | null
          vat: number
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          price: number
          stock?: number
          image_url?: string | null
          vat?: number
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          price?: number
          stock?: number
          image_url?: string | null
          vat?: number
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: number
          name: string
          description: string | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          discount: number
          expiration_date: string | null
        }
        Insert: {
          code: string
          discount: number
          expiration_date?: string | null
        }
        Update: {
          code?: string
          discount?: number
          expiration_date?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: number
          total: number
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          id?: number
          total?: number
          status?: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          id?: number
          total?: number
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: []
      }
      pickup_locations: {
        Row: {
          id: number
          name: string
          owner_full_name: string
          owner_phone_number: string
          working_hours: string | null
          number_of_packages: number
          package_capacity: number
          country: string | null
          city: string | null
          street: string | null
          number: string | null
          zip: string | null
        }
        Insert: {
          id?: number
          name: string
          owner_full_name: string
          owner_phone_number: string
          working_hours?: string | null
          number_of_packages?: number
          package_capacity?: number
          country?: string | null
          city?: string | null
          street?: string | null
          number?: string | null
          zip?: string | null
        }
        Update: {
          id?: number
          name?: string
          owner_full_name?: string
          owner_phone_number?: string
          working_hours?: string | null
          number_of_packages?: number
          package_capacity?: number
          country?: string | null
          city?: string | null
          street?: string | null
          number?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: number
          user_id: number
          created_at: string
          comment: string | null
          score: number
        }
        Insert: {
          id?: number
          user_id: number
          created_at?: string
          comment?: string | null
          score: number
        }
        Update: {
          id?: number
          user_id?: number
          created_at?: string
          comment?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cart: {
        Row: {
          user_id: number
          product_id: number
          quantity: number
        }
        Insert: {
          user_id: number
          product_id: number
          quantity?: number
        }
        Update: {
          user_id?: number
          product_id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products_belong_to_categories: {
        Row: {
          product_id: number
          category_id: number
        }
        Insert: {
          product_id: number
          category_id: number
        }
        Update: {
          product_id?: number
          category_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_belong_to_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_belong_to_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_discribed_by_tags: {
        Row: {
          product_id: number
          tag_id: number
        }
        Insert: {
          product_id: number
          tag_id: number
        }
        Update: {
          product_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_discribed_by_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_discribed_by_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_include_products: {
        Row: {
          order_id: number
          product_id: number
          quantity: number
        }
        Insert: {
          order_id: number
          product_id: number
          quantity?: number
        }
        Update: {
          order_id?: number
          product_id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_include_products_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_include_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_places_orders: {
        Row: {
          user_id: number
          order_id: number
        }
        Insert: {
          user_id: number
          order_id: number
        }
        Update: {
          user_id?: number
          order_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_places_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_places_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons_applied_to_orders: {
        Row: {
          coupon_code: string
          order_id: number
        }
        Insert: {
          coupon_code: string
          order_id: number
        }
        Update: {
          coupon_code?: string
          order_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_applied_to_orders_coupon_code_fkey"
            columns: ["coupon_code"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "coupons_applied_to_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_shipped_to_pickup_locations: {
        Row: {
          order_id: number
          pickup_id: number
        }
        Insert: {
          order_id: number
          pickup_id: number
        }
        Update: {
          order_id?: number
          pickup_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_shipped_to_pickup_locations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipped_to_pickup_locations_pickup_id_fkey"
            columns: ["pickup_id"]
            isOneToOne: false
            referencedRelation: "pickup_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews_belong_to_products: {
        Row: {
          review_id: number
          product_id: number
        }
        Insert: {
          review_id: number
          product_id: number
        }
        Update: {
          review_id?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_belong_to_products_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_belong_to_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_applied_coupons: {
        Row: {
          user_id: number
          coupon_code: string
        }
        Insert: {
          user_id: number
          coupon_code: string
        }
        Update: {
          user_id?: number
          coupon_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_applied_coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_applied_coupons_coupon_code_fkey"
            columns: ["coupon_code"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      view_products_flat: {
        Row: {
          product_id: number
          product_name: string
          description: string | null
          price: number
          vat: number
          image_url: string | null
          stock: number
          category_id: number
          category_name: string
          parent_category_id: number | null
          root_category_name: string
        }
      }
      avg_product_score: {
        Row: {
          product_id: number
          avg_score: number
        }
      }
      user_reviews: {
        Row: {
          review_id: number
          user_name: string
          product_id: number
          product_name: string
          score: number
          comment: string | null
        }
      }
      prod_of_cat: {
        Row: {
          product_name: string
          price: number
          vat: number
          category_id: number
          image_url: string | null
          category_id_ref: number
          category_name: string
        }
      }
      user_order_history: {
        Row: {
          user_id: number
          full_name: string
          quantity: number
          order_id: number
          total: number
          status: Database["public"]["Enums"]["order_status"]
          product_name: string
        }
      }
    }
    Functions: {
      get_user_role: {
        Args: { user_email: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_id: {
        Args: { user_email: string }
        Returns: number
      }
    }
    Enums: {
      user_role: "Πελάτης" | "Διαχειριστής" | "Υπεύθυνος Παραγγελιών"
      order_status: "Ακυρώθηκε" | "Ολοκληρώθηκε" | "Προς Αποστολή" | "Καταχωρημένη"
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
    : never,
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
      user_role: ["Πελάτης", "Διαχειριστής", "Υπεύθυνος Παραγγελιών"],
      order_status: ["Ακυρώθηκε", "Ολοκληρώθηκε", "Προς Αποστολή", "Καταχωρημένη"],
    },
  },
} as const
