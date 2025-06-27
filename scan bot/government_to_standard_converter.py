#!/usr/bin/env python3
"""
Government to Standard Format Converter
Converts government XML extracted products to standard format compatible with web scraper
"""

import json
import re
from datetime import datetime
from typing import List, Dict

class GovernmentToStandardConverter:
    def __init__(self):
        self.meat_type_mapping = {
            'עוף': 'Chicken',
            'בקר': 'Beef', 
            'בשר': 'Meat',
            'טלה': 'Lamb',
            'כבש': 'Lamb',
            'עגל': 'Veal'
        }
        
        self.cut_mapping = {
            'שוקיים': 'Thighs',
            'ירכיים': 'Drumsticks', 
            'חזה': 'Breast',
            'כנפיים': 'Wings',
            'לבבות': 'Hearts',
            'כבד': 'Liver',
            'קיימה': 'Ground',
            'אנטריקוט': 'Entrecote',
            'פילה': 'Fillet'
        }
        
    def convert_government_products(self, government_file: str) -> List[Dict]:
        """Convert government extracted products to standard format"""
        print("🔄 Converting Government Products to Standard Format")
        print("=" * 55)
        
        # Load government products
        with open(government_file, 'r', encoding='utf-8') as f:
            govt_products = json.load(f)
        
        print(f"📥 Loaded {len(govt_products)} government products")
        
        standard_products = []
        
        for i, govt_product in enumerate(govt_products):
            standard_product = self.convert_single_product(govt_product)
            if standard_product:
                standard_products.append(standard_product)
                print(f"✅ {i+1}. {standard_product['name']} - {standard_product['price']}₪/kg")
        
        # Save converted products
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"government_products_standard_format_{timestamp}.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(standard_products, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n💾 Converted products saved: {output_file}")
        print(f"📊 Conversion success: {len(standard_products)}/{len(govt_products)} products")
        
        return standard_products
    
    def convert_single_product(self, govt_product: Dict) -> Dict:
        """Convert single government product to standard format"""
        try:
            # Clean and parse the product name
            clean_name = self.clean_product_name(govt_product['raw_description'])
            
            # Extract meat type and cut
            meat_type = self.extract_meat_type(clean_name)
            cut_type = self.extract_cut_type(clean_name)
            
            # Determine if kosher
            is_kosher = 'מהדרין' in govt_product['raw_description']
            kosher_suffix = ' (Kosher)' if is_kosher else ''
            
            # Create standard format product
            standard_product = {
                'name': f"{meat_type} {cut_type}{kosher_suffix}".strip(),
                'price': govt_product.get('price', 0),
                'price_per_kg': self.calculate_price_per_kg(govt_product),
                'vendor': govt_product['vendor'],
                'category': 'Meat',
                'subcategory': meat_type,
                'cut': cut_type,
                'unit': 'kg',
                'source': 'government_transparency',
                'item_codes': govt_product.get('item_codes', []),
                'promotion_id': govt_product.get('promo_id', ''),
                'extracted_at': datetime.now().isoformat(),
                'raw_name': govt_product['raw_description'],
                'confidence': self.calculate_confidence(clean_name, meat_type, cut_type),
                'kosher': is_kosher,
                'quality_grade': self.extract_quality_grade(govt_product['raw_description'])
            }
            
            # Validation
            if standard_product['name'] and standard_product['price'] > 0:
                return standard_product
            
        except Exception as e:
            print(f"❌ Error converting product: {e}")
        
        return None
    
    def clean_product_name(self, raw_description: str) -> str:
        """Clean and normalize product name"""
        # Remove promotional text patterns
        clean_name = raw_description
        
        # Remove price patterns
        price_patterns = [
            r'ב\d+\.?\d*',           # ב37.90
            r'מעל\s+\d+\s+מו\d*',    # מעל 75 מו3
            r'\d+\s*גרם',            # 220 גרם
            r'\d+\s*ק[״"]ג',         # kg patterns
            r'\d+\s*יח[״"]',         # unit patterns
        ]
        
        for pattern in price_patterns:
            clean_name = re.sub(pattern, '', clean_name, flags=re.IGNORECASE)
        
        # Clean up spaces and punctuation
        clean_name = re.sub(r'\s+', ' ', clean_name).strip()
        clean_name = re.sub(r'^[-\s]+|[-\s]+$', '', clean_name)
        
        return clean_name
    
    def extract_meat_type(self, name: str) -> str:
        """Extract meat type from product name"""
        name_lower = name.lower()
        
        for hebrew, english in self.meat_type_mapping.items():
            if hebrew in name_lower:
                return english
        
        # Default fallback
        return 'Meat'
    
    def extract_cut_type(self, name: str) -> str:
        """Extract cut type from product name"""
        name_lower = name.lower()
        
        for hebrew, english in self.cut_mapping.items():
            if hebrew in name_lower:
                return english
        
        # Try to extract from remaining text
        if 'פרוסות' in name_lower:
            return 'Sliced'
        elif 'טחון' in name_lower:
            return 'Ground'
        elif 'שלם' in name_lower:
            return 'Whole'
        
        return 'Cut'
    
    def extract_quality_grade(self, description: str) -> str:
        """Extract quality grade indicators"""
        desc_lower = description.lower()
        
        if 'מהדרין' in desc_lower:
            return 'Kosher Premium'
        elif 'מחפוד' in desc_lower:
            return 'Standard'
        elif 'טרי' in desc_lower:
            return 'Fresh'
        elif 'אורגני' in desc_lower:
            return 'Organic'
        elif 'פרימיום' in desc_lower:
            return 'Premium'
        
        return 'Standard'
    
    def calculate_price_per_kg(self, govt_product: Dict) -> float:
        """Calculate price per kg"""
        price = govt_product.get('price', 0)
        
        # For promotional items, assume per-kg pricing
        # This is a simplification - in reality would need weight data
        return price
    
    def calculate_confidence(self, clean_name: str, meat_type: str, cut_type: str) -> float:
        """Calculate confidence score for the extraction"""
        confidence = 0.5  # Base confidence
        
        # Increase confidence for clear meat indicators
        if meat_type in ['Chicken', 'Beef', 'Lamb']:
            confidence += 0.2
        
        # Increase confidence for clear cut indicators  
        if cut_type in ['Thighs', 'Breast', 'Hearts', 'Ground']:
            confidence += 0.2
        
        # Increase confidence for Hebrew meat words
        hebrew_meat_words = ['עוף', 'בקר', 'בשר', 'שוקיים', 'חזה', 'לבבות']
        if any(word in clean_name.lower() for word in hebrew_meat_words):
            confidence += 0.1
        
        return min(confidence, 1.0)

