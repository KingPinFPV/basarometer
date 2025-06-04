export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cuts: {
        Row: {
          id: number
          name: string
          category: string
          description: string | null
          is_premium: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          category: string
          description?: string | null
          is_premium?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          category?: string
          description?: string | null
          is_premium?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      price_reports: {
        Row: {
          id: number
          product_id: number
          retailer_id: number
          price: number
          weight: number | null
          unit: string | null
          image_url: string | null
          notes: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
          user_id: string | null
          is_on_sale: boolean | null
          sale_price: number | null
          sale_expires_at: string | null
          discount_percentage: number | null
          reported_at: string | null
        }
        Insert: {
          id?: number
          product_id: number
          retailer_id: number
          price: number
          weight?: number | null
          unit?: string | null
          image_url?: string | null
          notes?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
          is_on_sale?: boolean | null
          sale_price?: number | null
          sale_expires_at?: string | null
          discount_percentage?: number | null
          reported_at?: string | null
        }
        Update: {
          id?: number
          product_id?: number
          retailer_id?: number
          price?: number
          weight?: number | null
          unit?: string | null
          image_url?: string | null
          notes?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
          is_on_sale?: boolean | null
          sale_price?: number | null
          sale_expires_at?: string | null
          discount_percentage?: number | null
          reported_at?: string | null
        }
      }
      products: {
        Row: {
          id: number
          name: string
          brand: string | null
          cut_id: number | null
          subtype_id: number | null
          description: string | null
          image_url: string | null
          category: string | null
          subcategory: string | null
          normalized_name: string | null
          keywords: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          brand?: string | null
          cut_id?: number | null
          subtype_id?: number | null
          description?: string | null
          image_url?: string | null
          category?: string | null
          subcategory?: string | null
          normalized_name?: string | null
          keywords?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          brand?: string | null
          cut_id?: number | null
          subtype_id?: number | null
          description?: string | null
          image_url?: string | null
          category?: string | null
          subcategory?: string | null
          normalized_name?: string | null
          keywords?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      product_subtypes: {
        Row: {
          id: number
          name: string
          cut_id: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          cut_id: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          cut_id?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          first_name: string | null
          last_name: string | null
          email: string | null
          avatar_url: string | null
          role: string | null
          is_active: boolean | null
          last_login: string | null
          created_at: string
          updated_at: string
          is_admin: boolean | null
        }
        Insert: {
          id: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          avatar_url?: string | null
          role?: string | null
          is_active?: boolean | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean | null
        }
        Update: {
          id?: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          avatar_url?: string | null
          role?: string | null
          is_active?: boolean | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          city: string | null
          is_admin: boolean | null
          reputation_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          city?: string | null
          is_admin?: boolean | null
          reputation_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          city?: string | null
          is_admin?: boolean | null
          reputation_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      retailers: {
        Row: {
          id: number
          name: string
          type: string | null
          address: string | null
          city: string | null
          region: string | null
          phone: string | null
          email: string | null
          website: string | null
          logo_url: string | null
          chain_id: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          type?: string | null
          address?: string | null
          city?: string | null
          region?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          chain_id?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          type?: string | null
          address?: string | null
          city?: string | null
          region?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          chain_id?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type PriceReportWithDetails = Database['public']['Tables']['price_reports']['Row'] & {
  products: (Database['public']['Tables']['products']['Row'] & {
    cuts: Database['public']['Tables']['cuts']['Row'] | null
  }) | null
  retailers: Database['public']['Tables']['retailers']['Row'] | null
}