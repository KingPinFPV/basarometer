-- Phase 2 Advanced Learning Database Migration - SAFE VERSION
-- Compatible with any Supabase database
-- No dependencies on existing discovery tables

-- ================================
-- PATTERN LEARNING SYSTEM
-- ================================

CREATE TABLE IF NOT EXISTS public.learning_patterns (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    pattern_type VARCHAR(100) NOT NULL,
    pattern_category VARCHAR(100) NOT NULL,
    pattern_value TEXT NOT NULL,
    pattern_regex VARCHAR(1000),
    context_data JSONB DEFAULT '{}'::jsonb,
    confidence_score NUMERIC(5,2) DEFAULT 50.0,
    success_rate NUMERIC(5,2) DEFAULT 0.0,
    sample_size INTEGER DEFAULT 0,
    hebrew_specific BOOLEAN DEFAULT FALSE,
    quality_indicators TEXT[],
    business_context VARCHAR(255),
    geographic_relevance TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT learning_patterns_pkey PRIMARY KEY (id),
    CONSTRAINT learning_patterns_confidence_check CHECK (confidence_score >= 0 AND confidence_score <= 100),
    CONSTRAINT learning_patterns_success_rate_check CHECK (success_rate >= 0 AND success_rate <= 100)
);

CREATE TABLE IF NOT EXISTS public.pattern_learning_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    session_type VARCHAR(100) NOT NULL,
    patterns_learned INTEGER DEFAULT 0,
    patterns_updated INTEGER DEFAULT 0,
    patterns_deprecated INTEGER DEFAULT 0,
    session_accuracy NUMERIC(5,2),
    hebrew_patterns_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    session_data JSONB DEFAULT '{}'::jsonb,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trigger_event VARCHAR(255),
    success BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT pattern_learning_sessions_pkey PRIMARY KEY (id)
);

-- ================================
-- QUALITY PREDICTION SYSTEM
-- ================================

CREATE TABLE IF NOT EXISTS public.quality_predictions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    target_name VARCHAR(255) NOT NULL,
    target_url TEXT,
    target_type VARCHAR(100) NOT NULL,
    predicted_reliability NUMERIC(5,2),
    predicted_categories TEXT[],
    prediction_confidence NUMERIC(5,2),
    prediction_factors JSONB DEFAULT '{}'::jsonb,
    hebrew_quality_prediction NUMERIC(5,2),
    meat_relevance_prediction NUMERIC(5,2),
    business_legitimacy_prediction NUMERIC(5,2),
    actual_reliability NUMERIC(5,2),
    prediction_accuracy NUMERIC(5,2),
    model_version VARCHAR(50) DEFAULT 'v1.0',
    features_used TEXT[],
    prediction_method VARCHAR(100) DEFAULT 'pattern_matching',
    validated BOOLEAN DEFAULT FALSE,
    validation_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT quality_predictions_pkey PRIMARY KEY (id)
);

-- ================================
-- ADVANCED CONFLICT DETECTION
-- ================================

CREATE TABLE IF NOT EXISTS public.advanced_conflicts (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    conflict_type VARCHAR(100) NOT NULL,
    primary_item_name VARCHAR(255) NOT NULL,
    secondary_item_name VARCHAR(255),
    primary_source VARCHAR(255),
    secondary_source VARCHAR(255),
    conflict_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence_score NUMERIC(5,2),
    auto_resolution_attempted BOOLEAN DEFAULT FALSE,
    auto_resolution_success BOOLEAN DEFAULT FALSE,
    resolution_method VARCHAR(100),
    resolution_confidence NUMERIC(5,2),
    human_intervention_required BOOLEAN DEFAULT FALSE,
    resolution_time_ms INTEGER,
    learning_applied BOOLEAN DEFAULT FALSE,
    hebrew_processing_involved BOOLEAN DEFAULT FALSE,
    market_impact_score NUMERIC(5,2),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT advanced_conflicts_pkey PRIMARY KEY (id)
);