def main():
    """Main execution function"""
    converter = GovernmentToStandardConverter()
    
    # Find the most recent government products file
    import glob
    govt_files = glob.glob("government_promo_meat_products_*.json")
    
    if not govt_files:
        print("❌ No government products file found!")
        print("💡 Run government_promo_meat_extractor.py first")
        return []
    
    # Use most recent file
    latest_file = max(govt_files)
    print(f"📂 Using file: {latest_file}")
    
    # Convert products
    standard_products = converter.convert_government_products(latest_file)
    
    # Show summary
    if standard_products:
        print(f"\n🎯 Conversion Summary:")
        print(f"   📦 Total products: {len(standard_products)}")
        print(f"   🥩 Product types:")
        
        # Count by type
        type_counts = {}
        for product in standard_products:
            ptype = product['subcategory']
            type_counts[ptype] = type_counts.get(ptype, 0) + 1
        
        for ptype, count in type_counts.items():
            print(f"      - {ptype}: {count}")
        
        print(f"\n🏪 Vendor: {standard_products[0]['vendor']}")
        print(f"📊 Average confidence: {sum(p['confidence'] for p in standard_products)/len(standard_products):.2f}")
        
        print(f"\n🎉 SUCCESS: Government products converted to standard format!")
        print(f"🔗 Ready for integration with web scraper products")
    
    return standard_products

if __name__ == "__main__":
    main()