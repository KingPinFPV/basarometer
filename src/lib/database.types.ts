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
      meat_categories: {
        Row: {
          id: string
          name_hebrew: string
          name_english: string
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name_hebrew: string
          name_english: string
          display_order: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name_hebrew?: string
          name_english?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      meat_sub_categories: {
        Row: {
          id: string
          category_id: string
          name_hebrew: string
          name_english: string
          icon: string | null
          description: string | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name_hebrew: string
          name_english: string
          icon?: string | null
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name_hebrew?: string
          name_english?: string
          icon?: string | null
          description?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      meat_cuts: {
        Row: {
          id: string
          category_id: string
          sub_category_id: string | null
          name_hebrew: string
          name_english: string | null
          description: string | null
          typical_price_range_min: number | null
          typical_price_range_max: number | null
          is_popular: boolean
          display_order: number | null
          is_active: boolean
          attributes: Json
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          sub_category_id?: string | null
          name_hebrew: string
          name_english?: string | null
          description?: string | null
          typical_price_range_min?: number | null
          typical_price_range_max?: number | null
          is_popular?: boolean
          display_order?: number | null
          is_active?: boolean
          attributes?: Json
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          sub_category_id?: string | null
          name_hebrew?: string
          name_english?: string | null
          description?: string | null
          typical_price_range_min?: number | null
          typical_price_range_max?: number | null
          is_popular?: boolean
          display_order?: number | null
          is_active?: boolean
          attributes?: Json
          created_at?: string
        }
      }
      price_reports: {
        Row: {
          id: string
          meat_cut_id: string
          retailer_id: string
          price_per_kg: number
          is_on_sale: boolean
          sale_price_per_kg: number | null
          reported_by: string | null
          location: string | null
          confidence_score: number
          verified_at: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          meat_cut_id: string
          retailer_id: string
          price_per_kg: number
          is_on_sale?: boolean
          sale_price_per_kg?: number | null
          reported_by?: string | null
          location?: string | null
          confidence_score?: number
          verified_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          meat_cut_id?: string
          retailer_id?: string
          price_per_kg?: number
          is_on_sale?: boolean
          sale_price_per_kg?: number | null
          reported_by?: string | null
          location?: string | null
          confidence_score?: number
          verified_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
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
          id: string
          name: string
          type: string
          logo_url: string | null
          website_url: string | null
          is_chain: boolean
          location_coverage: string[]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          logo_url?: string | null
          website_url?: string | null
          is_chain?: boolean
          location_coverage?: string[]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          logo_url?: string | null
          website_url?: string | null
          is_chain?: boolean
          location_coverage?: string[]
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_categories_with_subcategories: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_meat_categories_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_meat_cuts_hierarchical: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_migration: {
        Args: Record<PropertyKey, never>
        Returns: Array<{
          total_cuts: number
          mapped_cuts: number
          unmapped_cuts: number
          price_reports_preserved: number
        }>
      }
      check_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Enhanced types for the hierarchical structure
export type MeatCategory = Database['public']['Tables']['meat_categories']['Row']
export type MeatSubCategory = Database['public']['Tables']['meat_sub_categories']['Row']
export type MeatCut = Database['public']['Tables']['meat_cuts']['Row']
export type Retailer = Database['public']['Tables']['retailers']['Row']
export type PriceReport = Database['public']['Tables']['price_reports']['Row']

export interface CategoryWithSubCategories extends MeatCategory {
  sub_categories: (MeatSubCategory & {
    cuts_count: number
  })[]
}

export interface SubCategoryWithCuts extends MeatSubCategory {
  cuts: MeatCut[]
}

export interface PriceReportWithDetails extends PriceReport {
  meat_cuts: MeatCut | null
  retailers: Retailer | null
}

export interface HierarchicalData {
  category_id: string
  category_name_hebrew: string
  category_name_english: string
  sub_categories: {
    sub_category_id: string
    sub_category_name_hebrew: string
    sub_category_name_english: string
    icon: string | null
    cuts: {
      id: string
      name_hebrew: string
      name_english: string | null
      is_popular: boolean
      attributes: Json
    }[]
  }[]
}