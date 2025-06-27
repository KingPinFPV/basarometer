#!/usr/bin/env python3
"""
Unified Government Meat Extractor
Extracts meat products from multiple Israeli supermarket XML sources:
- RamiLevy promotional files
- Victory full catalog files
- Other government transparency XML files
"""

import xml.etree.ElementTree as ET
import json
import glob
import re
import os
from datetime import datetime
from typing import List, Dict, Optional

class UnifiedGovernmentMeatExtractor:
    def __init__(self):
        self.meat_keywords = [
            'בשר', 'בקר', 'עוף', 'טלה', 'כבש', 'עגל', 'חזיר',
            'meat', 'beef', 'chicken', 'lamb', 'veal', 'pork',
            'פרגית', 'שוקיים', 'כנפיים', 'חזה', 'ירך', 'לבבות',
            'קצבים', 'קצבות', 'בשרים', 'אנטריקוט', 'פילה',
            'כתף', 'צלעות', 'קבב', 'נתח', 'שניצל',
            'המבורגר', 'מטוגן', 'צלוי', 'טחון', 'קיימה',
            'סטייק', 'אסדו', 'רוסט', 'קורנדביף', 'פסטרמה',
            'טרי', 'קפוא', 'מהדרין', 'מחפוד', 'טבעי',
            'כבד', 'גולש', 'צלי', 'פסטרמה', 'בריסקט',
            'שריר', 'אונטריב', 'אסאדו', 'nebraska'
        ]
        
        self.extracted_products = []
        self.stats = {
            'total_files': 0,
            'total_products_found': 0,
            'meat_products_found': 0,
            'unique_products': 0,
            'ramilevy_files': 0,
            'victory_files': 0
        }
        
        self.supermarket_mapping = {
            '7290058140886': 'RamiLevy',
            '7290696200003': 'Victory'
        }
    
    def extract_all_government_data(self) -> List[Dict]:
        """Extract from all available government XML sources"""
        print("🏛️ Unified Government Meat Extraction v2.0")
        print("=" * 65)
        
        all_products = []
        
        # Extract from RamiLevy promotional files
        ramilevy_products = self.extract_ramilevy_promos()
        all_products.extend(ramilevy_products)
        
        # Extract from Victory catalog files  
        victory_products = self.extract_victory_catalogs()
        all_products.extend(victory_products)
        
        # Update stats
        self.extracted_products = all_products
        
        # Deduplicate and finalize
        unique_products = self.deduplicate_products(all_products)
        self.stats['unique_products'] = len(unique_products)
        
        # Save results
        self.save_results(unique_products)
        
        # Print summary
        self.print_summary()
        
        return unique_products
    
    def extract_ramilevy_promos(self) -> List[Dict]:
        """Extract from RamiLevy promotional XML files"""
        print("\n🛒 Processing RamiLevy Promotional Files...")
        
        xml_files = glob.glob("./dumps/RamiLevy/*.xml")
        products = []
        
        # Filter to files with meat content
        meat_files = []
        for xml_file in xml_files:
            try:
                with open(xml_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if any(keyword in content.lower() for keyword in self.meat_keywords[:10]):
                        meat_files.append(xml_file)
            except:
                continue
        
        self.stats['ramilevy_files'] = len(meat_files)
        print(f"   📁 Found {len(meat_files)} RamiLevy files with meat content")
        
        for xml_file in meat_files:
            products.extend(self.extract_ramilevy_promo_file(xml_file))
        
        return products
    
    def extract_victory_catalogs(self) -> List[Dict]:
        """Extract from Victory full catalog XML files"""
        print("\n🏪 Processing Victory Catalog Files...")
        
        victory_dir = "./hybrid-integration/scrapers-data/VICTORY/Victory/"
        if not os.path.exists(victory_dir):
            print("   ⚠️  Victory directory not found")
            return []
        
        xml_files = glob.glob(f"{victory_dir}*.xml")
        products = []
        
        # Filter to files with meat content
        meat_files = []
        for xml_file in xml_files:
            try:
                with open(xml_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if any(keyword in content.lower() for keyword in self.meat_keywords[:10]):
                        meat_files.append(xml_file)
            except:
                continue
        
        self.stats['victory_files'] = len(meat_files)
        print(f"   📁 Found {len(meat_files)} Victory files with meat content")
        
        for xml_file in meat_files:
            products.extend(self.extract_victory_catalog_file(xml_file))
        
        return products
    
    def extract_ramilevy_promo_file(self, xml_file: str) -> List[Dict]:
        """Extract from single RamiLevy promotional file"""
        products = []
        try:
            tree = ET.parse(xml_file)
            root = tree.getroot()
            
            promotions = root.find('Promotions')
            if promotions is None:
                return products
            
            for promotion in promotions.findall('Promotion'):
                promo_desc = promotion.find('PromotionDescription')
                if promo_desc is not None and promo_desc.text:
                    description = promo_desc.text.strip()
                    
                    if self.is_meat_product(description):
                        product = self.extract_ramilevy_product(promotion, description, xml_file)
                        if product:
                            products.append(product)
        
        except Exception as e:
            print(f"   ❌ Error processing {xml_file}: {e}")
        
        return products
    
    def extract_victory_catalog_file(self, xml_file: str) -> List[Dict]:
        """Extract from single Victory catalog file"""
        products = []
        file_meat_count = 0
        file_total_count = 0
        
        try:
            tree = ET.parse(xml_file)
            root = tree.getroot()
            
            products_elem = root.find('Products')
            if products_elem is None:
                print(f"   ⚠️  No <Products> element found in {xml_file.split('/')[-1]}")
                return products
            
            for product_elem in products_elem.findall('Product'):
                file_total_count += 1
                item_name = product_elem.find('ItemName')
                if item_name is not None and item_name.text:
                    name = item_name.text.strip()
                    
                    if self.is_meat_product(name):
                        file_meat_count += 1
                        product = self.extract_victory_product(product_elem, xml_file)
                        if product:
                            products.append(product)
                            print(f"   ✅ Found: {name[:50]}... - {product.get('price', 'N/A')}₪")
                        else:
                            print(f"   ⚠️  Failed to extract: {name[:50]}...")
            
            if file_meat_count > 0:
                print(f"   📦 File {xml_file.split('/')[-1]}: {file_meat_count} meat products out of {file_total_count} total")
        
        except Exception as e:
            print(f"   ❌ Error processing {xml_file}: {e}")
        
        return products
    
    def extract_ramilevy_product(self, promotion, description: str, xml_file: str) -> Optional[Dict]:
        """Extract product from RamiLevy promotion"""
        try:
            product = {
                'name': self.parse_ramilevy_name(description),
                'price': None,
                'unit_price': None,
                'vendor': 'RamiLevy',
                'category': 'Meat',
                'unit': '',
                'source': 'government_promo_xml',
                'extracted_at': datetime.now().isoformat(),
                'file_source': xml_file.split('/')[-1],
                'raw_description': description
            }
            
            # Extract price from gift items or description
            promo_items = promotion.find('PromotionItems')
            if promo_items is not None:
                for item in promo_items.findall('Item'):
                    gift_price = item.find('GiftItemPrice')
                    if gift_price is not None and gift_price.text:
                        try:
                            product['price'] = float(gift_price.text)
                            product['unit_price'] = float(gift_price.text)
                            break
                        except ValueError:
                            pass
            
            # Try price from description
            if not product['price']:
                desc_price = self.extract_price_from_text(description)
                if desc_price:
                    product['price'] = desc_price
                    product['unit_price'] = desc_price
            
            return product if product['name'] and product['price'] else None
            
        except Exception as e:
            return None
    
    def extract_victory_product(self, product_elem, xml_file: str) -> Optional[Dict]:
        """Extract product from Victory catalog"""
        try:
            # Extract basic fields
            item_name = product_elem.find('ItemName')
            item_price = product_elem.find('ItemPrice')
            unit_price = product_elem.find('UnitOfMeasurePrice')
            item_code = product_elem.find('ItemCode')
            manufacturer = product_elem.find('ManufactureName')
            unit_qty = product_elem.find('UnitQty')
            
            if not (item_name and item_name.text and item_price and item_price.text):
                print(f"      ❌ Missing required fields: name={item_name.text if item_name else None}, price={item_price.text if item_price else None}")
                return None
            
            try:
                price = float(item_price.text)
                unit_price_val = float(unit_price.text) if unit_price and unit_price.text else price
            except ValueError as e:
                print(f"      ❌ Price conversion error: {e}")
                return None
            
            product = {
                'name': item_name.text.strip(),
                'price': price,
                'unit_price': unit_price_val,
                'vendor': 'Victory',
                'category': 'Meat',
                'unit': unit_qty.text.strip() if unit_qty and unit_qty.text else 'kg',
                'source': 'government_catalog_xml',
                'extracted_at': datetime.now().isoformat(),
                'file_source': xml_file.split('/')[-1],
                'item_code': item_code.text if item_code and item_code.text else '',
                'manufacturer': manufacturer.text.strip() if manufacturer and manufacturer.text else '',
                'raw_description': item_name.text.strip()
            }
            
            # Calculate per-kg price if available
            if product['unit_price']:
                product['price_per_kg'] = product['unit_price']
            elif product['price']:
                product['price_per_kg'] = product['price']
            
            # Basic validation
            if len(product['name']) < 3:
                print(f"      ❌ Name too short: {product['name']}")
                return None
            
            return product
            
        except Exception as e:
            print(f"      ❌ Extract error: {e}")
            return None
    
    def parse_ramilevy_name(self, description: str) -> str:
        """Clean RamiLevy promotional description to extract product name"""
        name = description
        
        # Remove promotional text
        promotional_patterns = [
            r'\d+\s*יח[״\']?\s*ב[-]?\d+\.?\d*\s*ש[״\']?ח',
            r'\d+\s*ב[-]?\d+\.?\d*\s*ש[״\']?ח',
            r'ב[-]?\d+\.?\d*\s*ש[״\']?ח',
            r'מעל\s+\d+\s+מו\d*',
            r'\d+\s*גרם?',
            r'\d+\s*מל',
        ]
        
        for pattern in promotional_patterns:
            name = re.sub(pattern, '', name, flags=re.IGNORECASE)
        
        return re.sub(r'\s+', ' ', name).strip()[:100]
    
    def extract_price_from_text(self, text: str) -> Optional[float]:
        """Extract price from text description"""
        price_patterns = [
            r'ב(\d+\.?\d*)',
            r'(\d+\.?\d*)\s*ש[״"]ח',
            r'(\d+\.?\d*)\s*₪',
        ]
        
        for pattern in price_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    return float(match.group(1))
                except (ValueError, IndexError):
                    continue
        return None
    
    def is_meat_product(self, text: str) -> bool:
        """Check if text indicates a meat product"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.meat_keywords)
    
    def deduplicate_products(self, products: List[Dict]) -> List[Dict]:
        """Remove duplicate products"""
        seen = set()
        unique_products = []
        
        for product in products:
            # Create deduplication key
            key = f"{product['name'].lower().strip()}-{product['vendor'].lower()}"
            
            if key not in seen and len(product['name']) > 3:
                seen.add(key)
                unique_products.append(product)
        
        return unique_products
    
    def save_results(self, products: List[Dict]) -> None:
        """Save extraction results"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save products
        products_file = f"unified_government_meat_products_{timestamp}.json"
        with open(products_file, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2, default=str)
        
        # Save stats
        stats_file = f"unified_government_stats_{timestamp}.json"
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(self.stats, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Results saved:")
        print(f"   📄 Products: {products_file}")
        print(f"   📊 Stats: {stats_file}")
    
    def print_summary(self) -> None:
        """Print extraction summary"""
        print(f"\n📊 Unified Extraction Results:")
        print(f"   🛒 RamiLevy files: {self.stats['ramilevy_files']}")
        print(f"   🏪 Victory files: {self.stats['victory_files']}")
        print(f"   📦 Total products extracted: {len(self.extracted_products)}")
        print(f"   🥩 Unique meat products: {self.stats['unique_products']}")
        
        if self.stats['unique_products'] >= 20:
            print(f"\n🎉 SUCCESS: {self.stats['unique_products']} unique government meat products!")
            print(f"🎯 TARGET ACHIEVED: Well above minimum 20 products")
            print(f"🔗 Ready for integration with 39-product web scraper")
            total_projected = self.stats['unique_products'] + 39
            print(f"📊 Total projected products: {total_projected}")
        elif self.stats['unique_products'] >= 10:
            print(f"\n✅ GOOD PROGRESS: {self.stats['unique_products']} products extracted")
            print(f"🎯 Need {20 - self.stats['unique_products']} more to reach 20 minimum")
        else:
            print(f"\n⚠️ LIMITED SUCCESS: {self.stats['unique_products']} products extracted")
            print(f"💡 May need additional data sources or improved extraction")

def main():
    """Main execution function"""
    extractor = UnifiedGovernmentMeatExtractor()
    products = extractor.extract_all_government_data()
    
    # Show sample products by vendor
    if products:
        print(f"\n🥩 Sample Products by Vendor:")
        
        # Group by vendor
        by_vendor = {}
        for product in products:
            vendor = product['vendor']
            if vendor not in by_vendor:
                by_vendor[vendor] = []
            by_vendor[vendor].append(product)
        
        for vendor, vendor_products in by_vendor.items():
            print(f"\n   🏪 {vendor} ({len(vendor_products)} products):")
            for i, product in enumerate(vendor_products[:3]):
                price_str = f"{product['price']:.1f}₪"
                if product.get('unit_price'):
                    price_str += f" ({product['unit_price']:.1f}₪/{product.get('unit', 'unit')})"
                print(f"      {i+1}. {product['name'][:50]} - {price_str}")
        
        print(f"\n🎯 Mission Status:")
        if len(products) >= 50:
            print(f"🏆 OUTSTANDING: {len(products)} products - Far exceeds 50 target!")
        elif len(products) >= 20:
            print(f"✅ SUCCESS: {len(products)} products - Exceeds 20 minimum!")
        else:
            print(f"⚠️ PARTIAL: {len(products)} products - Below 20 target")
    
    return products

if __name__ == "__main__":
    main()