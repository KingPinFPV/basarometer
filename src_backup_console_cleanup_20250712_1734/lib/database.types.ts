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
      learning_patterns: {
        Row: {
          id: string
          pattern_type: string
          pattern_category: string
          pattern_value: string
          pattern_regex: string | null
          context_data: Json
          confidence_score: number
          success_rate: number
          sample_size: number
          hebrew_specific: boolean
          quality_indicators: string[] | null
          business_context: string | null
          geographic_relevance: string[] | null
          is_active: boolean
          created_at: string
          last_updated: string
        }
        Insert: {
          id?: string
          pattern_type: string
          pattern_category: string
          pattern_value: string
          pattern_regex?: string | null
          context_data?: Json
          confidence_score?: number
          success_rate?: number
          sample_size?: number
          hebrew_specific?: boolean
          quality_indicators?: string[] | null
          business_context?: string | null
          geographic_relevance?: string[] | null
          is_active?: boolean
          created_at?: string
          last_updated?: string
        }
        Update: {
          id?: string
          pattern_type?: string
          pattern_category?: string
          pattern_value?: string
          pattern_regex?: string | null
          context_data?: Json
          confidence_score?: number
          success_rate?: number
          sample_size?: number
          hebrew_specific?: boolean
          quality_indicators?: string[] | null
          business_context?: string | null
          geographic_relevance?: string[] | null
          is_active?: boolean
          created_at?: string
          last_updated?: string
        }
      }
      pattern_learning_sessions: {
        Row: {
          id: string
          session_type: string
          patterns_learned: number
          patterns_updated: number
          patterns_deprecated: number
          session_accuracy: number | null
          hebrew_patterns_count: number
          execution_time_ms: number | null
          session_data: Json
          session_date: string
          trigger_event: string | null
          success: boolean
        }
        Insert: {
          id?: string
          session_type: string
          patterns_learned?: number
          patterns_updated?: number
          patterns_deprecated?: number
          session_accuracy?: number | null
          hebrew_patterns_count?: number
          execution_time_ms?: number | null
          session_data?: Json
          session_date?: string
          trigger_event?: string | null
          success?: boolean
        }
        Update: {
          id?: string
          session_type?: string
          patterns_learned?: number
          patterns_updated?: number
          patterns_deprecated?: number
          session_accuracy?: number | null
          hebrew_patterns_count?: number
          execution_time_ms?: number | null
          session_data?: Json
          session_date?: string
          trigger_event?: string | null
          success?: boolean
        }
      }
      quality_predictions: {
        Row: {
          id: string
          target_name: string
          target_url: string | null
          target_type: string
          predicted_reliability: number | null
          predicted_categories: string[] | null
          prediction_confidence: number | null
          prediction_factors: Json
          hebrew_quality_prediction: number | null
          meat_relevance_prediction: number | null
          business_legitimacy_prediction: number | null
          actual_reliability: number | null
          prediction_accuracy: number | null
          model_version: string
          features_used: string[] | null
          prediction_method: string
          validated: boolean
          validation_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          target_name: string
          target_url?: string | null
          target_type: string
          predicted_reliability?: number | null
          predicted_categories?: string[] | null
          prediction_confidence?: number | null
          prediction_factors?: Json
          hebrew_quality_prediction?: number | null
          meat_relevance_prediction?: number | null
          business_legitimacy_prediction?: number | null
          actual_reliability?: number | null
          prediction_accuracy?: number | null
          model_version?: string
          features_used?: string[] | null
          prediction_method?: string
          validated?: boolean
          validation_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          target_name?: string
          target_url?: string | null
          target_type?: string
          predicted_reliability?: number | null
          predicted_categories?: string[] | null
          prediction_confidence?: number | null
          prediction_factors?: Json
          hebrew_quality_prediction?: number | null
          meat_relevance_prediction?: number | null
          business_legitimacy_prediction?: number | null
          actual_reliability?: number | null
          prediction_accuracy?: number | null
          model_version?: string
          features_used?: string[] | null
          prediction_method?: string
          validated?: boolean
          validation_date?: string | null
          created_at?: string
        }
      }
      advanced_conflicts: {
        Row: {
          id: string
          conflict_type: string
          primary_item_name: string
          secondary_item_name: string | null
          primary_source: string | null
          secondary_source: string | null
          conflict_data: Json
          confidence_score: number | null
          auto_resolution_attempted: boolean
          auto_resolution_success: boolean
          resolution_method: string | null
          resolution_confidence: number | null
          human_intervention_required: boolean
          resolution_time_ms: number | null
          learning_applied: boolean
          hebrew_processing_involved: boolean
          market_impact_score: number | null
          resolution_notes: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          conflict_type: string
          primary_item_name: string
          secondary_item_name?: string | null
          primary_source?: string | null
          secondary_source?: string | null
          conflict_data: Json
          confidence_score?: number | null
          auto_resolution_attempted?: boolean
          auto_resolution_success?: boolean
          resolution_method?: string | null
          resolution_confidence?: number | null
          human_intervention_required?: boolean
          resolution_time_ms?: number | null
          learning_applied?: boolean
          hebrew_processing_involved?: boolean
          market_impact_score?: number | null
          resolution_notes?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          conflict_type?: string
          primary_item_name?: string
          secondary_item_name?: string | null
          primary_source?: string | null
          secondary_source?: string | null
          conflict_data?: Json
          confidence_score?: number | null
          auto_resolution_attempted?: boolean
          auto_resolution_success?: boolean
          resolution_method?: string | null
          resolution_confidence?: number | null
          human_intervention_required?: boolean
          resolution_time_ms?: number | null
          learning_applied?: boolean
          hebrew_processing_involved?: boolean
          market_impact_score?: number | null
          resolution_notes?: string | null
          created_at?: string
          resolved_at?: string | null
        }
      }
      market_intelligence: {
        Row: {
          id: string
          intelligence_type: string
          market_segment: string
          geographic_scope: string[] | null
          time_period: string | null
          data_points: number | null
          trend_direction: string | null
          trend_strength: number | null
          confidence_level: number | null
          insights: Json
          actionable_recommendations: string[] | null
          hebrew_analysis: string | null
          supporting_data: Json
          generated_at: string
          valid_until: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          intelligence_type: string
          market_segment: string
          geographic_scope?: string[] | null
          time_period?: string | null
          data_points?: number | null
          trend_direction?: string | null
          trend_strength?: number | null
          confidence_level?: number | null
          insights?: Json
          actionable_recommendations?: string[] | null
          hebrew_analysis?: string | null
          supporting_data?: Json
          generated_at?: string
          valid_until?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          intelligence_type?: string
          market_segment?: string
          geographic_scope?: string[] | null
          time_period?: string | null
          data_points?: number | null
          trend_direction?: string | null
          trend_strength?: number | null
          confidence_level?: number | null
          insights?: Json
          actionable_recommendations?: string[] | null
          hebrew_analysis?: string | null
          supporting_data?: Json
          generated_at?: string
          valid_until?: string | null
          is_active?: boolean
        }
      }
      hebrew_nlp_analytics: {
        Row: {
          id: string
          text_sample: string
          original_source: string | null
          processing_type: string
          detected_patterns: string[] | null
          quality_indicators: string[] | null
          meat_terms_found: string[] | null
          location_terms_found: string[] | null
          business_type_indicators: string[] | null
          confidence_scores: Json
          processing_time_ms: number | null
          hebrew_complexity_score: number | null
          processing_accuracy: number | null
          learning_feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          text_sample: string
          original_source?: string | null
          processing_type: string
          detected_patterns?: string[] | null
          quality_indicators?: string[] | null
          meat_terms_found?: string[] | null
          location_terms_found?: string[] | null
          business_type_indicators?: string[] | null
          confidence_scores?: Json
          processing_time_ms?: number | null
          hebrew_complexity_score?: number | null
          processing_accuracy?: number | null
          learning_feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          text_sample?: string
          original_source?: string | null
          processing_type?: string
          detected_patterns?: string[] | null
          quality_indicators?: string[] | null
          meat_terms_found?: string[] | null
          location_terms_found?: string[] | null
          business_type_indicators?: string[] | null
          confidence_scores?: Json
          processing_time_ms?: number | null
          hebrew_complexity_score?: number | null
          processing_accuracy?: number | null
          learning_feedback?: string | null
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

// Advanced Learning Types (Phase 2)
export type LearningPattern = Database['public']['Tables']['learning_patterns']['Row']
export type PatternLearningSession = Database['public']['Tables']['pattern_learning_sessions']['Row']
export type QualityPrediction = Database['public']['Tables']['quality_predictions']['Row']
export type AdvancedConflict = Database['public']['Tables']['advanced_conflicts']['Row']
export type MarketIntelligence = Database['public']['Tables']['market_intelligence']['Row']
export type HebrewNLPAnalytics = Database['public']['Tables']['hebrew_nlp_analytics']['Row']

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

// Advanced Learning Interfaces (Phase 2)
export interface LearningEngineResult {
  patternsLearned: number
  patternsUpdated: number
  accuracy: number
  confidence: number
  executionTime: number
  hebrewPatternsCount: number
}

export interface QualityPredictionResult {
  reliability: number
  categories: string[]
  confidence: number
  factors: {
    nameScore: number
    urlScore: number
    contentScore: number
    hebrewQuality: number
    meatRelevance: number
    businessLegitimacy: number
  }
  predictions: {
    willSucceed: boolean
    qualityLevel: 'high' | 'medium' | 'low'
    recommendedAction: 'approve' | 'review' | 'reject'
  }
}

export interface AdvancedConflictResult {
  conflictType: string
  autoResolved: boolean
  confidence: number
  method: string
  resolutionTime: number
  learningApplied: boolean
  humanInterventionRequired: boolean
}

export interface MarketIntelligenceInsight {
  type: string
  segment: string
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile'
    strength: number
    confidence: number
  }
  recommendations: string[]
  hebrewAnalysis: string
  dataPoints: number
  timeframe: string
}

export interface HebrewProcessingResult {
  detectedPatterns: string[]
  qualityIndicators: string[]
  meatTerms: string[]
  locationTerms: string[]
  businessTypes: string[]
  confidence: {
    overall: number
    hebrew: number
    meat: number
    location: number
    business: number
  }
  complexity: number
  accuracy: number
}

export interface LearningSystemStats {
  totalPatterns: number
  activePatterns: number
  hebrewPatterns: number
  averageAccuracy: number
  recentSessions: number
  autoResolutionRate: number
  predictionAccuracy: number
  marketInsights: number
}