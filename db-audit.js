// db-audit.js
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditDatabase() {
  console.log('🔍 Starting Database Audit...');
  
  try {
    // Check for core tables
    const coreTables = ['meat_cuts', 'meat_name_mappings', 'meat_discovery_queue', 'products'];
    
    // Check for claimed Learning Tables
    const learningTables = [
      'learning_patterns',
      'hebrew_nlp_analytics', 
      'pattern_learning_sessions',
      'quality_predictions',
      'market_intelligence',
      'advanced_conflicts'
    ];
    
    // Check for Scanner System Tables
    const scannerTables = [
      'scanner_products',
      'scanner_activity',
      'scanner_ingestion_logs', 
      'scanner_quality_metrics'
    ];
    
    console.log('\n📋 Checking Core Tables:');
    for (const table of coreTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: EXISTS (sample count: ${data?.length || 0})`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    console.log('\n🧠 Checking Learning System Tables:');
    for (const table of learningTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: EXISTS (sample count: ${data?.length || 0})`);
        }
      } catch (err) {
        console.log(`❌ ${table}: NOT FOUND or ACCESS DENIED`);
      }
    }
    
    console.log('\n🔍 Checking Scanner System Tables:');
    for (const table of scannerTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: EXISTS (sample count: ${data?.length || 0})`);
        }
      } catch (err) {
        console.log(`❌ ${table}: NOT FOUND or ACCESS DENIED`);
      }
    }
    
    // Check for Enhanced Intelligence Tables
    const enhancedTables = [
      'enhanced_meat_data',
      'quality_grade_mappings',
      'market_intelligence_cache'
    ];
    
    console.log('\n🎯 Checking Enhanced Intelligence Tables:');
    for (const table of enhancedTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: EXISTS (sample count: ${data?.length || 0})`);
        }
      } catch (err) {
        console.log(`❌ ${table}: NOT FOUND or ACCESS DENIED`);
      }
    }
    
  } catch (error) {
    console.log('Database audit failed:', error.message);
  }
}

auditDatabase();