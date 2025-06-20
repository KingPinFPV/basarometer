#!/usr/bin/env python3
"""
Basarometer 5.0 Hybrid Integration - Data Source Assessment
Phase 1: Assess which Israeli retail chains are supported via israeli-supermarket-scrapers
Focus: Beef products with Hebrew intelligence
"""

import json
import os
import sys
from pathlib import Path

def assess_israeli_scrapers():
    """Assess which chains are supported and test data quality for beef-focused integration"""
    
    try:
        from il_supermarket_scarper import ScraperFactory, ScarpingTask
    except ImportError as e:
        print(f"❌ Error importing israeli-supermarket-scrapers: {e}")
        return {}
    
    # Target chains for beef-focused integration (prioritized for Israeli market)
    target_chains = [
        'MEGA',           # High-quality products, supported by israeli-scrapers
        'YAYNO_BITAN',    # 250 stores nationwide, family-oriented (high beef consumption) 
        'VICTORY',        # 20 discount stores, supported by israeli-scrapers
        'SHUFERSAL',      # Already working in Basarometer (0.79 confidence)
        'RAMI_LEVY',      # Already working in Basarometer (0.73 confidence)
        'YOHANANOF',      # Already working in Basarometer (0.87 confidence)
        'MAHSANI_ASHUK',  # Bulk shopping, ideal for beef products (was MACHSANEI_HASHUK)
        'TIV_TAAM',       # Premium chain
        'OSHER_AD',       # Discount chain
        'HET_COHEN'       # Regional chain
    ]
    
    assessment_results = {}
    
    print("🔍 Assessing Israeli Retail Chains for Beef Intelligence Integration...")
    print("="*60)
    
    # Get all available scrapers from the factory
    available_scrapers = [attr for attr in dir(ScraperFactory) if not attr.startswith('_')]
    
    for chain in target_chains:
        print(f"📊 Assessing {chain}...")
        
        try:
            # Check if chain is available in ScraperFactory
            if hasattr(ScraperFactory, chain):
                # Test basic task creation (no actual scraping yet)
                test_task = ScarpingTask(
                    enabled_scrapers=[chain],
                    limit=1,
                    size_estimation_mode=True,  # Just estimation, no actual scraping
                    suppress_exception=True
                )
                
                assessment_results[chain] = {
                    'status': 'available',
                    'scraper_factory_support': True,
                    'priority': 'high' if chain in ['MEGA', 'YAYNO_BITAN', 'VICTORY'] else 'medium',
                    'data_quality': 'to_be_tested',
                    'notes': 'Ready for beef-focused scraping'
                }
                
                # Special notes for existing Basarometer chains
                if chain in ['SHUFERSAL', 'RAMI_LEVY', 'YOHANANOF']:
                    assessment_results[chain]['notes'] = 'Already in Basarometer - compare performance'
                    assessment_results[chain]['existing_confidence'] = {
                        'SHUFERSAL': 0.79,
                        'RAMI_LEVY': 0.73, 
                        'YOHANANOF': 0.87
                    }.get(chain, 0.0)
                
                print(f"  ✅ Available - Ready for integration")
                
            else:
                assessment_results[chain] = {
                    'status': 'not_available',
                    'scraper_factory_support': False,
                    'notes': f'Not found in ScraperFactory. Available: {len(available_scrapers)} chains'
                }
                print(f"  ❌ Not available in ScraperFactory")
                
        except Exception as e:
            assessment_results[chain] = {
                'status': 'error',
                'error': str(e),
                'scraper_factory_support': False
            }
            print(f"  ⚠️  Error: {str(e)}")
    
    # Add summary of all available scrapers
    assessment_results['_METADATA'] = {
        'total_available_scrapers': len(available_scrapers),
        'all_available_scrapers': available_scrapers,
        'target_chains_assessed': len(target_chains),
        'beef_focus_priority': True,
        'hebrew_intelligence_ready': True
    }
    
    # Save assessment
    output_file = Path('hybrid-integration/chain_assessment.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(assessment_results, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*60)
    print("📋 ASSESSMENT SUMMARY")
    print("="*60)
    
    available_count = len([k for k, v in assessment_results.items() 
                          if k != '_METADATA' and v.get('status') == 'available'])
    priority_chains = [k for k, v in assessment_results.items() 
                      if k != '_METADATA' and v.get('priority') == 'high']
    
    print(f"✅ Available chains: {available_count}/{len(target_chains)}")
    print(f"🎯 High priority chains: {len(priority_chains)} - {', '.join(priority_chains)}")
    print(f"📊 Total scrapers in factory: {len(available_scrapers)}")
    print(f"💾 Assessment saved to: {output_file}")
    print("="*60)
    
    return assessment_results

def main():
    """Main execution function"""
    try:
        results = assess_israeli_scrapers()
        
        if results:
            available_chains = [k for k, v in results.items() 
                              if k != '_METADATA' and v.get('status') == 'available']
            
            if available_chains:
                print(f"\n🚀 Ready for Phase 2: Beef Intelligence Processing")
                print(f"📈 Next step: Test scraping with {len(available_chains)} available chains")
                return True
            else:
                print(f"\n❌ No chains available for integration")
                return False
        else:
            print(f"\n❌ Assessment failed")
            return False
            
    except Exception as e:
        print(f"❌ Critical error during assessment: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)