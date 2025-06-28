#!/usr/bin/env python3
"""
🎯 Mission: Create Multi-Network Unified Data for Website Display

This script addresses the root cause: Website expects unified multi-network data 
but receives single-vendor (רמי לוי) products. Creates proper unified cross-network 
comparison data with network_prices structure as expected by website components.
"""

import json
import os
import re
from datetime import datetime
from collections import defaultdict

def collect_multi_network_data():
    """
    Collect data from all available networks using existing extraction system
    """
    
    # Navigate to extraction system
    os.chdir('/Users/yogi/Desktop/basarometer/v5/scan bot/')
    
    print("🔄 ACTIVATING MULTI-NETWORK DATA COLLECTION")
    
    # Check for existing unified data from our previous work
    unified_files = [
        'output/basarometer_unified_products_20250627_213853.json',
        'output/enhanced_government_meat_products_20250627_213657.json',
        'enhanced_government_products_20250627_201836.json',
        'final_government_meat_products_20250627_194720.json',
        'unified_government_meat_products_20250627_194418.json'
    ]
    
    all_network_products = []
    
    for file_path in unified_files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Extract products based on file structure
                products = []
                if isinstance(data, list):
                    products = data
                elif isinstance(data, dict):
                    if 'products' in data:
                        products = data['products']
                    elif 'unified_products' in data:
                        products = data['unified_products']
                
                print(f"📊 Loaded {len(products)} products from {file_path}")
                all_network_products.extend(products)
                
            except Exception as e:
                print(f"❌ Error loading {file_path}: {e}")
    
    print(f"✅ Total collected: {len(all_network_products)} products from all sources")
    
    # Identify available networks
    networks_found = set()
    for product in all_network_products:
        # Check various network identifier fields
        network = (product.get('network') or 
                  product.get('source', '').lower() or
                  product.get('networks_available', [''])[0] if product.get('networks_available') else '' or
                  extract_network_from_product(product))
        if network:
            networks_found.add(network)
    
    print(f"🏪 Networks identified: {sorted(networks_found)}")
    
    return all_network_products, networks_found

def extract_network_from_product(product):
    """
    Extract network name from product data
    """
    # Look in various fields for network indicators
    source = product.get('source', '').lower()
    name = product.get('name', '').lower()
    manufacturer = product.get('manufacturer', '').lower()
    
    network_patterns = {
        'rami': 'רמי לוי',
        'shufersal': 'שופרסל',
        'victory': 'ויקטורי', 
        'mega': 'מגא',
        'yochananof': 'יוחננוף',
        'osher': 'אושר עד',
        'government': 'נתונים ממשלתיים',
        'gov_': 'נתונים ממשלתיים',
        'carrefour': 'קרפור',
        'tiv': 'טיב טעם',
        'yeinot': 'יינות ביתן',
        'hazi': 'חצי חינם'
    }
    
    for pattern, network_name in network_patterns.items():
        if pattern in source or pattern in name or pattern in manufacturer:
            return network_name
    
    return 'לא זוהה'

def normalize_hebrew_product_name(name):
    """
    Normalize Hebrew product names for accurate cross-network matching
    """
    if not name:
        return ""
    
    # Convert to lowercase
    normalized = name.lower().strip()
    
    # Remove common packaging and weight indicators
    weight_patterns = [
        r'\d+\s*ק[״"]?ג',      # קילוגרם
        r'\d+\s*גר[״"]?ם?',     # גרם
        r'\d+\s*מ[״"]?ל',      # מיליליטר
        r'\d+\s*ליטר',         # ליטר
        r'\d+\s*יח[״"]?',      # יחידות
    ]
    
    for pattern in weight_patterns:
        normalized = re.sub(pattern, '', normalized)
    
    # Remove packaging info
    packaging_patterns = [
        r'[\(\[].*?[\)\]]',     # Content in parentheses/brackets
        r'\s*-\s*.*',          # Everything after dash
        r'מחיר.*',              # Price information
        r'₪.*',                 # Shekel symbol and following
        r'במארז.*',             # Package information
        r'אריזת.*',             # Package information
        r'טרי.*שופרסל',         # Remove network names
        r'טרי.*רמי',
        r'מהדרין.*'
    ]
    
    for pattern in packaging_patterns:
        normalized = re.sub(pattern, '', normalized)
    
    # Normalize common Hebrew meat terms
    meat_normalizations = {
        'פרגית': 'עוף',
        'תרנגולת': 'עוף',
        'צ\'יקן': 'עוף',
        'chicken': 'עוף',
        'עגל': 'בקר',
        'פרה': 'בקר',
        'beef': 'בקר',
        'כבשה': 'כבש',
        'טלה': 'כבש',
        'lamb': 'כבש',
        'הודי': 'הודו',
        'turkey': 'הודו',
        'נקניקיה': 'נקניק',
        'sausage': 'נקניק'
    }
    
    for original, normalized_term in meat_normalizations.items():
        normalized = normalized.replace(original, normalized_term)
    
    # Clean up multiple spaces
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    
    return normalized