-- ================================
-- MARKET INTELLIGENCE ANALYTICS
-- ================================

CREATE TABLE IF NOT EXISTS public.market_intelligence (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    intelligence_type VARCHAR(100) NOT NULL,
    market_segment VARCHAR(100) NOT NULL,
    geographic_scope TEXT[],
    time_period VARCHAR(100),
    data_points INTEGER,
    trend_direction VARCHAR(50),
    trend_strength NUMERIC(5,2),
    confidence_level NUMERIC(5,2),
    insights JSONB DEFAULT '{}'::jsonb,
    actionable_recommendations TEXT[],
    hebrew_analysis TEXT,
    supporting_data JSONB DEFAULT '{}'::jsonb,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT market_intelligence_pkey PRIMARY KEY (id)
);

-- ================================
-- HEBREW NLP ENHANCEMENT
-- ================================

CREATE TABLE IF NOT EXISTS public.hebrew_nlp_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    text_sample TEXT NOT NULL,
    original_source VARCHAR(255),
    processing_type VARCHAR(100) NOT NULL,
    detected_patterns TEXT[],
    quality_indicators TEXT[],
    meat_terms_found TEXT[],
    location_terms_found TEXT[],
    business_type_indicators TEXT[],
    confidence_scores JSONB DEFAULT '{}'::jsonb,
    processing_time_ms INTEGER,
    hebrew_complexity_score NUMERIC(5,2),
    processing_accuracy NUMERIC(5,2),
    learning_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT hebrew_nlp_analytics_pkey PRIMARY KEY (id)
);

-- ================================
-- PERFORMANCE INDEXES
-- ================================

-- Create indexes only if they don't exist
DO $$ 
BEGIN
    -- Learning patterns indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_patterns_type') THEN
        CREATE INDEX idx_learning_patterns_type ON public.learning_patterns(pattern_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_patterns_category') THEN
        CREATE INDEX idx_learning_patterns_category ON public.learning_patterns(pattern_category);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_patterns_active') THEN
        CREATE INDEX idx_learning_patterns_active ON public.learning_patterns(is_active) WHERE is_active = TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_patterns_hebrew') THEN
        CREATE INDEX idx_learning_patterns_hebrew ON public.learning_patterns(hebrew_specific) WHERE hebrew_specific = TRUE;
    END IF;
    
    -- Pattern sessions indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pattern_sessions_type') THEN
        CREATE INDEX idx_pattern_sessions_type ON public.pattern_learning_sessions(session_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pattern_sessions_date') THEN
        CREATE INDEX idx_pattern_sessions_date ON public.pattern_learning_sessions(session_date DESC);
    END IF;
    
    -- Quality predictions indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quality_predictions_type') THEN
        CREATE INDEX idx_quality_predictions_type ON public.quality_predictions(target_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quality_predictions_validated') THEN
        CREATE INDEX idx_quality_predictions_validated ON public.quality_predictions(validated);
    END IF;
    
    -- Advanced conflicts indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_advanced_conflicts_type') THEN
        CREATE INDEX idx_advanced_conflicts_type ON public.advanced_conflicts(conflict_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_advanced_conflicts_unresolved') THEN
        CREATE INDEX idx_advanced_conflicts_unresolved ON public.advanced_conflicts(auto_resolution_success) WHERE auto_resolution_success = FALSE;
    END IF;
    
    -- Market intelligence indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_market_intelligence_type') THEN
        CREATE INDEX idx_market_intelligence_type ON public.market_intelligence(intelligence_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_market_intelligence_segment') THEN
        CREATE INDEX idx_market_intelligence_segment ON public.market_intelligence(market_segment);
    END IF;
    
    -- Hebrew NLP indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_hebrew_nlp_type') THEN
        CREATE INDEX idx_hebrew_nlp_type ON public.hebrew_nlp_analytics(processing_type);
    END IF;
    
END $$;

-- ================================
-- ROW LEVEL SECURITY (Optional)
-- ================================

-- Enable RLS (will only work if auth system is set up)
DO $$ 
BEGIN
    -- Only enable RLS if user_profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        ALTER TABLE public.learning_patterns ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.pattern_learning_sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.quality_predictions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.advanced_conflicts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.market_intelligence ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.hebrew_nlp_analytics ENABLE ROW LEVEL SECURITY;
        
        -- Create basic policies for admin access
        DROP POLICY IF EXISTS "Admin full access to learning_patterns" ON public.learning_patterns;
        CREATE POLICY "Admin full access to learning_patterns" ON public.learning_patterns
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.is_admin = TRUE
                )
            );
        
        DROP POLICY IF EXISTS "Admin full access to pattern_learning_sessions" ON public.pattern_learning_sessions;
        CREATE POLICY "Admin full access to pattern_learning_sessions" ON public.pattern_learning_sessions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.is_admin = TRUE
                )
            );
        
        DROP POLICY IF EXISTS "Admin full access to quality_predictions" ON public.quality_predictions;
        CREATE POLICY "Admin full access to quality_predictions" ON public.quality_predictions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.is_admin = TRUE
                )
            );
        
        DROP POLICY IF EXISTS "Admin full access to advanced_conflicts" ON public.advanced_conflicts;
        CREATE POLICY "Admin full access to advanced_conflicts" ON public.advanced_conflicts
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.is_admin = TRUE
                )
            );
        
        DROP POLICY IF EXISTS "Admin full access to market_intelligence" ON public.market_intelligence;
        CREATE POLICY "Admin full access to market_intelligence" ON public.market_intelligence
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.is_admin = TRUE
                )
            );
        
        DROP POLICY IF EXISTS "Admin full access to hebrew_nlp_analytics" ON public.hebrew_nlp_analytics;
        CREATE POLICY "Admin full access to hebrew_nlp_analytics" ON public.hebrew_nlp_analytics
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.is_admin = TRUE
                )
            );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore RLS errors if auth system not set up
        NULL;
