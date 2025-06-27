#!/usr/bin/env python3
"""
Government Promo Meat Extractor
Extracts meat products from Israeli supermarket promotional XML files
Specialized for RamiLevy price transparency promo data
"""

import xml.etree.ElementTree as ET
import json
import glob
import re
from datetime import datetime
from typing import List, Dict, Optional

class GovernmentPromoMeatExtractor:
    def __init__(self):
        self.meat_keywords = [
            'בשר', 'בקר', 'עוף', 'טלה', 'כבש', 'עגל', 'חזיר',
            'meat', 'beef', 'chicken', 'lamb', 'veal', 'pork',
            'פרגית', 'שוקיים', 'כנפיים', 'חזה', 'ירך', 'לבבות',
            'קצבים', 'קצבות', 'בשרים', 'אנטריקוט', 'פילה',
            'כתף', 'צלעות', 'קבב', 'נתח', 'שניצל',
            'המבורגר', 'מטוגן', 'צלוי', 'טחון', 'קיימה',
            'סטייק', 'אסדו', 'רוסט', 'קורנדביף', 'פסטרמה',
            'טרי', 'קפוא', 'מהדרין', 'מחפוד', 'טבעי'
        ]
        
        self.unit_patterns = [
            r'(\d+)\s*ק[״"]ג',  # Hebrew kg
            r'(\d+)\s*גרם',     # Hebrew gram
            r'(\d+)\s*גר[״"]',   # Hebrew gr
            r'(\d+)\s*מל[״"]',   # Hebrew ml
            r'(\d+)\s*יח[״"]',   # Hebrew units
            r'(\d+)\s*kg',      # English kg
            r'(\d+)\s*g',       # English gram
        ]
        
        self.price_patterns = [
            r'ב(\d+\.?\d*)',          # "ב37.90" format
            r'(\d+\.?\d*)\s*ש[״"]ח',  # Hebrew shekels
            r'(\d+\.?\d*)\s*₪',       # Shekel symbol
            r'(\d+\.?\d*)\s*שקל',     # Hebrew shekel word
        ]
        
        self.extracted_products = []
        self.stats = {
            'total_files': 0,
            'total_promotions': 0,
            'meat_promotions': 0,
            'extracted_products': 0,
            'unique_products': 0
        }
    
    def extract_from_all_files(self) -> List[Dict]:
        """Extract meat products from all XML files"""
        print("🏛️ Government Promo Meat Extraction v2.0")
        print("=" * 60)
        
        # Find all XML files
        xml_files = glob.glob("./dumps/RamiLevy/*.xml")
        
        if not xml_files:
            print("❌ No XML files found in ./dumps/RamiLevy/")
            return []
        
        # Filter to files that contain meat keywords
        meat_files = []
        print("🔍 Pre-scanning for meat content...")
        
        for xml_file in xml_files:
            try:
                with open(xml_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if any(keyword in content.lower() for keyword in ['בשר', 'עוף', 'בקר', 'meat', 'chicken', 'beef', 'לבבות', 'שוקיים', 'חזה', 'כנף']):
                        meat_files.append(xml_file)
            except:
                continue
        
        self.stats['total_files'] = len(meat_files)
        print(f"📁 Found {len(meat_files)} XML files with meat content")
        
        # Process each meat file
        for i, xml_file in enumerate(meat_files):
            print(f"\n🔍 Processing file {i+1}/{len(meat_files)}: {xml_file.split('/')[-1]}")
            self.extract_from_file(xml_file)
        
        # Deduplicate and finalize
        unique_products = self.deduplicate_products()
        self.stats['unique_products'] = len(unique_products)
        
        # Save results
        self.save_results(unique_products)
        
        # Print summary
        self.print_summary()
        
        return unique_products
    
    def extract_from_file(self, xml_file: str) -> None:
        """Extract meat products from a single XML file"""
        try:
            tree = ET.parse(xml_file)
            root = tree.getroot()
            
            # Extract file metadata
            chain_id = root.find('ChainId')
            store_id = root.find('StoreId')
            chain_name = "RamiLevy"  # Known from file path
            
            # Find promotions
            promotions = root.find('Promotions')
            if promotions is None:
                return
            
            file_promotions = 0
            file_meat_promotions = 0
            
            for promotion in promotions.findall('Promotion'):
                file_promotions += 1
                
                # Extract promotion details
                promo_desc = promotion.find('PromotionDescription')
                promo_price = promotion.find('DiscountedPrice')
                promo_per_unit = promotion.find('DiscountedPricePerMida')
                promo_id = promotion.find('PromotionId')
                
                if promo_desc is not None and promo_desc.text:
                    description = promo_desc.text.strip()
                    
                    # Check if this is a meat promotion
                    if self.is_meat_promotion(description):
                        file_meat_promotions += 1
                        
                        # Extract product information
                        product = self.extract_product_from_promotion(
                            promotion, description, chain_name, xml_file
                        )
                        
                        if product:
                            self.extracted_products.append(product)
            
            self.stats['total_promotions'] += file_promotions
            self.stats['meat_promotions'] += file_meat_promotions
            
            print(f"   📦 Promotions: {file_promotions}, Meat: {file_meat_promotions}")
            
        except Exception as e:
            print(f"   ❌ Error processing {xml_file}: {e}")
    
    def is_meat_promotion(self, description: str) -> bool:
        """Check if promotion description contains meat keywords"""
        desc_lower = description.lower()
        return any(keyword in desc_lower for keyword in self.meat_keywords)
    
    def extract_product_from_promotion(self, promotion, description: str, chain_name: str, xml_file: str) -> Optional[Dict]:
        """Extract detailed product information from promotion"""
        try:
            # Basic product structure
            product = {
                'name': '',
                'price': None,
                'unit_price': None,
                'vendor': chain_name,
                'category': 'Meat',
                'unit': '',
                'quantity': '',
                'source': 'government_promo_xml',
                'extracted_at': datetime.now().isoformat(),
                'promo_id': '',
                'raw_description': description,
                'file_source': xml_file.split('/')[-1]
            }
            
            # Extract promotion ID
            promo_id_elem = promotion.find('PromotionId')
            if promo_id_elem is not None:
                product['promo_id'] = promo_id_elem.text
            
            # Extract prices - try multiple sources
            discounted_price = promotion.find('DiscountedPrice')
            price_per_unit = promotion.find('DiscountedPricePerMida')
            
            if discounted_price is not None and discounted_price.text:
                try:
                    product['price'] = float(discounted_price.text)
                except ValueError:
                    pass
            
            if price_per_unit is not None and price_per_unit.text:
                try:
                    product['unit_price'] = float(price_per_unit.text)
                except ValueError:
                    pass
            
            # Also try to extract price from gift items (like the chicken example)
            promo_items = promotion.find('PromotionItems')
            if promo_items is not None and not product['price']:
                for item in promo_items.findall('Item'):
                    gift_price = item.find('GiftItemPrice')
                    if gift_price is not None and gift_price.text:
                        try:
                            product['price'] = float(gift_price.text)
                            product['unit_price'] = float(gift_price.text)
                            break
                        except ValueError:
                            pass
            
            # Extract quantity info from description
            min_qty = promotion.find('MinQty')
            if min_qty is not None and min_qty.text:
                try:
                    product['quantity'] = f"{min_qty.text} units"
                except ValueError:
                    pass
            
            # Parse product name from description
            product['name'] = self.parse_product_name(description)
            
            # Extract unit information
            product['unit'] = self.extract_unit_from_description(description)
            
            # Extract price from description if not found in XML elements
            if not product['price']:
                desc_price = self.extract_price_from_description(description)
                if desc_price:
                    product['price'] = desc_price
                    product['unit_price'] = desc_price
            
            # Calculate per-kg price if possible
            if product['unit_price'] and 'kg' in product['unit'].lower():
                product['price_per_kg'] = product['unit_price']
            elif product['price'] and product['quantity']:
                # Try to calculate per-kg price from total price and quantity
                qty_match = re.search(r'(\d+)', product['quantity'])
                if qty_match:
                    try:
                        units = int(qty_match.group(1))
                        if units > 0:
                            product['price_per_unit'] = product['price'] / units
                    except:
                        pass
            
            # Extract item codes for reference
            promo_items = promotion.find('PromotionItems')
            if promo_items is not None:
                item_codes = []
                for item in promo_items.findall('Item'):
                    item_code = item.find('ItemCode')
                    if item_code is not None and item_code.text:
                        item_codes.append(item_code.text)
                
                product['item_codes'] = item_codes[:3]  # Keep first 3 for reference
                product['item_count'] = len(item_codes)
            
            # Quality assessment
            if product['name'] and (product['price'] or product['unit_price']):
                return product
            
        except Exception as e:
            print(f"     ❌ Error extracting product: {e}")
        
        return None
    
    def parse_product_name(self, description: str) -> str:
        """Extract clean product name from promotion description"""
        # Remove quantity and price information
        name = description
        
        # Remove common promotional phrases
        promotional_phrases = [
            r'\d+\s*יח[״\']?\s*ב[-]?\d+\.?\d*\s*ש[״\']?ח',  # X units for Y shekels
            r'\d+\s*ב[-]?\d+\.?\d*\s*ש[״\']?ח',            # X for Y shekels
            r'ב[-]?\d+\.?\d*\s*ש[״\']?ח',                  # for Y shekels
            r'\d+\s*יח[״\']?',                              # X units
            r'\d+\s*גרם?',                                  # X grams
            r'\d+\s*מל',                                    # X ml
            r'\d+\s*ק[״\']?ג',                             # X kg
        ]
        
        for phrase_pattern in promotional_phrases:
            name = re.sub(phrase_pattern, '', name, flags=re.IGNORECASE)
        
        # Clean up extra spaces and punctuation
        name = re.sub(r'\s+', ' ', name).strip()
        name = re.sub(r'^[-\s]+|[-\s]+$', '', name)
        
        return name[:100]  # Limit length
    
    def extract_unit_from_description(self, description: str) -> str:
        """Extract unit information from description"""
        for pattern in self.unit_patterns:
            match = re.search(pattern, description)
            if match:
                if 'ק' in pattern or 'kg' in pattern:
                    return 'kg'
                elif 'גרם' in pattern or 'גר' in pattern or 'g' in pattern:
                    return 'gram'
                elif 'מל' in pattern:
                    return 'ml'
                elif 'יח' in pattern:
                    return 'unit'
        
        return ''
    
    def extract_price_from_description(self, description: str) -> Optional[float]:
        """Extract price from description text"""
        for pattern in self.price_patterns:
            match = re.search(pattern, description)
            if match:
                try:
                    return float(match.group(1))
                except (ValueError, IndexError):
                    continue
        return None
    
    def deduplicate_products(self) -> List[Dict]:
        """Remove duplicate products based on name and vendor"""
        seen = set()
        unique_products = []
        
        for product in self.extracted_products:
            # Create deduplication key
            key = f"{product['name'].lower().strip()}-{product['vendor'].lower()}"
            
            if key not in seen and len(product['name']) > 3:
                seen.add(key)
                unique_products.append(product)
        
        self.stats['extracted_products'] = len(self.extracted_products)
        return unique_products
    
    def save_results(self, products: List[Dict]) -> None:
        """Save extraction results to JSON file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save products
        products_file = f"government_promo_meat_products_{timestamp}.json"
        with open(products_file, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2, default=str)
        
        # Save stats
        stats_file = f"government_promo_extraction_stats_{timestamp}.json"
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(self.stats, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Results saved:")
        print(f"   📄 Products: {products_file}")
        print(f"   📊 Stats: {stats_file}")
    
    def print_summary(self) -> None:
        """Print extraction summary"""
        print(f"\n📊 Extraction Results Summary:")
        print(f"   📁 Files processed: {self.stats['total_files']}")
        print(f"   🎯 Total promotions: {self.stats['total_promotions']}")
        print(f"   🥩 Meat promotions: {self.stats['meat_promotions']}")
        print(f"   📦 Products extracted: {self.stats['extracted_products']}")
        print(f"   ✨ Unique products: {self.stats['unique_products']}")
        
        if self.stats['unique_products'] > 0:
            print(f"\n🎉 SUCCESS: {self.stats['unique_products']} unique meat products found!")
            print(f"🔗 Ready for integration with web scraper data")
            
            # Show success rate
            if self.stats['meat_promotions'] > 0:
                success_rate = (self.stats['unique_products'] / self.stats['meat_promotions']) * 100
                print(f"📈 Conversion rate: {success_rate:.1f}%")
        else:
            print(f"\n⚠️ No meat products extracted")
            print(f"💡 May need to adjust meat keywords or extraction logic")

def main():
    """Main execution function"""
    extractor = GovernmentPromoMeatExtractor()
    products = extractor.extract_from_all_files()
    
    # Show sample products
    if products:
        print(f"\n🥩 Sample Products:")
        for i, product in enumerate(products[:5]):
            print(f"   {i+1}. {product['name']}")
            print(f"      💰 Price: {product['price']}₪ | Unit: {product['unit']}")
            print(f"      🏪 Vendor: {product['vendor']} | Items: {product.get('item_count', 0)}")
            print(f"      📝 Description: {product['raw_description'][:60]}...")
            print()
    
    return products

if __name__ == "__main__":
    main()