def group_products_by_normalized_name(products):
    """
    Group products by normalized Hebrew names for cross-network comparison
    """
    product_groups = {}
    
    for product in products:
        original_name = product.get('name', '')
        normalized_name = normalize_hebrew_product_name(original_name)
        
        if not normalized_name:
            continue
        
        if normalized_name not in product_groups:
            product_groups[normalized_name] = {
                'normalized_name': normalized_name,
                'original_names': set(),
                'products': []
            }
        
        product_groups[normalized_name]['original_names'].add(original_name)
        product_groups[normalized_name]['products'].append(product)
    
    # Convert sets to lists for JSON serialization
    for group in product_groups.values():
        group['original_names'] = list(group['original_names'])
    
    print(f"📋 Grouped into {len(product_groups)} unique product categories")
    
    # Show grouping results
    multi_network_groups = {name: group for name, group in product_groups.items() 
                           if len(group['products']) > 1}
    
    print(f"🔄 Multi-network products: {len(multi_network_groups)}")
    
    return product_groups

def create_website_compatible_data(grouped_products):
    """
    Create unified data in the exact format expected by the website
    """
    
    unified_comparison_products = []
    
    for normalized_name, group in grouped_products.items():
        products = group['products']
        
        if len(products) < 1:
            continue
        
        # Create network_prices object as expected by website
        network_prices = {}
        networks_available = []
        
        # Process each product in the group
        for product in products:
            network = (product.get('network') or 
                      product.get('networks_available', [''])[0] if product.get('networks_available') else '' or
                      extract_network_from_product(product) or
                      'לא זוהה')
            
            price = product.get('price') or product.get('price_comparison', {}).get('government', {}).get('price')
            if price and network and network != 'לא זוהה':
                try:
                    # Ensure price is a number
                    price_float = float(str(price).replace('₪', '').replace(',', ''))
                    network_prices[network] = price_float
                    networks_available.append(network)
                except (ValueError, TypeError):
                    continue
        
        # Only create unified product if we have good data
        if len(network_prices) >= 1:  # Accept even single network for now
            
            # Calculate price statistics
            prices = list(network_prices.values())
            
            # Use the best original name (longest, most descriptive)
            best_name = max(group['original_names'], key=len) if group['original_names'] else normalized_name
            
            # Create the unified product in website-expected format
            unified_product = {
                'id': f"unified_{hash(normalized_name) % 100000}",
                'name': best_name,
                'normalized_name': normalized_name,
                'category': determine_meat_category(normalized_name),
                'network_prices': network_prices,  # This is what the website expects!
                'networks_available': list(set(networks_available)),
                'network_count': len(network_prices),
                'price_statistics': {
                    'min_price': min(prices),
                    'max_price': max(prices),
                    'avg_price': round(sum(prices) / len(prices), 2),
                    'price_range': round(max(prices) - min(prices), 2) if len(prices) > 1 else 0
                },
                'savings_analysis': calculate_savings_analysis(network_prices) if len(prices) > 1 else None,
                'metadata': {
                    'original_names': group['original_names'],
                    'created_at': datetime.now().isoformat(),
                    'data_quality': 'high' if len(network_prices) > 1 else 'medium'
                }
            }
            
            unified_comparison_products.append(unified_product)
    
    print(f"✅ Created {len(unified_comparison_products)} website-compatible products")
    
    return unified_comparison_products

def determine_meat_category(normalized_name):
    """
    Determine meat category from normalized name
    """
    categories = {
        'עוף': ['עוף', 'חזה', 'שוק', 'כנף', 'ירך'],
        'בקר': ['בקר', 'אנטריקוט', 'פילה', 'סינטה', 'אסאדו', 'כתף'],
        'כבש': ['כבש', 'טלה', 'כתף'],
        'הודו': ['הודו', 'turkey'],
        'מעובד': ['נקניק', 'קבב', 'המבורגר', 'קציצה'],
        'פנימיות': ['כבד', 'לב', 'קורקבן']
    }
    
    name_lower = normalized_name.lower()
    
    for category, keywords in categories.items():
        if any(keyword in name_lower for keyword in keywords):
            return category
    
    return 'אחר'

