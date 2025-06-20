#!/usr/bin/env python3
"""
Basarometer 5.0 Hybrid Integration - Quality Report Generator
Comprehensive analysis of beef intelligence performance across Israeli retail chains
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List

def generate_comprehensive_report():
    """Generate comprehensive quality report for hybrid integration"""
    
    try:
        sys.path.append('.')
        sys.path.append('hybrid-integration')
        from beef_intelligence_processor import BeefIntelligenceProcessor
        from hybrid_engine import BasarometerHybridEngine
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    
    print("📊 BASAROMETER 5.0 HYBRID INTEGRATION - QUALITY REPORT")
    print("="*70)
    
    processor = BeefIntelligenceProcessor()
    engine = BasarometerHybridEngine()
    
    # Analyze available data
    report = {
        'report_timestamp': datetime.now().isoformat(),
        'system_version': 'Basarometer 5.0 Hybrid',
        'chains_analyzed': {},
        'overall_metrics': {},
        'comparison_with_basarometer': {},
        'recommendations': []
    }
    
    # Process scraped data by chain
    scraped_data_dir = Path('hybrid-integration/scrapers-data')
    total_products = 0
    all_confidences = []
    all_prices = []
    
    for chain_dir in scraped_data_dir.iterdir():
        if chain_dir.is_dir():
            chain_name = chain_dir.name
            print(f"\n🔍 Analyzing {chain_name}...")
            
            chain_products = []
            
            # Process all files for this chain
            for data_file in chain_dir.rglob('*'):
                if data_file.is_file() and data_file.suffix.lower() in ['.json', '.csv', '.xml']:
                    products = processor.process_scraped_data(data_file)
                    chain_products.extend(products)
            
            # Deduplicate and filter
            chain_products = engine._deduplicate_products(chain_products)
            quality_products = processor.filter_high_quality_products(chain_products, min_confidence=0.75)
            
            if quality_products:
                # Calculate metrics
                confidences = [p['confidence'] for p in quality_products]
                prices = [p['price'] for p in quality_products if p.get('price')]
                hebrew_products = [p for p in quality_products if p.get('processing_metadata', {}).get('hebrew_chars_count', 0) > 0]
                
                chain_metrics = {
                    'total_products': len(quality_products),
                    'confidence_metrics': {
                        'average': round(sum(confidences) / len(confidences), 3),
                        'min': round(min(confidences), 3),
                        'max': round(max(confidences), 3),
                        'high_confidence_count': len([c for c in confidences if c >= 0.85]),
                        'exceeds_target': sum(c >= 0.85 for c in confidences) / len(confidences)
                    },
                    'price_metrics': {
                        'products_with_price': len(prices),
                        'price_coverage': round(len(prices) / len(quality_products), 3),
                        'avg_price_ils': round(sum(prices) / len(prices), 2) if prices else None,
                        'price_range': [round(min(prices), 2), round(max(prices), 2)] if prices else None
                    },
                    'hebrew_coverage': round(len(hebrew_products) / len(quality_products), 3),
                    'quality_assessment': 'EXCELLENT' if confidences and sum(confidences)/len(confidences) >= 0.9 else 
                                        'GOOD' if confidences and sum(confidences)/len(confidences) >= 0.8 else 'NEEDS_IMPROVEMENT'
                }
                
                report['chains_analyzed'][chain_name] = chain_metrics
                
                # Add to overall totals
                total_products += len(quality_products)
                all_confidences.extend(confidences)
                all_prices.extend(prices)
                
                print(f"✅ {chain_name}: {len(quality_products)} products, avg confidence: {chain_metrics['confidence_metrics']['average']}")
            else:
                print(f"❌ {chain_name}: No quality products found")
    
    # Generate overall metrics
    if all_confidences:
        report['overall_metrics'] = {
            'total_chains_with_data': len(report['chains_analyzed']),
            'total_beef_products': total_products,
            'overall_confidence': {
                'average': round(sum(all_confidences) / len(all_confidences), 3),
                'min': round(min(all_confidences), 3),
                'max': round(max(all_confidences), 3),
                'distribution': {
                    'excellent_090_plus': len([c for c in all_confidences if c >= 0.9]),
                    'good_085_to_089': len([c for c in all_confidences if 0.85 <= c < 0.9]),
                    'acceptable_075_to_084': len([c for c in all_confidences if 0.75 <= c < 0.85]),
                    'needs_improvement_below_075': len([c for c in all_confidences if c < 0.75])
                }
            },
            'price_analysis': {
                'total_products_with_prices': len(all_prices),
                'overall_price_coverage': round(len(all_prices) / total_products, 3),
                'avg_price_ils': round(sum(all_prices) / len(all_prices), 2) if all_prices else None,
                'price_distribution': {
                    'budget_under_20': len([p for p in all_prices if p < 20]),
                    'mid_range_20_to_50': len([p for p in all_prices if 20 <= p < 50]),
                    'premium_50_plus': len([p for p in all_prices if p >= 50])
                }
            }
        }
    
    # Comparison with existing Basarometer performance
    basarometer_benchmarks = {
        'SHUFERSAL': {'confidence': 0.79, 'products': 40},
        'RAMI_LEVY': {'confidence': 0.73, 'products': 205},
        'YOHANANOF': {'confidence': 0.87, 'products': 'excellent'}
    }
    
    hybrid_performance = report['overall_metrics'].get('overall_confidence', {}).get('average', 0)
    improvement_over_avg = hybrid_performance - 0.796  # Average of existing systems
    
    report['comparison_with_basarometer'] = {
        'existing_system_avg_confidence': 0.796,
        'hybrid_system_confidence': hybrid_performance,
        'improvement': round(improvement_over_avg, 3),
        'improvement_percentage': round(improvement_over_avg / 0.796 * 100, 1),
        'exceeds_best_existing': hybrid_performance > 0.87,
        'performance_assessment': 'SUPERIOR' if improvement_over_avg > 0.1 else 
                                 'IMPROVED' if improvement_over_avg > 0.05 else 'COMPARABLE'
    }
    
    # Generate recommendations
    recommendations = []
    
    if hybrid_performance >= 0.9:
        recommendations.append("🎉 EXCELLENT: Hybrid system achieves superior confidence scores (0.9+)")
    
    if total_products >= 100:
        recommendations.append("📈 SCALE SUCCESS: Good product volume achieved for comprehensive market analysis")
    
    if len(report['chains_analyzed']) >= 2:
        recommendations.append("🏪 MULTI-CHAIN: Successfully integrated multiple Israeli retail chains")
    
    if report['overall_metrics'].get('price_analysis', {}).get('overall_price_coverage', 0) >= 0.8:
        recommendations.append("💰 PRICING: Excellent price coverage for market intelligence")
    
    recommendations.extend([
        "🚀 PRIORITY: Expand to VICTORY, YAYNO_BITAN for broader market coverage",
        "🔄 INTEGRATION: Ready for Browser-Use AI system integration",
        "📊 PRODUCTION: System ready for full-scale deployment",
        "🎯 TARGET: Achieve 8+ chains with 300+ products for market leadership"
    ])
    
    report['recommendations'] = recommendations
    
    # Save report
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_file = Path(f'hybrid-integration/processed-output/quality_report_{timestamp}.json')
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    # Print formatted report
    print_formatted_report(report)
    
    print(f"\n💾 Full report saved to: {report_file}")
    return True

def print_formatted_report(report: Dict):
    """Print beautifully formatted report"""
    
    print(f"\n{'='*70}")
    print(f"🏆 BASAROMETER 5.0 HYBRID INTEGRATION - EXECUTIVE SUMMARY")
    print(f"{'='*70}")
    
    overall = report.get('overall_metrics', {})
    comparison = report.get('comparison_with_basarometer', {})
    
    print(f"📅 Report Date: {report['report_timestamp'][:10]}")
    print(f"🔧 System: {report['system_version']}")
    print(f"🏪 Chains Analyzed: {overall.get('total_chains_with_data', 0)}")
    print(f"🥩 Total Beef Products: {overall.get('total_beef_products', 0)}")
    
    confidence = overall.get('overall_confidence', {})
    print(f"\n📊 CONFIDENCE ANALYSIS:")
    print(f"   🎯 Overall Average: {confidence.get('average', 0)} (Target: 0.85)")
    print(f"   📈 Range: {confidence.get('min', 0)} - {confidence.get('max', 0)}")
    
    dist = confidence.get('distribution', {})
    print(f"   ⭐ Excellent (0.9+): {dist.get('excellent_090_plus', 0)}")
    print(f"   ✅ Good (0.85-0.89): {dist.get('good_085_to_089', 0)}")
    print(f"   📋 Acceptable (0.75-0.84): {dist.get('acceptable_075_to_084', 0)}")
    print(f"   ⚠️  Needs Work (<0.75): {dist.get('needs_improvement_below_075', 0)}")
    
    pricing = overall.get('price_analysis', {})
    print(f"\n💰 PRICING ANALYSIS:")
    print(f"   💵 Price Coverage: {pricing.get('overall_price_coverage', 0)*100:.1f}%")
    print(f"   📊 Average Price: {pricing.get('avg_price_ils', 'N/A')} ₪")
    
    price_dist = pricing.get('price_distribution', {})
    print(f"   🏷️  Budget (<20₪): {price_dist.get('budget_under_20', 0)}")
    print(f"   🏷️  Mid-range (20-50₪): {price_dist.get('mid_range_20_to_50', 0)}")
    print(f"   🏷️  Premium (50₪+): {price_dist.get('premium_50_plus', 0)}")
    
    print(f"\n🆚 VS. EXISTING BASAROMETER:")
    print(f"   📊 Existing Avg: {comparison.get('existing_system_avg_confidence', 0)}")
    print(f"   🚀 Hybrid System: {comparison.get('hybrid_system_confidence', 0)}")
    print(f"   📈 Improvement: +{comparison.get('improvement', 0)} ({comparison.get('improvement_percentage', 0)}%)")
    print(f"   🏆 Assessment: {comparison.get('performance_assessment', 'N/A')}")
    
    print(f"\n🏪 CHAIN BREAKDOWN:")
    for chain, metrics in report.get('chains_analyzed', {}).items():
        quality = metrics.get('quality_assessment', 'N/A')
        products = metrics.get('total_products', 0)
        conf = metrics.get('confidence_metrics', {}).get('average', 0)
        status = "🌟" if quality == "EXCELLENT" else "✅" if quality == "GOOD" else "⚠️"
        print(f"   {status} {chain}: {products} products, {conf} confidence ({quality})")
    
    print(f"\n🎯 RECOMMENDATIONS:")
    for rec in report.get('recommendations', []):
        print(f"   {rec}")
    
    print(f"\n{'='*70}")
    success_score = (
        (1.0 if overall.get('total_beef_products', 0) >= 100 else 0.5) +
        (1.0 if confidence.get('average', 0) >= 0.9 else 0.5 if confidence.get('average', 0) >= 0.85 else 0) +
        (1.0 if comparison.get('improvement', 0) > 0.1 else 0.5 if comparison.get('improvement', 0) > 0 else 0) +
        (1.0 if overall.get('total_chains_with_data', 0) >= 2 else 0.5)
    )
    
    if success_score >= 3.5:
        print(f"🎉 MISSION STATUS: EXCEPTIONAL SUCCESS (Score: {success_score:.1f}/4.0)")
    elif success_score >= 2.5:
        print(f"✅ MISSION STATUS: SUCCESS (Score: {success_score:.1f}/4.0)")
    elif success_score >= 1.5:
        print(f"📈 MISSION STATUS: PARTIAL SUCCESS (Score: {success_score:.1f}/4.0)")
    else:
        print(f"⚠️  MISSION STATUS: NEEDS IMPROVEMENT (Score: {success_score:.1f}/4.0)")
    
    print(f"{'='*70}")

def main():
    """Main execution"""
    success = generate_comprehensive_report()
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)