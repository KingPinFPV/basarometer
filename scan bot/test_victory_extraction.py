#!/usr/bin/env python3
"""
Test Victory Extraction on Known File
"""

import xml.etree.ElementTree as ET
from datetime import datetime

def test_single_file():
    xml_file = "./hybrid-integration/scrapers-data/VICTORY/Victory/Price7290696200003-065-202506061204-001.xml"
    
    print("🧪 Testing Victory Extraction on Known File")
    print("=" * 50)
    
    meat_keywords = [
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
    
    def is_meat_product(text):
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in meat_keywords)
    
    def extract_product(product_elem):
        item_name = product_elem.find('ItemName')
        item_price = product_elem.find('ItemPrice')
        unit_price = product_elem.find('UnitOfMeasurePrice')
        item_code = product_elem.find('ItemCode')
        manufacturer = product_elem.find('ManufactureName')
        unit_qty = product_elem.find('UnitQty')
        
        if not (item_name and item_name.text and item_price and item_price.text):
            return None
        
        product = {
            'name': item_name.text.strip(),
            'price': float(item_price.text),
            'unit_price': float(unit_price.text) if unit_price and unit_price.text else float(item_price.text),
            'vendor': 'Victory',
            'category': 'Meat',
            'unit': unit_qty.text.strip() if unit_qty and unit_qty.text else 'kg',
            'source': 'government_catalog_xml',
            'extracted_at': datetime.now().isoformat(),
            'item_code': item_code.text if item_code and item_code.text else '',
            'manufacturer': manufacturer.text.strip() if manufacturer and manufacturer.text else ''
        }
        
        return product
    
    try:
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        products_elem = root.find('Products')
        if products_elem is None:
            print("❌ No <Products> element found")
            return
        
        all_products = products_elem.findall('Product')
        print(f"📦 Total products in file: {len(all_products)}")
        
        meat_products = []
        for product_elem in all_products:
            item_name = product_elem.find('ItemName')
            if item_name is not None and item_name.text:
                name = item_name.text.strip()
                
                if is_meat_product(name):
                    print(f"🥩 Detected meat product: {name}")
                    
                    extracted = extract_product(product_elem)
                    if extracted:
                        meat_products.append(extracted)
                        print(f"   ✅ Extracted successfully: {extracted['price']}₪")
                    else:
                        print(f"   ❌ Extraction failed")
        
        print(f"\n📊 Results:")
        print(f"   🥩 Meat products found: {len(meat_products)}")
        
        if meat_products:
            print(f"\n🥩 Sample Products:")
            for i, product in enumerate(meat_products[:5]):
                print(f"   {i+1}. {product['name'][:60]}")
                print(f"      💰 {product['price']}₪/kg | 🏭 {product['manufacturer']}")
                print(f"      🔢 Code: {product['item_code']}")
        
        return meat_products
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

if __name__ == "__main__":
    products = test_single_file()