def calculate_savings_analysis(network_prices):
    """
    Calculate savings opportunities between networks
    """
    if len(network_prices) < 2:
        return None
    
    prices = list(network_prices.values())
    networks = list(network_prices.keys())
    
    min_price = min(prices)
    max_price = max(prices)
    
    cheapest_network = networks[prices.index(min_price)]
    most_expensive_network = networks[prices.index(max_price)]
    
    return {
        'max_savings_amount': round(max_price - min_price, 2),
        'max_savings_percentage': round(((max_price - min_price) / max_price) * 100, 1),
        'cheapest_network': cheapest_network,
        'most_expensive_network': most_expensive_network,
        'savings_opportunities': f"חסוך ₪{round(max_price - min_price, 2)} ({round(((max_price - min_price) / max_price) * 100, 1)}%) בבחירת {cheapest_network} על פני {most_expensive_network}"
    }

def deploy_to_website_data_source(website_data):
    """
    Deploy unified data to website's data source
    """
    
    # Navigate to website directory
    os.chdir('/Users/yogi/Desktop/basarometer/v5/v3/')
    
    # Create the website-expected data structure
    website_database = {
        'products': website_data,
        'metadata': {
            'total_products': len(website_data),
            'creation_date': datetime.now().isoformat(),
            'data_type': 'unified_cross_network_comparison',
            'networks_covered': len(set().union(*[p['networks_available'] for p in website_data])),
            'version': 'V6.0_Website_Compatible'
        }
    }
    
    # Save to website data location
    with open('data/products.json', 'w', encoding='utf-8') as f:
        json.dump(website_database, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Deployed {len(website_data)} unified products to data/products.json")
    
    # Also save backup
    with open('website_unified_products_backup.json', 'w', encoding='utf-8') as f:
        json.dump(website_database, f, ensure_ascii=False, indent=2)
    
    # Generate deployment report
    deployment_report = {
        'deployment_summary': {
            'total_unified_products': len(website_data),
            'multi_network_products': len([p for p in website_data if p['network_count'] > 1]),
            'single_network_products': len([p for p in website_data if p['network_count'] == 1]),
            'networks_covered': list(set().union(*[p['networks_available'] for p in website_data])),
            'categories_covered': list(set(p['category'] for p in website_data)),
            'deployment_time': datetime.now().isoformat()
        },
        'sample_products': website_data[:3] if website_data else [],
        'quality_metrics': {
            'avg_networks_per_product': round(sum(p['network_count'] for p in website_data) / len(website_data), 2) if website_data else 0,
            'products_with_savings': len([p for p in website_data if p.get('savings_analysis')]),
            'total_potential_savings': sum(p.get('savings_analysis', {}).get('max_savings_amount', 0) if p.get('savings_analysis') else 0 for p in website_data)
        }
    }
    
    with open('website_deployment_report.json', 'w', encoding='utf-8') as f:
        json.dump(deployment_report, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 DEPLOYMENT REPORT:")
    print(f"   Unified products: {deployment_report['deployment_summary']['total_unified_products']}")
    print(f"   Multi-network: {deployment_report['deployment_summary']['multi_network_products']}")
    print(f"   Networks: {', '.join(deployment_report['deployment_summary']['networks_covered'])}")
    print(f"   Categories: {', '.join(deployment_report['deployment_summary']['categories_covered'])}")
    
    return deployment_report

if __name__ == "__main__":
    print("🎯 Starting Mission: Create Multi-Network Unified Data for Website Display")
    print("=" * 80)
    
    # Phase 1: Activate Multi-Network Data Collection
    print("\n🔄 Phase 1: Activate Multi-Network Data Collection")
    network_products, available_networks = collect_multi_network_data()
    
    # Phase 2: Create Hebrew Name Normalization for Product Grouping
    print("\n🔤 Phase 2: Create Hebrew Name Normalization for Product Grouping")
    grouped_products = group_products_by_normalized_name(network_products)
    
    # Phase 3: Create Website-Compatible Unified Data Structure
    print("\n🏗️ Phase 3: Create Website-Compatible Unified Data Structure")
    website_data = create_website_compatible_data(grouped_products)
    
    # Phase 4: Deploy to Website Data Source
    print("\n🚀 Phase 4: Deploy to Website Data Source")
    deployment_result = deploy_to_website_data_source(website_data)
    
    print("\n🎉 WEBSITE DATA DEPLOYMENT COMPLETE!")
    print("Website should now display proper cross-network comparisons!")
    print("=" * 80)