#!/usr/bin/env python3
"""
Debug XML Raw Content
"""

import xml.etree.ElementTree as ET

def debug_raw_xml():
    xml_file = "./hybrid-integration/scrapers-data/VICTORY/Victory/Price7290696200003-065-202506061204-001.xml"
    
    print("🔍 Debugging XML Raw Content")
    print("=" * 50)
    
    # First check raw file content
    try:
        with open(xml_file, 'r', encoding='utf-8') as f:
            content = f.read()
            print(f"📄 File size: {len(content)} characters")
            print(f"📄 Encoding: utf-8")
            
            # Look for the entrecote product in raw content
            if 'אנטריקוט' in content:
                print("✅ Found אנטריקוט in raw content")
                
                # Extract surrounding context
                start = content.find('אנטריקוט') - 200
                end = content.find('אנטריקוט') + 200
                snippet = content[max(0, start):end]
                print(f"📝 Raw snippet around אנטריקוט:")
                print(snippet)
            else:
                print("❌ אנטריקוט not found in raw content")
                
    except Exception as e:
        print(f"❌ File read error: {e}")
        return
    
    # Try different XML parsing approaches
    print(f"\n🔧 Testing XML Parsing Approaches:")
    
    # Approach 1: Standard ET.parse
    try:
        print(f"\n1️⃣ Standard ET.parse:")
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        # Find product
        for product in root.findall('.//Product'):
            item_name = product.find('ItemName')
            if item_name is not None and item_name.text and 'אנטריקוט' in item_name.text:
                print(f"   ✅ Found via standard parse: '{item_name.text}'")
                item_price = product.find('ItemPrice')
                print(f"   Price element: {item_price}")
                print(f"   Price text: '{item_price.text if item_price is not None else 'None'}'")
                break
        else:
            print(f"   ❌ Not found via standard parse")
            
    except Exception as e:
        print(f"   ❌ Standard parse error: {e}")
    
    # Approach 2: ET.fromstring with file content
    try:
        print(f"\n2️⃣ ET.fromstring with file content:")
        with open(xml_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        root = ET.fromstring(content)
        
        # Find product
        for product in root.findall('.//Product'):
            item_name = product.find('ItemName')
            if item_name is not None and item_name.text and 'אנטריקוט' in item_name.text:
                print(f"   ✅ Found via fromstring: '{item_name.text}'")
                item_price = product.find('ItemPrice')
                print(f"   Price element: {item_price}")
                print(f"   Price text: '{item_price.text if item_price is not None else 'None'}'")
                break
        else:
            print(f"   ❌ Not found via fromstring")
            
    except Exception as e:
        print(f"   ❌ Fromstring error: {e}")
    
    # Approach 3: Check if elements have children instead of text
    try:
        print(f"\n3️⃣ Checking element children:")
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        for product in root.findall('.//Product'):
            for child in product:
                if child.tag == 'ItemName' and child.text and 'אנטריקוט' in child.text:
                    print(f"   ✅ Found ItemName: '{child.text}'")
                    
                    # Find price in same product
                    for sibling in product:
                        if sibling.tag == 'ItemPrice':
                            print(f"   📋 ItemPrice element found")
                            print(f"   📋 ItemPrice text: '{sibling.text}'")
                            print(f"   📋 ItemPrice children: {len(list(sibling))}")
                            if len(list(sibling)) > 0:
                                for grandchild in sibling:
                                    print(f"      Child: {grandchild.tag} = '{grandchild.text}'")
                            break
                    break
                    
    except Exception as e:
        print(f"   ❌ Children check error: {e}")

if __name__ == "__main__":
    debug_raw_xml()