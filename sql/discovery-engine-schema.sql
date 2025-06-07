-- Discovery Engine Database Schema Extension
-- Compatible with existing Basarometer V5.2 schema
-- DO NOT modify existing tables - only add new discovery tables

-- Discovery Engine Tables (ADD to existing schema)
CREATE TABLE discovered_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    discovery_date DATE DEFAULT CURRENT_DATE,
    discovery_method VARCHAR(100),
    discovery_source VARCHAR(100),
    reliability_score INTEGER DEFAULT 50,
    last_scan_date DATE,
    scan_success_rate DECIMAL(5,2),
    scan_attempts INTEGER DEFAULT 0,
    successful_scans INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    location VARCHAR(255),
    business_type VARCHAR(100),
    contact_info JSONB,
    business_hours JSONB,
    delivery_areas TEXT[],
    product_categories TEXT[],
    price_range VARCHAR(50),
    quality_indicators TEXT[],
    validation_notes TEXT,
    admin_approved BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE source_reliability_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES discovered_sources(id) ON DELETE CASCADE,
    metric_date DATE DEFAULT CURRENT_DATE,
    data_accuracy DECIMAL(5,2),
    price_consistency DECIMAL(5,2),
    update_frequency INTEGER, -- hours between updates
    response_time INTEGER, -- milliseconds
    user_feedback_score DECIMAL(3,2),
    products_found INTEGER,
    products_valid INTEGER,
    hebrew_quality_score DECIMAL(5,2),
    meat_relevance_score DECIMAL(5,2),
    business_legitimacy_score DECIMAL(5,2),
    overall_quality_score DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discovery_search_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_method VARCHAR(100),
    search_query VARCHAR(255),
    search_results_count INTEGER,
    successful_discoveries INTEGER,
    execution_time INTEGER, -- milliseconds
    search_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    success BOOLEAN DEFAULT TRUE
);

CREATE TABLE price_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_identifier VARCHAR(255),
    meat_cut_id UUID REFERENCES meat_cuts(id),
    source1_id UUID REFERENCES discovered_sources(id),
    source2_id UUID REFERENCES discovered_sources(id),
    price1 DECIMAL(10,2),
    price2 DECIMAL(10,2),
    price_difference DECIMAL(10,2),
    percentage_difference DECIMAL(5,2),
    conflict_date DATE DEFAULT CURRENT_DATE,
    resolution_method VARCHAR(100),
    resolved_price DECIMAL(10,2),
    resolved BOOLEAN DEFAULT FALSE,
    resolver VARCHAR(100), -- 'algorithm' or 'admin'
    resolution_confidence DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE discovery_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type VARCHAR(100), -- 'url', 'name', 'content'
    pattern_value VARCHAR(255),
    pattern_regex VARCHAR(500),
    business_type VARCHAR(100),
    confidence_score DECIMAL(5,2),
    success_rate DECIMAL(5,2),
    times_used INTEGER DEFAULT 0,
    times_successful INTEGER DEFAULT 0,
    created_by VARCHAR(100), -- 'system' or 'admin'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_discovered_sources_status ON discovered_sources(status);
CREATE INDEX idx_discovered_sources_reliability ON discovered_sources(reliability_score);
CREATE INDEX idx_reliability_metrics_source ON source_reliability_metrics(source_id);
CREATE INDEX idx_reliability_metrics_date ON source_reliability_metrics(metric_date);
CREATE INDEX idx_price_conflicts_unresolved ON price_conflicts(resolved) WHERE resolved = FALSE;
CREATE INDEX idx_discovery_patterns_active ON discovery_patterns(is_active) WHERE is_active = TRUE;

