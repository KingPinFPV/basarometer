#!/usr/bin/env python3
"""
Debug Specific Product Extraction
"""

import xml.etree.ElementTree as ET

def debug_specific_product():
    xml_file = "./hybrid-integration/scrapers-data/VICTORY/Victory/Price7290696200003-065-202506061204-001.xml"
    
    print("🔍 Debugging Specific Product Extraction")
    print("=" * 50)
    
    try:
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        products_elem = root.find('Products')
        if products_elem is None:
            print("❌ No <Products> element found")
            return
        
        # Find the specific entrecote product
        for product_elem in products_elem.findall('Product'):
            item_name = product_elem.find('ItemName')
            if item_name is not None and item_name.text and 'אנטריקוט' in item_name.text:
                print(f"🎯 Found target product: {item_name.text}")
                
                # Debug each extraction step
                item_price = product_elem.find('ItemPrice')
                unit_price = product_elem.find('UnitOfMeasurePrice')
                item_code = product_elem.find('ItemCode')
                manufacturer = product_elem.find('ManufactureName')
                unit_qty = product_elem.find('UnitQty')
                
                print(f"📋 Field Analysis:")
                print(f"   ItemName element: {item_name}")
                print(f"   ItemName text: '{item_name.text}'")
                print(f"   ItemPrice element: {item_price}")
                print(f"   ItemPrice text: '{item_price.text if item_price else None}'")
                print(f"   UnitOfMeasurePrice text: '{unit_price.text if unit_price else None}'")
                print(f"   ItemCode text: '{item_code.text if item_code else None}'")
                print(f"   ManufactureName text: '{manufacturer.text if manufacturer else None}'")
                print(f"   UnitQty text: '{unit_qty.text if unit_qty else None}'")
                
                # Test the condition that's failing
                condition1 = item_name is not None
                condition2 = item_name.text is not None if item_name else False
                condition3 = item_price is not None
                condition4 = item_price.text is not None if item_price else False
                
                print(f"\n🧪 Condition Testing:")
                print(f"   item_name exists: {condition1}")
                print(f"   item_name.text exists: {condition2}")
                print(f"   item_price exists: {condition3}")
                print(f"   item_price.text exists: {condition4}")
                
                if condition1 and condition2 and condition3 and condition4:
                    print("   ✅ All conditions passed - should extract!")
                    
                    # Try the extraction
                    try:
                        price = float(item_price.text)
                        unit_price_val = float(unit_price.text) if unit_price and unit_price.text else price
                        
                        product = {
                            'name': item_name.text.strip(),
                            'price': price,
                            'unit_price': unit_price_val,
                            'vendor': 'Victory',
                            'category': 'Meat',
                            'unit': unit_qty.text.strip() if unit_qty and unit_qty.text else 'kg',
                            'item_code': item_code.text if item_code and item_code.text else '',
                            'manufacturer': manufacturer.text.strip() if manufacturer and manufacturer.text else ''
                        }
                        
                        print(f"   ✅ Extraction successful!")
                        print(f"   Product: {product}")
                        
                    except Exception as e:
                        print(f"   ❌ Extraction error: {e}")
                else:
                    print("   ❌ Conditions failed - explaining why...")
                    if not condition1:
                        print("      - item_name element not found")
                    if not condition2:
                        print("      - item_name.text is None")
                    if not condition3:
                        print("      - item_price element not found")
                    if not condition4:
                        print("      - item_price.text is None")
                
                break
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_specific_product()