END $$;

-- ================================
-- MIGRATION LOG
-- ================================

-- Create migration log table
CREATE TABLE IF NOT EXISTS public.migration_log (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    migration_description TEXT,
    tables_created INTEGER DEFAULT 0,
    migration_status VARCHAR(50) DEFAULT 'completed',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT migration_log_pkey PRIMARY KEY (id)
);

-- Insert migration completion record
INSERT INTO public.migration_log (
    migration_name,
    migration_description,
    tables_created,
    migration_status
) VALUES (
    'PHASE2_ADVANCED_LEARNING_SAFE',
    'Safe Advanced Learning Database Extension - 6 tables created for Pattern Learning, Quality Predictions, Advanced Conflicts, Market Intelligence, Hebrew NLP Analytics',
    6,
    'completed'
);

-- ================================
-- VALIDATION AND VERIFICATION
-- ================================

-- Simple validation query
SELECT 
    'learning_patterns' as table_name,
    COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'learning_patterns' AND table_schema = 'public'

UNION ALL

SELECT 
    'pattern_learning_sessions' as table_name,
    COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'pattern_learning_sessions' AND table_schema = 'public'

UNION ALL

SELECT 
    'quality_predictions' as table_name,
    COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'quality_predictions' AND table_schema = 'public'

UNION ALL

SELECT 
    'advanced_conflicts' as table_name,
    COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'advanced_conflicts' AND table_schema = 'public'

UNION ALL

SELECT 
    'market_intelligence' as table_name,
    COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'market_intelligence' AND table_schema = 'public'

UNION ALL

SELECT 
    'hebrew_nlp_analytics' as table_name,
    COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'hebrew_nlp_analytics' AND table_schema = 'public';

-- Show migration status
SELECT * FROM public.migration_log WHERE migration_name LIKE 'PHASE2%' ORDER BY executed_at DESC LIMIT 1;