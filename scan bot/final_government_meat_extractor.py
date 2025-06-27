#!/usr/bin/env python3
"""
Final Government Meat Extractor - WORKING VERSION
Extracts meat products from government XML files using the working parsing approach
"""

import xml.etree.ElementTree as ET
import json
import glob
import os
from datetime import datetime
from typing import List, Dict, Optional

class FinalGovernmentMeatExtractor:
    def __init__(self):
        # Focused meat keywords (excluding generic terms that match too many dairy products)
        self.meat_keywords = [
            'סטייק', 'אנטריקוט', 'פילה', 'אסדו', 'אונטריב', 
            'צלי כתף', 'שריר בקר', 'בריסקט', 'צלעות',
            'נתח', 'שניצל', 'קבב', 'קיימה', 'טחון',
            'nebraska', 'נטו בשרים'  # Specific brands/sources
        ]
        
        self.stats = {
            'ramilevy_products': 0,
            'victory_products': 0,
            'total_products': 0
        }
    
    def extract_all_meat_products(self) -> List[Dict]:
        """Extract meat products from all government sources"""
        print("🏛️ Final Government Meat Extraction")
        print("=" * 50)
        
        all_products = []
        
        # Extract from RamiLevy
        ramilevy_products = self.extract_ramilevy_products()
        all_products.extend(ramilevy_products)
        self.stats['ramilevy_products'] = len(ramilevy_products)
        
        # Extract from Victory
        victory_products = self.extract_victory_products()
        all_products.extend(victory_products)
        self.stats['victory_products'] = len(victory_products)
        
        # Deduplicate
        unique_products = self.deduplicate_products(all_products)
        self.stats['total_products'] = len(unique_products)
        
        # Save results
        self.save_results(unique_products)
        
        # Print summary
        self.print_summary(unique_products)
        
        return unique_products
    
    def extract_ramilevy_products(self) -> List[Dict]:
        """Extract from RamiLevy promotional files"""
        print("\n🛒 Extracting RamiLevy Products...")
        
        xml_files = glob.glob("./dumps/RamiLevy/*.xml")
        products = []
        
        for xml_file in xml_files:
            try:
                tree = ET.parse(xml_file)
                root = tree.getroot()
                
                for promotion in root.findall('.//Promotion'):
                    promo_desc = promotion.find('PromotionDescription')
                    if promo_desc is not None and promo_desc.text:
                        description = promo_desc.text.strip()
                        
                        if self.is_meat_product(description):
                            product = self.extract_ramilevy_product(promotion, description, xml_file)
                            if product:
                                products.append(product)
                                print(f"   ✅ {product['name'][:50]}... - {product['price']}₪")
            
            except Exception as e:
                continue
        
        print(f"   📦 RamiLevy total: {len(products)}")
        return products
    
    def extract_victory_products(self) -> List[Dict]:
        """Extract from Victory catalog files using working approach"""
        print("\n🏪 Extracting Victory Products...")
        
        victory_dir = "./hybrid-integration/scrapers-data/VICTORY/Victory/"
        if not os.path.exists(victory_dir):
            print("   ⚠️  Victory directory not found")
            return []
        
        xml_files = glob.glob(f"{victory_dir}*.xml")
        products = []
        
        for xml_file in xml_files:
            try:
                tree = ET.parse(xml_file)
                root = tree.getroot()
                
                # Use the working approach: find all Product elements directly
                for product_elem in root.findall('.//Product'):
                    item_name = product_elem.find('ItemName')
                    if item_name is not None and item_name.text:
                        name = item_name.text.strip()
                        
                        if self.is_meat_product(name):
                            product = self.extract_victory_product(product_elem, xml_file)
                            if product:
                                products.append(product)
                                print(f"   ✅ {product['name'][:50]}... - {product['price']}₪")
            
            except Exception as e:
                continue
        
        print(f"   📦 Victory total: {len(products)}")
        return products
    
    def extract_ramilevy_product(self, promotion, description: str, xml_file: str) -> Optional[Dict]:
        """Extract RamiLevy product"""
        try:
            # Clean name
            name = self.clean_ramilevy_name(description)
            
            # Extract price from gift items or description
            price = None
            
            promo_items = promotion.find('PromotionItems')
            if promo_items is not None:
                for item in promo_items.findall('Item'):
                    gift_price = item.find('GiftItemPrice')
                    if gift_price is not None and gift_price.text:
                        try:
                            price = float(gift_price.text)
                            break
                        except ValueError:
                            pass
            
            # Try price from description if not found
            if not price:
                import re
                price_match = re.search(r'ב(\d+\.?\d*)', description)
                if price_match:
                    try:
                        price = float(price_match.group(1))
                    except ValueError:
                        pass
            
            if name and price:
                return {
                    'name': name,
                    'price': price,
                    'vendor': 'RamiLevy',
                    'category': 'Meat',
                    'source': 'government_promo',
                    'extracted_at': datetime.now().isoformat(),
                    'raw_description': description
                }
        
        except Exception:
            pass
        
        return None
    
    def extract_victory_product(self, product_elem, xml_file: str) -> Optional[Dict]:
        """Extract Victory product using working approach"""
        try:
            item_name = product_elem.find('ItemName')
            item_price = product_elem.find('ItemPrice')
            unit_price = product_elem.find('UnitOfMeasurePrice')
            item_code = product_elem.find('ItemCode')
            manufacturer = product_elem.find('ManufactureName')
            unit_qty = product_elem.find('UnitQty')
            
            if not (item_name and item_name.text and item_price and item_price.text):
                return None
            
            try:
                price = float(item_price.text)
                unit_price_val = float(unit_price.text) if unit_price and unit_price.text else price
            except ValueError:
                return None
            
            return {
                'name': item_name.text.strip(),
                'price': price,
                'unit_price': unit_price_val,
                'vendor': 'Victory',
                'category': 'Meat',
                'source': 'government_catalog',
                'extracted_at': datetime.now().isoformat(),
                'item_code': item_code.text if item_code and item_code.text else '',
                'manufacturer': manufacturer.text.strip() if manufacturer and manufacturer.text else '',
                'unit': unit_qty.text.strip() if unit_qty and unit_qty.text else 'kg'
            }
            
        except Exception:
            return None
    
    def clean_ramilevy_name(self, description: str) -> str:
        """Clean RamiLevy name"""
        import re
        name = description
        
        # Remove promotional patterns
        patterns = [
            r'\d+\s*יח[״\']?\s*ב[-]?\d+\.?\d*\s*ש[״\']?ח',
            r'ב[-]?\d+\.?\d*\s*ש[״\']?ח',
            r'מעל\s+\d+\s+מו\d*'
        ]
        
        for pattern in patterns:
            name = re.sub(pattern, '', name, flags=re.IGNORECASE)
        
        return re.sub(r'\s+', ' ', name).strip()[:80]
    
    def is_meat_product(self, text: str) -> bool:
        """Check if text indicates a real meat product"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.meat_keywords)
    
    def deduplicate_products(self, products: List[Dict]) -> List[Dict]:
        """Remove duplicates"""
        seen = set()
        unique_products = []
        
        for product in products:
            key = f"{product['name'].lower().strip()}-{product['vendor'].lower()}"
            
            if key not in seen and len(product['name']) > 3:
                seen.add(key)
                unique_products.append(product)
        
        return unique_products
    
    def save_results(self, products: List[Dict]) -> None:
        """Save results"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save products in standard format
        products_file = f"final_government_meat_products_{timestamp}.json"
        with open(products_file, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n💾 Results saved: {products_file}")
    
    def print_summary(self, products: List[Dict]) -> None:
        """Print final summary"""
        print(f"\n📊 Final Extraction Results:")
        print(f"   🛒 RamiLevy: {self.stats['ramilevy_products']} products")
        print(f"   🏪 Victory: {self.stats['victory_products']} products")
        print(f"   🥩 Total unique: {self.stats['total_products']} products")
        
        if self.stats['total_products'] >= 20:
            print(f"\n🎉 SUCCESS: {self.stats['total_products']} government meat products extracted!")
            print(f"🎯 TARGET ACHIEVED: Well above minimum 20 products")
            print(f"🔗 Ready for integration with 39-product web scraper")
            total_projected = self.stats['total_products'] + 39
            print(f"📊 Total projected products: {total_projected}")
            
            if total_projected >= 100:
                print(f"🏆 EXCELLENT: Combined system will have {total_projected}+ products!")
                
        elif self.stats['total_products'] >= 10:
            print(f"\n✅ GOOD: {self.stats['total_products']} products extracted")
            print(f"🎯 Need {20 - self.stats['total_products']} more to reach minimum")
        else:
            print(f"\n⚠️ LIMITED: {self.stats['total_products']} products extracted")
        
        # Show samples by vendor
        if products:
            print(f"\n🥩 Sample Products:")
            
            ramilevy_products = [p for p in products if p['vendor'] == 'RamiLevy']
            victory_products = [p for p in products if p['vendor'] == 'Victory']
            
            if ramilevy_products:
                print(f"\n   🛒 RamiLevy samples:")
                for i, p in enumerate(ramilevy_products[:3]):
                    print(f"      {i+1}. {p['name'][:60]} - {p['price']}₪")
            
            if victory_products:
                print(f"\n   🏪 Victory samples:")
                for i, p in enumerate(victory_products[:3]):
                    print(f"      {i+1}. {p['name'][:60]} - {p['price']}₪")

def main():
    """Main execution"""
    extractor = FinalGovernmentMeatExtractor()
    products = extractor.extract_all_meat_products()
    
    print(f"\n🎯 Mission Status:")
    if len(products) >= 50:
        print(f"🏆 OUTSTANDING SUCCESS: {len(products)} products!")
        print(f"   Far exceeds the 50-product target!")
    elif len(products) >= 20:
        print(f"✅ MISSION ACCOMPLISHED: {len(products)} products!")  
        print(f"   Exceeds minimum 20-product requirement!")
    else:
        print(f"⚠️ PARTIAL SUCCESS: {len(products)} products")
        print(f"   Below 20-product target")
    
    return products

if __name__ == "__main__":
    main()