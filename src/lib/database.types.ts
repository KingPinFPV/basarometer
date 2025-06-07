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
      discovered_sources: {
        Row: {
          id: string
          url: string
          name: string | null
          discovery_date: string | null
          discovery_method: string | null
          discovery_source: string | null
          reliability_score: number | null
          last_scan_date: string | null
          scan_success_rate: number | null
          scan_attempts: number | null
          successful_scans: number | null
          status: string | null
          location: string | null
          business_type: string | null
          contact_info: Json | null
          business_hours: Json | null
          delivery_areas: string[] | null
          product_categories: string[] | null
          price_range: string | null
          quality_indicators: string[] | null
          validation_notes: string | null
          admin_approved: boolean | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          url: string
          name?: string | null
          discovery_date?: string | null
          discovery_method?: string | null
          discovery_source?: string | null
          reliability_score?: number | null
          last_scan_date?: string | null
          scan_success_rate?: number | null
          scan_attempts?: number | null
          successful_scans?: number | null
          status?: string | null
          location?: string | null
          business_type?: string | null
          contact_info?: Json | null
          business_hours?: Json | null
          delivery_areas?: string[] | null
          product_categories?: string[] | null
          price_range?: string | null
          quality_indicators?: string[] | null
          validation_notes?: string | null
          admin_approved?: boolean | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          url?: string
          name?: string | null
          discovery_date?: string | null
          discovery_method?: string | null
          discovery_source?: string | null
          reliability_score?: number | null
          last_scan_date?: string | null
          scan_success_rate?: number | null
          scan_attempts?: number | null
          successful_scans?: number | null
          status?: string | null
          location?: string | null
          business_type?: string | null
          contact_info?: Json | null
          business_hours?: Json | null
          delivery_areas?: string[] | null
          product_categories?: string[] | null
          price_range?: string | null
          quality_indicators?: string[] | null
          validation_notes?: string | null
          admin_approved?: boolean | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      source_reliability_metrics: {
        Row: {
          id: string
          source_id: string | null
          metric_date: string | null
          data_accuracy: number | null
          price_consistency: number | null
          update_frequency: number | null
          response_time: number | null
          user_feedback_score: number | null
          products_found: number | null
          products_valid: number | null
          hebrew_quality_score: number | null
          meat_relevance_score: number | null
          business_legitimacy_score: number | null
          overall_quality_score: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source_id?: string | null
          metric_date?: string | null
          data_accuracy?: number | null
          price_consistency?: number | null
          update_frequency?: number | null
          response_time?: number | null
          user_feedback_score?: number | null
          products_found?: number | null
          products_valid?: number | null
          hebrew_quality_score?: number | null
          meat_relevance_score?: number | null
          business_legitimacy_score?: number | null
          overall_quality_score?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          source_id?: string | null
          metric_date?: string | null
          data_accuracy?: number | null
          price_consistency?: number | null
          update_frequency?: number | null
          response_time?: number | null
          user_feedback_score?: number | null
          products_found?: number | null
          products_valid?: number | null
          hebrew_quality_score?: number | null
          meat_relevance_score?: number | null
          business_legitimacy_score?: number | null
          overall_quality_score?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      discovery_search_log: {
        Row: {
          id: string
          search_method: string | null
          search_query: string | null
          search_results_count: number | null
          successful_discoveries: number | null
          execution_time: number | null
          search_date: string
          error_message: string | null
          success: boolean | null
        }
        Insert: {
          id?: string
          search_method?: string | null
          search_query?: string | null
          search_results_count?: number | null
          successful_discoveries?: number | null
          execution_time?: number | null
          search_date?: string
          error_message?: string | null
          success?: boolean | null
        }
        Update: {
          id?: string
          search_method?: string | null
          search_query?: string | null
          search_results_count?: number | null
          successful_discoveries?: number | null
          execution_time?: number | null
          search_date?: string
          error_message?: string | null
          success?: boolean | null
        }
      }
      price_conflicts: {
        Row: {
          id: string
          product_identifier: string | null
          meat_cut_id: string | null
          source1_id: string | null
          source2_id: string | null
          price1: number | null
          price2: number | null
          price_difference: number | null
          percentage_difference: number | null
          conflict_date: string | null
          resolution_method: string | null
          resolved_price: number | null
          resolved: boolean | null
          resolver: string | null
          resolution_confidence: number | null
          notes: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          product_identifier?: string | null
          meat_cut_id?: string | null
          source1_id?: string | null
          source2_id?: string | null
          price1?: number | null
          price2?: number | null
          price_difference?: number | null
          percentage_difference?: number | null
          conflict_date?: string | null
          resolution_method?: string | null
          resolved_price?: number | null
          resolved?: boolean | null
          resolver?: string | null
          resolution_confidence?: number | null
          notes?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          product_identifier?: string | null
          meat_cut_id?: string | null
          source1_id?: string | null
          source2_id?: string | null
          price1?: number | null
          price2?: number | null
          price_difference?: number | null
          percentage_difference?: number | null
          conflict_date?: string | null
          resolution_method?: string | null
          resolved_price?: number | null
          resolved?: boolean | null
          resolver?: string | null
          resolution_confidence?: number | null
          notes?: string | null
          created_at?: string
          resolved_at?: string | null
        }
      }
      discovery_patterns: {
        Row: {
          id: string
          pattern_type: string | null
          pattern_value: string | null
          pattern_regex: string | null
          business_type: string | null
          confidence_score: number | null
          success_rate: number | null
          times_used: number | null
          times_successful: number | null
          created_by: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          pattern_type?: string | null
          pattern_value?: string | null
          pattern_regex?: string | null
          business_type?: string | null
          confidence_score?: number | null
          success_rate?: number | null
          times_used?: number | null
          times_successful?: number | null
          created_by?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          pattern_type?: string | null
          pattern_value?: string | null
          pattern_regex?: string | null
          business_type?: string | null
          confidence_score?: number | null
          success_rate?: number | null
          times_used?: number | null
          times_successful?: number | null
          created_by?: string | null
          is_active?: boolean | null
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

// Discovery Engine Types
export type DiscoveredSource = Database['public']['Tables']['discovered_sources']['Row']
export type SourceReliabilityMetrics = Database['public']['Tables']['source_reliability_metrics']['Row']
export type DiscoverySearchLog = Database['public']['Tables']['discovery_search_log']['Row']
export type PriceConflict = Database['public']['Tables']['price_conflicts']['Row']
export type DiscoveryPattern = Database['public']['Tables']['discovery_patterns']['Row']

export interface BusinessCandidate {
  url: string
  name: string | null
  description?: string
  location?: string
  business_type?: string
}

export interface ValidationResult {
  isValid: boolean
  confidence: number
  scores: {
    nameScore: number
    contentScore: number
    urlScore: number
    locationScore: number
    metaScore: number
    overallScore: number
  }
  reasons: string[]
  meatCategories: string[]
  qualityIndicators: string[]
}

export interface BusinessDiscovery {
  url: string
  name: string
  location?: string
  business_type: string
  discoveryMethod: string
  discoverySource: string
  confidence: number
  meatCategories: string[]
  qualityIndicators: string[]
  contactInfo?: any
  businessHours?: any
}

export interface DiscoveryResult {
  totalDiscovered: number
  validated: number
  approved: number
  avgConfidence: number
  discoveries: BusinessDiscovery[]
  conflicts: PriceConflict[]
  newPatterns: DiscoveryPattern[]
}

export interface DiscoverySession {
  sessionId: string
  startTime: Date
  endTime?: Date
  status: 'running' | 'completed' | 'failed'
  discoveries: BusinessDiscovery[]
  conflicts: PriceConflict[]
  errors: string[]
}

export interface ReliabilityScoring {
  dataAccuracy: number
  priceConsistency: number
  hebrewQuality: number
  meatRelevance: number
  businessLegitimacy: number
  overallScore: number
}

export interface ConflictResolution {
  conflictId: string
  method: 'algorithm' | 'admin' | 'community'
  resolvedPrice: number
  confidence: number
  resolver: string
  timestamp: Date
}