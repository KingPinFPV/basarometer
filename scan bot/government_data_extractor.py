#!/usr/bin/env python3
"""
Government Data Extractor for Basarometer V6.0
Uses il-supermarket-scraper for official Israeli government data
Legal basis: https://www.gov.il/he/pages/cpfta_prices_regulations
"""

import sys
import json
import warnings
from datetime import datetime
from typing import List, Dict, Any, Optional

# Suppress SSL warnings
warnings.filterwarnings('ignore')

try:
    from il_supermarket_scarper.scrappers_factory import ScraperFactory
    from il_supermarket_scarper.main import ScarpingTask, MainScrapperRunner
    print("✅ il-supermarket-scraper imported successfully", file=sys.stderr)
except ImportError as e:
    print(f"❌ Failed to import il-supermarket-scraper: {e}", file=sys.stderr)
    sys.exit(1)

class GovernmentDataExtractor:
    """
    Extracts data from Israeli government supermarket transparency API
    Standardizes format for integration with basarometer web scraper
    """
    
    def __init__(self, debug: bool = False):
        self.debug = debug
        self.meat_keywords = [
            'בשר', 'meat', 'בקר', 'עוף', 'chicken', 'טלה', 'lamb', 
            'כבש', 'פרה', 'cow', 'עגל', 'veal', 'קציצ', 'burger',
            'שניצל', 'schnitzel', 'נקניק', 'sausage', 'אנטריקוט',
            'פילה', 'fillet', 'סטייק', 'steak', 'קבב', 'kebab'
        ]
        
        self.major_chains = [
            'SHUFERSAL', 'RAMI_LEVY', 'MEGA', 'VICTORY', 
            'YOHANANOF', 'YAYNO_BITAN', 'TIV_TAAM', 'HAZI_HINAM'
        ]
    
    def get_available_scrapers(self) -> List[str]:
        """Get list of available Israeli supermarket scrapers"""
        try:
            # Get available scrapers from ScraperFactory
            all_methods = [method for method in dir(ScraperFactory) if not method.startswith('_')]
            
            # Return major chains that are available
            available = [chain for chain in self.major_chains if chain in all_methods]
            
            if self.debug:
                print(f"🔍 Available scrapers: {available}", file=sys.stderr)
                print(f"🔍 All methods: {all_methods[:10]}...", file=sys.stderr)
            
            return available
            
        except Exception as e:
            print(f"❌ Error getting scrapers: {e}", file=sys.stderr)
            return []
    
    def is_meat_product(self, name: str) -> bool:
        """Check if product name contains meat keywords"""
        if not name:
            return False
            
        name_lower = name.lower()
        return any(keyword in name_lower for keyword in self.meat_keywords)
    
    def extract_price_info(self, price_str: str) -> Dict[str, Any]:
        """Extract price and unit information"""
        try:
            # Handle various price formats
            price = float(str(price_str).replace('₪', '').replace(',', '').strip())
            return {
                'price': price,
                'currency': 'ILS',
                'valid': True
            }
        except (ValueError, TypeError):
            return {
                'price': 0.0,
                'currency': 'ILS', 
                'valid': False
            }
    
    def standardize_product(self, product: Any, chain_name: str) -> Optional[Dict[str, Any]]:
        """Convert government data product to basarometer format"""
        try:
            # Extract product information
            name = getattr(product, 'name', '') or str(product.get('name', '')) if hasattr(product, 'get') else str(product)
            
            if not name or not self.is_meat_product(name):
                return None
            
            # Extract price
            price_info = self.extract_price_info(getattr(product, 'price', 0))
            
            # Extract additional info
            unit = getattr(product, 'unit', 'יחידה') or 'יחידה'
            barcode = getattr(product, 'barcode', None)
            
            # Calculate weight and price per kg
            weight = None
            price_per_kg = price_info['price']
            
            # Try to extract weight from name or unit
            if 'גרם' in name or 'גר' in name:
                try:
                    import re
                    weight_match = re.search(r'(\d+)\s*גר', name)
                    if weight_match:
                        weight = float(weight_match.group(1)) / 1000
                        price_per_kg = price_info['price'] / weight if weight > 0 else price_info['price']
                except:
                    pass
            elif 'ק"ג' in name or 'קג' in name or 'קילו' in name:
                weight = 1.0
                price_per_kg = price_info['price']
            
            # Create standardized product
            standardized = {
                'id': f"gov-{chain_name.lower()}-{hash(name) % 100000}",
                'name': name.strip(),
                'originalName': name,
                'normalizedName': name.strip(),
                'brand': None,
                'weight': weight,
                'price': price_info['price'],
                'unit': unit,
                'pricePerKg': price_per_kg,
                'site': f"government-{chain_name.lower()}",
                'siteName': chain_name,
                'category': 'בשר',  # Default meat category
                'confidence': 0.7,  # Government data confidence
                'imageUrl': None,
                'timestamp': datetime.now().isoformat(),
                'isValid': price_info['valid'],
                'source': 'government_data',
                'barcode': barcode
            }
            
            return standardized
            
        except Exception as e:
            if self.debug:
                print(f"⚠️ Error standardizing product {product}: {e}", file=sys.stderr)
            return None
    
    def scrape_chain_data(self, chain_name: str, limit_items: int = 100) -> List[Dict[str, Any]]:
        """Scrape data from a specific Israeli supermarket chain"""
        try:
            if self.debug:
                print(f"🔍 Scraping {chain_name} (limit: {limit_items})...", file=sys.stderr)
            
            # Create scraping task with correct parameters
            task = ScarpingTask(
                enabled_scrapers=[chain_name],  # Specify which scrapers to use
                limit=limit_items,              # Use 'limit' not 'limit_items'
                lookup_in_db=False,
                suppress_exception=True
            )
            
            # Run scraper
            results = task.start()
            
            if self.debug:
                print(f"📊 Raw results from {chain_name}: {len(results) if results else 0} items", file=sys.stderr)
            
            if not results:
                return []
            
            # Filter and standardize meat products
            meat_products = []
            for product in results:
                standardized = self.standardize_product(product, chain_name)
                if standardized:
                    meat_products.append(standardized)
            
            if self.debug:
                print(f"🥩 Meat products from {chain_name}: {len(meat_products)}", file=sys.stderr)
            
            return meat_products
            
        except Exception as e:
            print(f"❌ Error scraping {chain_name}: {e}", file=sys.stderr)
            return []
    
    def extract_all_chains(self, limit_per_chain: int = 50) -> Dict[str, Any]:
        """Extract data from all available chains"""
        print("=== Government Data Extraction Starting ===", file=sys.stderr)
        
        available_scrapers = self.get_available_scrapers()
        if not available_scrapers:
            print("❌ No scrapers available", file=sys.stderr)
            return {
                'success': False,
                'error': 'No scrapers available',
                'products': [],
                'summary': {}
            }
        
        all_products = []
        chain_results = {}
        
        for chain in available_scrapers[:4]:  # Limit to top 4 chains for testing
            if self.debug:
                print(f"\n🔄 Processing {chain}...", file=sys.stderr)
            
            products = self.scrape_chain_data(chain, limit_per_chain)
            all_products.extend(products)
            chain_results[chain] = len(products)
            
            if self.debug:
                print(f"✅ {chain}: {len(products)} products", file=sys.stderr)
        
        # Create summary
        summary = {
            'timestamp': datetime.now().isoformat(),
            'total_products': len(all_products),
            'chains_processed': len(chain_results),
            'chain_results': chain_results,
            'success': True
        }
        
        print(f"\n📊 Government Data Summary:", file=sys.stderr)
        print(f"   Total products: {summary['total_products']}", file=sys.stderr)
        print(f"   Chains processed: {summary['chains_processed']}", file=sys.stderr)
        for chain, count in chain_results.items():
            print(f"   {chain}: {count} products", file=sys.stderr)
        
        return {
            'success': True,
            'products': all_products,
            'summary': summary
        }

def main():
    """Main function for CLI usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Extract Israeli government supermarket data')
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    parser.add_argument('--limit', type=int, default=50, help='Limit products per chain')
    parser.add_argument('--output', type=str, help='Output file path (JSON)')
    parser.add_argument('--chain', type=str, help='Specific chain to scrape')
    
    args = parser.parse_args()
    
    # Create extractor
    extractor = GovernmentDataExtractor(debug=args.debug)
    
    # Extract data
    if args.chain:
        # Single chain
        products = extractor.scrape_chain_data(args.chain, args.limit)
        result = {
            'success': True,
            'products': products,
            'summary': {
                'timestamp': datetime.now().isoformat(),
                'total_products': len(products),
                'chain': args.chain
            }
        }
    else:
        # All chains
        result = extractor.extract_all_chains(args.limit)
    
    # Output results
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"📁 Results saved to {args.output}", file=sys.stderr)
    else:
        # Output to stdout for Node.js integration
        print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()