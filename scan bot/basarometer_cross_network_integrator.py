#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Basarometer Cross-Network Price Comparison Integrator V6.0
Integrates government data with existing 89-product database to create unified price comparisons

Mission: Create cross-network product database with price comparisons across retailers
Target: 100-150 unified products with multi-network pricing
"""

import json
import re
import os
import glob
from datetime import datetime
from difflib import SequenceMatcher
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BasarometerCrossNetworkIntegrator:
    def __init__(self):
        """Initialize the cross-network integrator"""
        self.statistics = {
            'existing_products_loaded': 0,
            'government_products_loaded': 0,
            'unified_products_created': 0,
            'cross_network_products': 0,
            'savings_opportunities_identified': 0
        }
        self.network_mapping = {
            'רמי לוי': 'rami_levy',
            'שופרסל': 'shufersal', 
            'ויקטורי': 'victory',
            'יוחננוף': 'yohananof',
            'קרפור': 'carrefour',
            'חצי חינם': 'hazi_hinam',
            'מגא': 'mega',
            'יינות ביתן': 'yeinot_bitan',
            'נתונים ממשלתיים': 'government',
            'ממשלה': 'government',
            'victory': 'victory'
        }
        
    def load_existing_products(self):
        """Load existing 89-product database from various sources"""
        existing_products = []
        
        # Look for existing product files
        product_files = []
        search_patterns = [
            'output/basarometer-*.json',
            'output/*products*.json',
            'unified_89_products_*.json',
            'website_89_products_*.json',
            'top_50_website_ready_*.json'
        ]
        
        for pattern in search_patterns:
            product_files.extend(glob.glob(pattern))
        
        logger.info(f"Found {len(product_files)} potential product files")
        
        for file_path in product_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if isinstance(data, list):
                    existing_products.extend(data)
                elif isinstance(data, dict) and 'products' in data:
                    existing_products.extend(data['products'])
                
                logger.info(f"Loaded {len(data) if isinstance(data, list) else len(data.get('products', []))} products from {file_path}")
                
            except Exception as e:
                logger.error(f"Error loading {file_path}: {e}")
        
        # Deduplicate existing products
        unique_existing = self._deduplicate_products(existing_products)
        
        self.statistics['existing_products_loaded'] = len(unique_existing)
        logger.info(f"Loaded {len(unique_existing)} unique existing products")
        
        return unique_existing
    
    def load_government_products(self):
        """Load government products from enhanced extraction"""
        government_products = []
        
        # Look for government extraction results
        gov_files = glob.glob('output/enhanced_government_meat_products_*.json')
        gov_files.extend(glob.glob('output/*government*.json'))
        
        if not gov_files:
            logger.warning("No government product files found")
            return []
        
        # Use the most recent file
        latest_file = max(gov_files, key=os.path.getctime)
        
        try:
            with open(latest_file, 'r', encoding='utf-8') as f:
                government_products = json.load(f)
            
            logger.info(f"Loaded {len(government_products)} government products from {latest_file}")
            
        except Exception as e:
            logger.error(f"Error loading government products: {e}")
            return []
        
        self.statistics['government_products_loaded'] = len(government_products)
        return government_products
    
    def _deduplicate_products(self, products):
        """Remove duplicate products based on name similarity"""
        unique_products = []
        
        for product in products:
            is_duplicate = False
            product_name = self._normalize_product_name(product.get('name', ''))
            
            for existing in unique_products:
                existing_name = self._normalize_product_name(existing.get('name', ''))
                similarity = SequenceMatcher(None, product_name, existing_name).ratio()
                
                if similarity > 0.85:  # 85% similarity threshold
                    is_duplicate = True
                    # Keep the one with better data
                    if self._get_product_quality_score(product) > self._get_product_quality_score(existing):
                        unique_products.remove(existing)
                        unique_products.append(product)
                    break
            
            if not is_duplicate:
                unique_products.append(product)
        
        return unique_products
    
    def _normalize_product_name(self, name):
        """Normalize product names for comparison"""
        if not name:
            return ""
        
        # Remove common variations and packaging info
        name = name.lower()
        patterns_to_remove = [
            r'\d+\s*ק[״"]?ג',  # Weight in kg
            r'\d+\s*גר[״"]?ם?',   # Weight in grams
            r'\d+\s*מ[״"]?ל',   # Volume in ml
            r'[\(\[].*?[\)\]]', # Content in parentheses/brackets
            r'\s*-\s*\d+.*',    # Dash followed by numbers
            r'מחיר.*',          # Price information
            r'₪.*',             # Shekel symbol
            r'טרי|מקורי|אמיתי|מובחר|פרימיום',  # Quality indicators
            r'\s+',             # Multiple spaces
        ]
        
        for pattern in patterns_to_remove:
            name = re.sub(pattern, ' ', name)
        
        return name.strip()
    
    def _get_product_quality_score(self, product):
        """Get quality score for product comparison"""
        if 'meat_classification' in product:
            return product['meat_classification'].get('quality_score', 0)
        elif 'confidence' in product:
            return product['confidence'] * 100
        elif 'price' in product and 'name' in product:
            return 50  # Basic score for products with price and name
        else:
            return 0
    
    def extract_network_from_source(self, source):
        """Extract network name from source information"""
        if not source:
            return 'unknown'
        
        source_lower = source.lower()
        
        for network_name, network_id in self.network_mapping.items():
            if network_name.lower() in source_lower or network_id in source_lower:
                return network_id
        
        # Pattern matching for file names
        if 'price7290696200003' in source_lower:
            return 'victory'
        elif 'rami' in source_lower or '7290058140886' in source_lower:
            return 'rami_levy'
        elif 'gov' in source_lower or 'xml' in source_lower:
            return 'government'
        
        return 'unknown'
    
    def create_unified_products(self, existing_products, government_products):
        """Create unified products with cross-network price comparisons"""
        
        # Combine all products with network identification
        all_products = []
        
        # Process existing products
        for product in existing_products:
            product['network'] = self.extract_network_from_source(product.get('source', ''))
            product['normalized_name'] = self._normalize_product_name(product.get('name', ''))
            all_products.append(product)
        
        # Process government products
        for product in government_products:
            product['network'] = self.extract_network_from_source(product.get('source', ''))
            product['normalized_name'] = self._normalize_product_name(product.get('name', ''))
            all_products.append(product)
        
        logger.info(f"Total products to unify: {len(all_products)}")
        
        # Group similar products across networks
        unified_groups = self._group_similar_products(all_products)
        
        # Create unified product entries
        unified_products = []
        
        for group in unified_groups:
            if len(group) >= 1:  # At least one product
                unified_product = self._create_unified_product_entry(group)
                if unified_product:
                    unified_products.append(unified_product)
        
        # Filter for cross-network products (products available in 2+ networks)
        cross_network_products = [p for p in unified_products if p['network_count'] >= 2]
        
        self.statistics['unified_products_created'] = len(unified_products)
        self.statistics['cross_network_products'] = len(cross_network_products)
        
        logger.info(f"Created {len(unified_products)} unified products ({len(cross_network_products)} cross-network)")
        
        return unified_products, cross_network_products
    
    def _group_similar_products(self, all_products):
        """Group similar products from different networks"""
        
        # Group products by normalized names
        product_groups = {}
        
        for product in all_products:
            normalized_name = product['normalized_name']
            
            # Find matching group or create new one
            matched_group_key = None
            
            for existing_key in product_groups.keys():
                similarity = SequenceMatcher(None, normalized_name, existing_key).ratio()
                if similarity > 0.75:  # 75% similarity for cross-network matching
                    matched_group_key = existing_key
                    break
            
            if matched_group_key:
                product_groups[matched_group_key].append(product)
            else:
                product_groups[normalized_name] = [product]
        
        # Return groups with products
        return list(product_groups.values())
    
    def _create_unified_product_entry(self, product_group):
        """Create a unified product entry with price comparisons"""
        
        if not product_group:
            return None
        
        # Use the product with highest quality score as the base
        base_product = max(product_group, 
                          key=lambda p: self._get_product_quality_score(p))
        
        # Create price comparison structure
        price_comparison = {}
        networks_available = set()
        
        for product in product_group:
            network = product.get('network', 'unknown')
            price = product.get('price')
            
            if network and network != 'unknown' and price:
                try:
                    price_float = float(price)
                    
                    # If network already exists, keep the better price
                    if network in price_comparison:
                        if price_float < price_comparison[network]['price']:
                            price_comparison[network] = {
                                'price': price_float,
                                'source': product.get('source', ''),
                                'unit': product.get('unit', ''),
                                'quality_score': self._get_product_quality_score(product),
                                'product_id': product.get('item_code', product.get('id', ''))
                            }
                    else:
                        price_comparison[network] = {
                            'price': price_float,
                            'source': product.get('source', ''),
                            'unit': product.get('unit', ''),
                            'quality_score': self._get_product_quality_score(product),
                            'product_id': product.get('item_code', product.get('id', ''))
                        }
                    
                    networks_available.add(network)
                    
                except (ValueError, TypeError):
                    continue
        
        if not price_comparison:
            return None
        
        # Calculate price statistics
        prices = [data['price'] for data in price_comparison.values()]
        
        if not prices:
            return None
        
        price_stats = {
            'min_price': min(prices),
            'max_price': max(prices),
            'avg_price': sum(prices) / len(prices),
            'price_range': max(prices) - min(prices),
            'cheapest_network': min(price_comparison.items(), key=lambda x: x[1]['price'])[0],
            'most_expensive_network': max(price_comparison.items(), key=lambda x: x[1]['price'])[0]
        }
        
        # Calculate savings potential
        savings_potential = price_stats['price_range']
        savings_percentage = (savings_potential / price_stats['max_price']) * 100 if price_stats['max_price'] > 0 else 0
        
        # Create unified product
        unified_product = {
            'id': f"unified_{hash(base_product['name']) % 100000}",
            'name': base_product['name'],
            'normalized_name': base_product['normalized_name'],
            'category': self._extract_category(base_product),
            'subcategory': self._extract_subcategory(base_product),
            'networks_available': list(networks_available),
            'network_count': len(networks_available),
            'price_comparison': price_comparison,
            'price_statistics': price_stats,
            'savings_potential': {
                'amount_nis': round(savings_potential, 2),
                'percentage': round(savings_percentage, 1)
            },
            'base_product_info': {
                'manufacturer': base_product.get('manufacturer', ''),
                'unit': base_product.get('unit', ''),
                'quality_score': self._get_product_quality_score(base_product)
            },
            'created_at': datetime.now().isoformat(),
            'is_cross_network': len(networks_available) >= 2
        }
        
        # Mark significant savings opportunities
        if savings_percentage >= 15:  # 15% or more savings
            self.statistics['savings_opportunities_identified'] += 1
            unified_product['significant_savings'] = True
        
        return unified_product
    
    def _extract_category(self, product):
        """Extract main category from product"""
        if 'meat_classification' in product:
            return product['meat_classification'].get('category', 'unknown')
        elif 'category' in product:
            return product['category']
        else:
            # Basic category detection from name
            name = product.get('name', '').lower()
            if any(term in name for term in ['עוף', 'פרגית', 'חזה']):
                return 'chicken'
            elif any(term in name for term in ['בקר', 'עגל', 'אנטריקוט']):
                return 'beef'
            elif any(term in name for term in ['כבש', 'טלה']):
                return 'lamb'
            elif any(term in name for term in ['הודו']):
                return 'turkey'
            return 'unknown'
    
    def _extract_subcategory(self, product):
        """Extract subcategory from product"""
        if 'meat_classification' in product:
            return product['meat_classification'].get('subcategory', '')
        elif 'subcategory' in product:
            return product['subcategory']
        return ''
    
    def save_unified_results(self, unified_products, cross_network_products):
        """Save unified results and generate reports"""
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save all unified products
        unified_file = f"output/basarometer_unified_products_{timestamp}.json"
        with open(unified_file, 'w', encoding='utf-8') as f:
            json.dump(unified_products, f, ensure_ascii=False, indent=2)
        
        # Save cross-network products specifically
        cross_network_file = f"output/basarometer_cross_network_comparisons_{timestamp}.json"
        with open(cross_network_file, 'w', encoding='utf-8') as f:
            json.dump(cross_network_products, f, ensure_ascii=False, indent=2)
        
        # Generate comprehensive report
        report = self._generate_integration_report(unified_products, cross_network_products)
        
        report_file = f"output/basarometer_integration_report_{timestamp}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Unified products saved to: {unified_file}")
        logger.info(f"Cross-network comparisons saved to: {cross_network_file}")
        logger.info(f"Integration report saved to: {report_file}")
        
        return unified_file, cross_network_file, report_file
    
    def _generate_integration_report(self, unified_products, cross_network_products):
        """Generate comprehensive integration report"""
        
        # Network coverage analysis
        all_networks = set()
        network_product_count = {}
        
        for product in unified_products:
            networks = product['networks_available']
            all_networks.update(networks)
            
            for network in networks:
                network_product_count[network] = network_product_count.get(network, 0) + 1
        
        # Category analysis
        category_stats = {}
        savings_analysis = {'total_savings': 0, 'products_with_savings': 0}
        
        for product in unified_products:
            category = product.get('category', 'unknown')
            
            if category not in category_stats:
                category_stats[category] = {
                    'count': 0,
                    'avg_savings': 0,
                    'cross_network_count': 0
                }
            
            category_stats[category]['count'] += 1
            
            if product['is_cross_network']:
                category_stats[category]['cross_network_count'] += 1
            
            # Savings analysis
            if 'savings_potential' in product:
                savings = product['savings_potential']['amount_nis']
                category_stats[category]['avg_savings'] += savings
                savings_analysis['total_savings'] += savings
                if savings > 0:
                    savings_analysis['products_with_savings'] += 1
        
        # Calculate averages
        for category in category_stats:
            if category_stats[category]['count'] > 0:
                category_stats[category]['avg_savings'] /= category_stats[category]['count']
        
        # Top savings opportunities
        top_savings = sorted(
            [p for p in cross_network_products if p.get('savings_potential', {}).get('amount_nis', 0) > 0],
            key=lambda x: x['savings_potential']['amount_nis'],
            reverse=True
        )[:10]
        
        report = {
            'integration_summary': {
                'existing_products_loaded': self.statistics['existing_products_loaded'],
                'government_products_loaded': self.statistics['government_products_loaded'],
                'unified_products_created': self.statistics['unified_products_created'],
                'cross_network_products': self.statistics['cross_network_products'],
                'savings_opportunities_identified': self.statistics['savings_opportunities_identified'],
                'total_networks_covered': len(all_networks)
            },
            'network_coverage': {
                'networks_available': list(all_networks),
                'products_per_network': network_product_count
            },
            'category_analysis': category_stats,
            'savings_analysis': {
                'total_potential_savings': round(savings_analysis['total_savings'], 2),
                'products_with_savings': savings_analysis['products_with_savings'],
                'avg_savings_per_product': round(
                    savings_analysis['total_savings'] / max(len(unified_products), 1), 2
                )
            },
            'top_savings_opportunities': [
                {
                    'name': p['name'],
                    'savings_amount': p['savings_potential']['amount_nis'],
                    'savings_percentage': p['savings_potential']['percentage'],
                    'cheapest_network': p['price_statistics']['cheapest_network'],
                    'most_expensive_network': p['price_statistics']['most_expensive_network'],
                    'networks_count': p['network_count']
                }
                for p in top_savings[:10]
            ]
        }
        
        return report
    
    def print_integration_summary(self, report):
        """Print comprehensive integration summary"""
        
        print("\n" + "="*70)
        print("🎯 BASAROMETER CROSS-NETWORK INTEGRATION SUMMARY")
        print("="*70)
        
        summary = report['integration_summary']
        print(f"\n📊 INTEGRATION STATISTICS:")
        print(f"  • Existing Products Loaded: {summary['existing_products_loaded']}")
        print(f"  • Government Products Loaded: {summary['government_products_loaded']}")
        print(f"  • Unified Products Created: {summary['unified_products_created']}")
        print(f"  • Cross-Network Products: {summary['cross_network_products']}")
        print(f"  • Networks Covered: {summary['total_networks_covered']}")
        print(f"  • Significant Savings Opportunities: {summary['savings_opportunities_identified']}")
        
        network_coverage = report['network_coverage']
        print(f"\n🏪 NETWORK COVERAGE:")
        for network, count in sorted(network_coverage['products_per_network'].items(), 
                                   key=lambda x: x[1], reverse=True):
            print(f"  • {network}: {count} products")
        
        category_analysis = report['category_analysis']
        print(f"\n🥩 CATEGORY ANALYSIS:")
        for category, stats in sorted(category_analysis.items(), 
                                    key=lambda x: x[1]['count'], reverse=True):
            print(f"  • {category}: {stats['count']} products "
                  f"({stats['cross_network_count']} cross-network, "
                  f"avg savings: ₪{stats['avg_savings']:.2f})")
        
        savings = report['savings_analysis']
        print(f"\n💰 SAVINGS ANALYSIS:")
        print(f"  • Total Potential Savings: ₪{savings['total_potential_savings']:.2f}")
        print(f"  • Products with Savings: {savings['products_with_savings']}")
        print(f"  • Average Savings per Product: ₪{savings['avg_savings_per_product']:.2f}")
        
        if report['top_savings_opportunities']:
            print(f"\n🔥 TOP SAVINGS OPPORTUNITIES:")
            for i, opp in enumerate(report['top_savings_opportunities'][:5], 1):
                print(f"  {i}. {opp['name'][:50]}")
                print(f"     💰 Save ₪{opp['savings_amount']:.2f} ({opp['savings_percentage']:.1f}%)")
                print(f"     🏪 {opp['cheapest_network']} vs {opp['most_expensive_network']}")

def main():
    """Main execution function"""
    print("🚀 Basarometer Cross-Network Integration V6.0 - Starting...")
    
    integrator = BasarometerCrossNetworkIntegrator()
    
    # Load existing products
    print("📁 Loading existing product database...")
    existing_products = integrator.load_existing_products()
    
    # Load government products
    print("🏛️ Loading government extraction results...")
    government_products = integrator.load_government_products()
    
    if not existing_products and not government_products:
        print("❌ No products found to integrate")
        return
    
    print(f"✅ Ready to integrate {len(existing_products)} existing + {len(government_products)} government products")
    
    # Create unified products
    print("🔄 Creating unified cross-network database...")
    unified_products, cross_network_products = integrator.create_unified_products(
        existing_products, government_products
    )
    
    # Save results
    print("💾 Saving unified results...")
    unified_file, cross_network_file, report_file = integrator.save_unified_results(
        unified_products, cross_network_products
    )
    
    # Generate and display report
    print("📊 Generating integration report...")
    with open(report_file, 'r', encoding='utf-8') as f:
        report = json.load(f)
    
    integrator.print_integration_summary(report)
    
    print(f"\n💾 RESULTS SAVED:")
    print(f"  📁 Unified Products: {unified_file}")
    print(f"  🔗 Cross-Network Comparisons: {cross_network_file}")
    print(f"  📊 Integration Report: {report_file}")
    
    print(f"\n🎉 Cross-network integration complete!")
    print(f"🎯 Ready for Phase 5: Cross-Network Price Comparison System")

if __name__ == "__main__":
    main()