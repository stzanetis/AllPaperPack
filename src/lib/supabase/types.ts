export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          surname: string | null
          telephone: string | null
          role: Database["public"]["Enums"]["Roles"]
          company_name: string | null
          afm_number: string | null
          city: string | null
          street: string | null
          zip: string | null
        }
        Insert: {
          id: string
          name?: string | null
          surname?: string | null
          telephone?: string | null
          role?: Database["public"]["Enums"]["Roles"]
          company_name?: string | null
          afm_number?: string | null
          city?: string | null
          street?: string | null
          zip?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          surname?: string | null
          telephone?: string | null
          role?: Database["public"]["Enums"]["Roles"]
          company_name?: string | null
          afm_number?: string | null
          city?: string | null
          street?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
          }
        ]
      }
      product_bases: {
        Row: {
          id: number
          name: string
          description: string | null
          image_path: string | null
          vat: number
          category_id: number
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          image_path?: string | null
          vat?: number
          category_id: number
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          image_path?: string | null
          vat?: number
          category_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_bases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      product_variants: {
        Row: {
          id: number
          base_id: number
          variant_name: string
          price: number
          stock: number
        }
        Insert: {
          id?: number
          base_id: number
          variant_name: string
          price: number
          stock?: number
        }
        Update: {
          id?: number
          base_id?: number
          variant_name?: string
          price?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "product_bases"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: number
          name: string
          description: string | null
          color_hex: string | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          color_hex?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          color_hex?: string | null
        }
        Relationships: []
      }
      product_has_tags: {
        Row: {
          base_id: number
          tag_id: number
        }
        Insert: {
          base_id: number
          tag_id: number
        }
        Update: {
          base_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_has_tags_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "product_bases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_has_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      cart: {
        Row: {
          profile_id: string
          variant_id: number
          quantity: number
        }
        Insert: {
          profile_id: string
          variant_id: number
          quantity?: number
        }
        Update: {
          profile_id?: string
          variant_id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: number
          profile_id: string
          total: number
          status: Database["public"]["Enums"]["Status"]
          created_at: string
        }
        Insert: {
          id?: number
          profile_id: string
          total?: number
          status?: Database["public"]["Enums"]["Status"]
          created_at?: string
        }
        Update: {
          id?: number
          profile_id?: string
          total?: number
          status?: Database["public"]["Enums"]["Status"]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      order_has_variants: {
        Row: {
          order_id: number
          variant_id: number
          quantity: number
          unit_price: number
          vat: number
        }
        Insert: {
          order_id: number
          variant_id: number
          quantity: number
          unit_price: number
          vat: number
        }
        Update: {
          order_id?: number
          variant_id?: number
          quantity?: number
          unit_price?: number
          vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_has_variants_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_has_variants_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          }
        ]
      }
      site_settings: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string
        }
        Relationships: []
      }
      carousel_images: {
        Row: {
          id: number
          image_path: string
          alt_text: string | null
          link_url: string | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          image_path: string
          alt_text?: string | null
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          image_path?: string
          alt_text?: string | null
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      checkout_order: {
        Args: { p_order_id: number }
        Returns: void
      }
    }
    Enums: {
      Status: "submitted" | "confirmed" | "completed" | "cancelled"
      Roles: "customer" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Update"]

export type Enums<
  EnumName extends keyof PublicSchema["Enums"]
> = PublicSchema["Enums"][EnumName]

export const Constants = {
  public: {
    Enums: {
      Status: ["submitted", "confirmed", "completed", "cancelled"] as const,
      Roles: ["customer", "admin"] as const,
    },
  },
} as const
