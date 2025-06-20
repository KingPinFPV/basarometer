#!/usr/bin/env python3
"""
Basarometer 5.0 Hybrid Integration - Main Hybrid Engine  
Orchestrates israeli-supermarket-scrapers with Basarometer beef intelligence
Focus: Maximum beef product coverage with 0.85+ confidence
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
import pandas as pd
from typing import List, Dict, Optional

def main():
    """Test hybrid engine with priority chains"""
    
    try:
        from il_supermarket_scarper import ScarpingTask
        from beef_intelligence_processor import BeefIntelligenceProcessor
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        return False
    
    engine = BasarometerHybridEngine()
    
    # Test with high-priority chains
    test_chains = ['MEGA', 'VICTORY']  # Start with 2 chains for testing
    
    print("🚀 BASAROMETER 5.0 HYBRID ENGINE - TEST RUN")
    print("="*60)
    print(f"🎯 Testing chains: {', '.join(test_chains)}")
    print(f"🥩 Focus: Israeli beef products")
    print(f"📊 Target confidence: 0.85+")
    print("="*60)
    
    results = engine.run_test_beef_scan(test_chains)
    
    if results:
        print("\n🎉 Hybrid Engine Test Successful!")
        return True
    else:
        print("\n❌ Hybrid Engine Test Failed")
        return False

class BasarometerHybridEngine:
    """
    Main hybrid engine orchestrating multiple data sources for beef intelligence
    Integrates israeli-supermarket-scrapers with Basarometer confidence standards
    """
    
    def __init__(self):
        self.beef_processor = self._load_beef_processor()
        
        # Chain configuration with operational strategy
        self.chain_config = {
            'israeli_scrapers_priority': [
                'MEGA',           # High-quality products, good data structure
                'VICTORY',        # Discount chain, good volume
                'YAYNO_BITAN',    # Large chain, 250 stores
                'MAHSANI_ASHUK',  # Bulk shopping, beef focus
                'TIV_TAAM',       # Premium chain
                'OSHER_AD',       # Discount chain
                'HET_COHEN'       # Regional chain  
            ],
            'basarometer_existing': [
                'SHUFERSAL',      # 0.79 confidence, 40+ products
                'RAMI_LEVY',      # 0.73 confidence, 205 products
                'YOHANANOF'       # 0.87 confidence, excellent performance
            ],
            'browser_use_future': [
                'AM_PM',          # Convenience stores
                'SUPER_PHARM'     # Health & food
            ]
        }
        
        # Quality standards (Basarometer v5.0)
        self.quality_standards = {
            'min_confidence': 0.75,
            'target_confidence': 0.85,
            'min_products_per_chain': 20,
            'target_products_per_chain': 40,
            'max_scraping_time_minutes': 10
        }
    
    def _load_beef_processor(self):
        """Load beef intelligence processor"""
        try:
            from beef_intelligence_processor import BeefIntelligenceProcessor
            return BeefIntelligenceProcessor()
        except ImportError:
            print("❌ Could not load BeefIntelligenceProcessor")
            return None
    
    def get_beef_data_via_scrapers(self, chain_name: str, limit: int = 50) -> List[Dict]:
        """Get beef data via israeli-supermarket-scrapers with intelligent processing"""
        
        try:
            from il_supermarket_scarper import ScarpingTask
        except ImportError:
            print(f"❌ israeli-supermarket-scrapers not available")
            return []
        
        print(f"🛒 Scraping {chain_name} via israeli-scrapers...")
        
        try:
            # Create chain-specific output directory  
            output_dir = Path(f'hybrid-integration/scrapers-data/{chain_name}')
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Configure scraping task for beef focus
            task = ScarpingTask(
                enabled_scrapers=[chain_name.upper()],
                limit=limit,
                dump_folder_name=str(output_dir),
                files_types=['PRICE_FILE', 'PROMO_FILE'],  # Focus on pricing data
                suppress_exception=True,
                multiprocessing=1  # Conservative for testing
            )
            
            print(f"📥 Starting scrape task for {chain_name}...")
            start_time = datetime.now()
            
            # Execute scraping
            task.start()
            
            scrape_duration = (datetime.now() - start_time).total_seconds()
            print(f"⏱️  Scraping completed in {scrape_duration:.1f} seconds")
            
            # Process scraped files for beef products
            beef_products = []
            
            for data_file in output_dir.rglob('*'):
                if data_file.is_file() and data_file.suffix.lower() in ['.json', '.csv', '.xml']:
                    print(f"📄 Processing {data_file.name}...")
                    products = self.beef_processor.process_scraped_data(data_file)
                    beef_products.extend(products)
            
            # Filter for quality (remove duplicates and low confidence)
            beef_products = self._deduplicate_products(beef_products)
            beef_products = self.beef_processor.filter_high_quality_products(
                beef_products, min_confidence=self.quality_standards['min_confidence']
            )
            
            print(f"✅ {chain_name}: Found {len(beef_products)} quality beef products")
            
            if beef_products:
                avg_confidence = sum(p['confidence'] for p in beef_products) / len(beef_products)
                print(f"📊 Average confidence: {avg_confidence:.3f}")
            
            return beef_products
            
        except Exception as e:
            print(f"❌ Error scraping {chain_name}: {e}")
            return []
    
    def _deduplicate_products(self, products: List[Dict]) -> List[Dict]:
        """Remove duplicate products based on name similarity"""
        if not products:
            return []
        
        unique_products = []
        seen_names = set()
        
        for product in products:
            name = product.get('name', '').strip().lower()
            
            # Simple deduplication by normalized name
            normalized_name = ''.join(name.split())  # Remove spaces
            
            if normalized_name not in seen_names:
                seen_names.add(normalized_name)
                unique_products.append(product)
        
        removed_count = len(products) - len(unique_products)
        if removed_count > 0:
            print(f"🧹 Removed {removed_count} duplicate products")
        
        return unique_products
    
    def run_test_beef_scan(self, test_chains: List[str]) -> Dict:
        """Run beef scanning test with specified chains"""
        
        all_beef_data = {}
        scan_summary = {
            'start_time': datetime.now().isoformat(),
            'chains_tested': test_chains,
            'total_products': 0,
            'chain_results': {},
            'quality_analysis': {}
        }
        
        print(f"🔄 Starting beef scan for {len(test_chains)} chains...")
        
        # Process each test chain
        for chain in test_chains:
            print(f"\n{'='*40}")
            print(f"🏪 Processing {chain}")
            print(f"{'='*40}")
            
            chain_start = datetime.now()
            
            if chain.upper() in self.chain_config['israeli_scrapers_priority']:
                beef_products = self.get_beef_data_via_scrapers(chain, limit=30)  # Limit for testing
            else:
                print(f"⚠️  {chain} not in priority list, skipping...")
                beef_products = []
            
            chain_duration = (datetime.now() - chain_start).total_seconds()
            
            if beef_products:
                all_beef_data[chain] = beef_products
                
                # Generate chain analysis
                quality_report = self.beef_processor.generate_quality_report(beef_products)
                
                scan_summary['chain_results'][chain] = {
                    'product_count': len(beef_products),
                    'duration_seconds': round(chain_duration, 1),
                    'quality_metrics': quality_report,
                    'meets_standards': self._evaluate_chain_quality(beef_products)
                }
                
                scan_summary['total_products'] += len(beef_products)
                
                print(f"✅ {chain} completed: {len(beef_products)} products in {chain_duration:.1f}s")
            else:
                print(f"❌ {chain} failed: No products found")
                scan_summary['chain_results'][chain] = {
                    'product_count': 0,
                    'duration_seconds': round(chain_duration, 1),
                    'error': 'No products found'
                }
        
        # Generate overall analysis
        scan_summary['end_time'] = datetime.now().isoformat()
        scan_summary['quality_analysis'] = self._generate_overall_analysis(all_beef_data)
        
        # Save results
        self._save_scan_results(all_beef_data, scan_summary)
        
        # Print summary
        self._print_scan_summary(scan_summary)
        
        return all_beef_data
    
    def _evaluate_chain_quality(self, products: List[Dict]) -> Dict:
        """Evaluate if chain meets Basarometer quality standards"""
        if not products:
            return {'meets_standards': False, 'reasons': ['No products']}
        
        product_count = len(products)
        avg_confidence = sum(p['confidence'] for p in products) / len(products)
        high_confidence_count = len([p for p in products if p['confidence'] >= self.quality_standards['target_confidence']])
        
        meets_standards = (
            product_count >= self.quality_standards['min_products_per_chain'] and
            avg_confidence >= self.quality_standards['min_confidence']
        )
        
        return {
            'meets_standards': meets_standards,
            'product_count': product_count,
            'avg_confidence': round(avg_confidence, 3),
            'high_confidence_count': high_confidence_count,
            'quality_score': round((avg_confidence * 0.7) + (min(product_count/40, 1.0) * 0.3), 3)
        }
    
    def _generate_overall_analysis(self, all_data: Dict) -> Dict:
        """Generate comprehensive analysis across all chains"""
        if not all_data:
            return {}
        
        total_products = sum(len(products) for products in all_data.values())
        all_products = [p for products in all_data.values() for p in products]
        
        if not all_products:
            return {'error': 'No products to analyze'}
        
        confidences = [p['confidence'] for p in all_products]
        prices = [p['price'] for p in all_products if p.get('price')]
        
        analysis = {
            'total_chains': len(all_data),
            'total_products': total_products,
            'avg_products_per_chain': round(total_products / len(all_data), 1),
            'confidence_metrics': {
                'overall_average': round(sum(confidences) / len(confidences), 3),
                'min_confidence': round(min(confidences), 3),
                'max_confidence': round(max(confidences), 3),
                'high_confidence_count': len([c for c in confidences if c >= 0.85]),
                'exceeds_basarometer_standard': sum(c >= 0.85 for c in confidences) / len(confidences) >= 0.5
            },
            'price_analysis': {
                'products_with_prices': len(prices),
                'price_coverage': round(len(prices) / total_products, 3),
                'avg_price_ils': round(sum(prices) / len(prices), 2) if prices else None
            },
            'hebrew_coverage': len([p for p in all_products if p.get('processing_metadata', {}).get('hebrew_chars_count', 0) > 0]) / total_products
        }
        
        return analysis
    
    def _save_scan_results(self, beef_data: Dict, summary: Dict):
        """Save scan results to files"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save detailed beef data
        beef_file = Path(f'hybrid-integration/processed-output/beef_scan_{timestamp}.json')
        with open(beef_file, 'w', encoding='utf-8') as f:
            json.dump(beef_data, f, indent=2, ensure_ascii=False)
        
        # Save summary report
        summary_file = Path(f'hybrid-integration/processed-output/scan_summary_{timestamp}.json')
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Results saved:")
        print(f"   📊 Beef data: {beef_file}")
        print(f"   📋 Summary: {summary_file}")
    
    def _print_scan_summary(self, summary: Dict):
        """Print formatted scan summary"""
        print(f"\n{'='*60}")
        print(f"🏆 BASAROMETER 5.0 HYBRID SCAN SUMMARY")
        print(f"{'='*60}")
        
        qa = summary.get('quality_analysis', {})
        
        print(f"🏪 Chains processed: {qa.get('total_chains', 0)}")
        print(f"🥩 Total beef products: {qa.get('total_products', 0)}")
        print(f"📊 Average per chain: {qa.get('avg_products_per_chain', 0)}")
        
        cm = qa.get('confidence_metrics', {})
        print(f"🎯 Overall confidence: {cm.get('overall_average', 0)}")
        print(f"⭐ High confidence products: {cm.get('high_confidence_count', 0)}")
        print(f"✅ Exceeds Basarometer standard: {cm.get('exceeds_basarometer_standard', False)}")
        
        pa = qa.get('price_analysis', {})
        print(f"💰 Price coverage: {pa.get('price_coverage', 0)*100:.1f}%")
        print(f"💵 Average price: {pa.get('avg_price_ils', 'N/A')} ₪")
        
        print(f"🇮🇱 Hebrew coverage: {qa.get('hebrew_coverage', 0)*100:.1f}%")
        
        print(f"{'='*60}")
        
        # Chain breakdown
        for chain, result in summary.get('chain_results', {}).items():
            status = "✅" if result.get('product_count', 0) > 0 else "❌"
            print(f"{status} {chain}: {result.get('product_count', 0)} products ({result.get('duration_seconds', 0)}s)")
        
        print(f"{'='*60}")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)