-- Database functions for automation
CREATE OR REPLACE FUNCTION update_reliability_score(source_id_param UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    latest_metrics source_reliability_metrics%ROWTYPE;
    calculated_score DECIMAL(5,2);
BEGIN
    SELECT * INTO latest_metrics 
    FROM source_reliability_metrics 
    WHERE source_id = source_id_param 
    ORDER BY metric_date DESC 
    LIMIT 1;
    
    -- Calculate weighted reliability score
    calculated_score := (
        COALESCE(latest_metrics.data_accuracy, 50) * 0.25 +
        COALESCE(latest_metrics.price_consistency, 50) * 0.20 +
        COALESCE(latest_metrics.hebrew_quality_score, 50) * 0.15 +
        COALESCE(latest_metrics.meat_relevance_score, 50) * 0.15 +
        COALESCE(latest_metrics.business_legitimacy_score, 50) * 0.15 +
        COALESCE(latest_metrics.user_feedback_score * 20, 50) * 0.10
    );
    
    UPDATE discovered_sources 
    SET reliability_score = calculated_score,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = source_id_param;
    
    RETURN calculated_score;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_resolve_price_conflict(conflict_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_record price_conflicts%ROWTYPE;
    source1_reliability DECIMAL(5,2);
    source2_reliability DECIMAL(5,2);
    resolved_price_value DECIMAL(10,2);
    confidence DECIMAL(5,2);
BEGIN
    SELECT * INTO conflict_record FROM price_conflicts WHERE id = conflict_id_param;
    
    SELECT reliability_score INTO source1_reliability FROM discovered_sources WHERE id = conflict_record.source1_id;
    SELECT reliability_score INTO source2_reliability FROM discovered_sources WHERE id = conflict_record.source2_id;
    
    -- Use weighted average based on reliability
    IF source1_reliability + source2_reliability > 0 THEN
        resolved_price_value := (
            (conflict_record.price1 * source1_reliability + conflict_record.price2 * source2_reliability) / 
            (source1_reliability + source2_reliability)
        );
        confidence := ABS(source1_reliability - source2_reliability) / 100;
    ELSE
        resolved_price_value := (conflict_record.price1 + conflict_record.price2) / 2;
        confidence := 0.5;
    END IF;
    
    UPDATE price_conflicts 
    SET resolved = TRUE,
        resolved_price = resolved_price_value,
        resolution_method = 'weighted_average',
        resolver = 'algorithm',
        resolution_confidence = confidence,
        resolved_at = CURRENT_TIMESTAMP
    WHERE id = conflict_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Insert default discovery patterns for Israeli meat businesses
INSERT INTO discovery_patterns (pattern_type, pattern_value, pattern_regex, business_type, confidence_score, success_rate, created_by) VALUES
('name', 'קצביה', '.*קצב.*', 'meat_retailer', 0.95, 0.90, 'system'),
('name', 'בשר', '.*בשר.*', 'meat_retailer', 0.85, 0.80, 'system'),
('name', 'בקר', '.*בקר.*', 'meat_retailer', 0.80, 0.75, 'system'),
('name', 'עוף', '.*עוף.*', 'meat_retailer', 0.80, 0.75, 'system'),
('name', 'כבש', '.*כבש.*', 'meat_retailer', 0.80, 0.75, 'system'),
('url', 'butcher', '.*butcher.*', 'meat_retailer', 0.90, 0.85, 'system'),
('url', 'meat', '.*meat.*', 'meat_retailer', 0.85, 0.80, 'system'),
('content', 'אנטריקוט', '.*אנטריקוט.*', 'meat_retailer', 0.90, 0.85, 'system'),
('content', 'פילה', '.*פילה.*', 'meat_retailer', 0.85, 0.80, 'system'),
('content', 'כשר', '.*כשר.*', 'meat_retailer', 0.75, 0.70, 'system');

-- RLS Policies for Discovery Engine tables
ALTER TABLE discovered_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_reliability_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_search_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_patterns ENABLE ROW LEVEL SECURITY;

-- Public read access for discovery data
CREATE POLICY "Public read access on discovered_sources" ON discovered_sources FOR SELECT USING (admin_approved = TRUE);
CREATE POLICY "Public read access on source_reliability_metrics" ON source_reliability_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access on discovery_search_log" ON discovery_search_log FOR SELECT USING (true);
CREATE POLICY "Public read access on price_conflicts" ON price_conflicts FOR SELECT USING (resolved = TRUE);
CREATE POLICY "Public read access on discovery_patterns" ON discovery_patterns FOR SELECT USING (is_active = TRUE);

-- Admin policies (assuming admin check function exists)
CREATE POLICY "Admin full access on discovered_sources" ON discovered_sources FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "Admin full access on source_reliability_metrics" ON source_reliability_metrics FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "Admin full access on discovery_search_log" ON discovery_search_log FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "Admin full access on price_conflicts" ON price_conflicts FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "Admin full access on discovery_patterns" ON discovery_patterns FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Create views for dashboard data
CREATE OR REPLACE VIEW discovery_dashboard_stats AS
SELECT 
    COUNT(*) as total_sources,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_sources,
    COUNT(CASE WHEN admin_approved = TRUE THEN 1 END) as approved_sources,
    AVG(reliability_score) as avg_reliability,
    COUNT(CASE WHEN last_scan_date > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_scans
FROM discovered_sources;

CREATE OR REPLACE VIEW conflict_resolution_stats AS
SELECT 
    COUNT(*) as total_conflicts,
    COUNT(CASE WHEN resolved = FALSE THEN 1 END) as unresolved_conflicts,
    COUNT(CASE WHEN resolver = 'algorithm' THEN 1 END) as auto_resolved,
    COUNT(CASE WHEN resolver = 'admin' THEN 1 END) as manual_resolved,
    AVG(resolution_confidence) as avg_confidence
FROM price_conflicts;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;