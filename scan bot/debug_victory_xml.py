#!/usr/bin/env python3
"""
Debug Victory XML Structure
"""

import xml.etree.ElementTree as ET

def debug_victory_file():
    xml_file = "./hybrid-integration/scrapers-data/VICTORY/Victory/Price7290696200003-065-202506061204-001.xml"
    
    print("🔍 Debugging Victory XML Structure")
    print("=" * 50)
    
    try:
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        print(f"Root element: {root.tag}")
        print(f"Root attributes: {root.attrib}")
        
        products_elem = root.find('Products')
        if products_elem is None:
            print("❌ No <Products> element found")
            return
        
        print(f"Products element found: {products_elem.tag}")
        
        products = products_elem.findall('Product')
        print(f"Total products found: {len(products)}")
        
        # Debug first few products
        for i, product in enumerate(products[:5]):
            print(f"\n--- Product {i+1} ---")
            print(f"Product element: {product.tag}")
            print(f"Product attributes: {product.attrib}")
            
            # Check all child elements
            for child in product:
                print(f"  {child.tag}: '{child.text}' (attrib: {child.attrib})")
            
            # Specifically check for the meat product we know exists
            item_name = product.find('ItemName')
            if item_name is not None:
                name_text = item_name.text or ''
                if 'אנטריקוט' in name_text or 'סטייק' in name_text:
                    print(f"\n🥩 FOUND MEAT PRODUCT:")
                    print(f"   Name: '{name_text}'")
                    
                    item_price = product.find('ItemPrice')
                    if item_price is not None:
                        print(f"   Price: '{item_price.text}'")
                    else:
                        print(f"   Price: NOT FOUND")
                    
                    break
        
        # Look for the specific entrecote product
        print(f"\n🔍 Searching for אנטריקוט specifically...")
        for product in products:
            item_name = product.find('ItemName')
            if item_name is not None and item_name.text:
                if 'אנטריקוט' in item_name.text:
                    print(f"\n🎯 FOUND: {item_name.text}")
                    for child in product:
                        print(f"   {child.tag}: '{child.text}'")
                    break
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_victory_file()