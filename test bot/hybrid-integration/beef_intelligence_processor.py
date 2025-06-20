#!/usr/bin/env python3
"""
Basarometer 5.0 Hybrid Integration - Beef Intelligence Processor
Advanced Hebrew-aware beef product detection and processing system
Focus: Israeli beef products with superior confidence scoring
"""

import json
import pandas as pd
import re
from pathlib import Path
from typing import List, Dict, Optional, Union

class BeefIntelligenceProcessor:
    """
    Advanced processor for Israeli beef products with Hebrew language intelligence
    Designed to exceed existing Basarometer confidence standards (target: 0.85+)
    """
    
    def __init__(self):
        # Hebrew beef keywords (comprehensive coverage for Israeli market)
        self.beef_keywords = [
            # Primary beef terms
            'בקר', 'בשר בקר', 'סטייק', 'אנטריקוט', 'פילה', 'שרב',
            'המבורגר בקר', 'קציצות בקר', 'צלעות בקר', 'כתף בקר', 
            'צוואר בקר', 'בשר טחון בקר', 'רוסטביף', 'פרגית בקר', 
            'קובייה בקר', 'אסאדו', 'אנטריקוט פתוח', 'פילה מיניון',
            
            # Cuts and preparations
            'ריב איי', 'טי בון', 'פורטר האוס', 'סירלוין', 'צ\'אק רוסט',
            'בריסקט', 'קצב', 'בשר טחון', 'מטוגן', 'צלוי', 'קפוא',
            
            # Quality grades
            'אנגוס', 'וואגיו', 'עגל', 'פרמיום', 'מובחר', 'טרי',
            
            # Hebrew transliterations
            'סטייק', 'בורגר', 'גריל', 'מעושן'
        ]
        
        # Israeli price patterns (comprehensive format support)
        self.price_patterns = [
            r'(\d+\.?\d*)\s*₪',           # Standard shekel symbol
            r'(\d+\.?\d*)\s*שקל',         # Word "shekel"
            r'(\d+\.?\d*)\s*ש״ח',         # Hebrew abbreviation
            r'₪\s*(\d+\.?\d*)',           # Symbol before number
            r'(\d+\.?\d*)\s*nis',         # NIS abbreviation
            r'(\d+\.?\d*)\s*ils',         # ILS code
            r'מחיר:?\s*(\d+\.?\d*)',      # "Price:" in Hebrew
            r'(\d+\.?\d*)\s*לק[״\"\']ג',  # Per kg
            r'(\d+\.?\d*)\s*ל-?\s*100\s*גר' # Per 100g
        ]
        
        # Weight/unit patterns for per-kg calculation
        self.weight_patterns = [
            r'(\d+\.?\d*)\s*ק[״\"\']ג',          # kg
            r'(\d+\.?\d*)\s*קילו',                # kilo
            r'(\d+\.?\d*)\s*גר',                  # grams
            r'(\d+\.?\d*)\s*g',                   # g
            r'(\d+\.?\d*)\s*gram',                # gram
            r'(\d+\.?\d*)\s*kg',                  # kg
            r'(\d+)\s*x\s*(\d+\.?\d*)\s*גר',     # pack x weight
        ]
        
        # Confidence boost factors
        self.confidence_factors = {
            'hebrew_chars': 0.1,           # Hebrew text presence
            'specific_cut': 0.15,          # Specific cut mentioned
            'quality_grade': 0.1,          # Quality grade (Angus, etc.)
            'price_valid': 0.2,            # Valid price found
            'weight_unit': 0.1,            # Weight unit present
            'brand_detected': 0.05,        # Brand name detected
            'preparation_method': 0.05     # Preparation method mentioned
        }
    
    def is_beef_product(self, product_name: str) -> tuple[bool, float, list]:
        """
        Enhanced beef detection with detailed confidence scoring
        Returns: (is_beef, confidence, matched_keywords)
        """
        if not product_name:
            return False, 0.0, []
        
        product_lower = product_name.lower().strip()
        matched_keywords = []
        confidence = 0.5  # Base confidence
        
        # Check for beef keywords
        for keyword in self.beef_keywords:
            if keyword.lower() in product_lower:
                matched_keywords.append(keyword)
                
                # Weight keywords by specificity
                if keyword in ['אנטריקוט', 'פילה', 'סטייק', 'אנגוס']:
                    confidence += 0.2  # High specificity
                elif keyword in ['בשר בקר', 'המבורגר בקר']:
                    confidence += 0.15 # Medium specificity
                else:
                    confidence += 0.1  # General beef term
        
        # Additional beef indicators (English/international terms)
        beef_indicators = [
            'beef', 'steak', 'burger', 'ground beef', 'ribeye', 
            'sirloin', 'tenderloin', 'brisket', 'chuck', 'angus'
        ]
        
        for indicator in beef_indicators:
            if indicator in product_lower:
                matched_keywords.append(indicator)
                confidence += 0.1
        
        # Boost confidence if multiple indicators found
        if len(matched_keywords) > 1:
            confidence += 0.1
        
        is_beef = len(matched_keywords) > 0
        return is_beef, min(confidence, 1.0), matched_keywords
    
    def extract_price(self, price_text: Union[str, float, int]) -> Optional[float]:
        """Extract Israeli price with multiple format support"""
        if not price_text:
            return None
        
        # Handle numeric input
        if isinstance(price_text, (int, float)):
            return float(price_text) if price_text > 0 else None
        
        price_str = str(price_text).strip()
        
        for pattern in self.price_patterns:
            match = re.search(pattern, price_str)
            if match:
                try:
                    price = float(match.group(1))
                    # Validate reasonable price range (₪5 - ₪500 per item)
                    if 5.0 <= price <= 500.0:
                        return price
                except (ValueError, IndexError):
                    continue
        
        return None
    
    def extract_weight(self, text: str) -> Optional[float]:
        """Extract weight in kg for price per kg calculation"""
        if not text:
            return None
        
        text_lower = text.lower()
        
        for pattern in self.weight_patterns:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    if 'x' in pattern:  # Handle pack format
                        count = float(match.group(1))
                        weight = float(match.group(2))
                        return (count * weight) / 1000  # Convert to kg
                    else:
                        weight = float(match.group(1))
                        # Convert grams to kg
                        if 'גר' in match.group(0) or 'g' in match.group(0):
                            return weight / 1000
                        else:
                            return weight
                except (ValueError, IndexError):
                    continue
        
        return None
    
    def calculate_confidence(self, name: str, price: Optional[float], 
                           weight: Optional[float] = None, 
                           matched_keywords: List[str] = None) -> float:
        """
        Calculate confidence score using Basarometer standards
        Target: 0.85+ (exceeding current Shufersal 0.79)
        """
        confidence = 0.4  # Base confidence (lower than beef detection base)
        
        # Name quality indicators
        if name and len(name.strip()) > 3:
            confidence += 0.15
        
        # Price quality indicators  
        if price and price > 0:
            confidence += self.confidence_factors['price_valid']
        
        # Hebrew language bonus
        hebrew_chars = len([c for c in name if '\u0590' <= c <= '\u05FF'])
        if hebrew_chars > 0:
            confidence += self.confidence_factors['hebrew_chars']
        
        # Beef specificity bonus
        if matched_keywords:
            specific_cuts = ['אנטריקוט', 'פילה', 'סטייק', 'אנגוס', 'ריב איי']
            if any(cut in matched_keywords for cut in specific_cuts):
                confidence += self.confidence_factors['specific_cut']
        
        # Quality grade bonus
        quality_terms = ['אנגוס', 'וואגיו', 'פרמיום', 'מובחר', 'טרי', 'עגל']
        if any(term in name.lower() for term in quality_terms):
            confidence += self.confidence_factors['quality_grade']
        
        # Weight unit bonus
        if weight:
            confidence += self.confidence_factors['weight_unit']
        
        # Brand detection bonus (Israeli meat brands)
        israeli_brands = ['טבעול', 'רמת הגולן', 'אסם', 'שטראוס', 'תנובה']
        if any(brand in name for brand in israeli_brands):
            confidence += self.confidence_factors['brand_detected']
        
        return min(confidence, 1.0)
    
    def _parse_israeli_xml(self, xml_file_path: Path) -> List[Dict]:
        """Parse Israeli supermarket XML files with enhanced item extraction"""
        try:
            import xml.etree.ElementTree as ET
            
            tree = ET.parse(xml_file_path)
            root = tree.getroot()
            
            items = []
            
            # Look for Items container
            items_container = root.find('Items')
            if items_container is not None:
                for item_elem in items_container.findall('Item'):
                    item_data = {}
                    
                    # Extract all child elements
                    for child in item_elem:
                        item_data[child.tag] = child.text
                    
                    # Standardize field names for processing
                    if 'ItemName' in item_data:
                        item_data['name'] = item_data['ItemName']
                    if 'ItemPrice' in item_data:
                        item_data['price'] = item_data['ItemPrice']
                    if 'UnitOfMeasurePrice' in item_data:
                        item_data['unit_price'] = item_data['UnitOfMeasurePrice']
                    
                    items.append(item_data)
            
            print(f"📄 Parsed {len(items)} items from XML")
            return items
            
        except Exception as e:
            print(f"❌ Error parsing XML {xml_file_path}: {e}")
            return []
    
    def process_scraped_data(self, data_file_path: Path) -> List[Dict]:
        """
        Process scraped data focusing on beef products
        Returns list of beef products with enhanced metadata
        """
        try:
            # Load data (handle multiple formats)
            if data_file_path.suffix.lower() == '.json':
                with open(data_file_path, 'r', encoding='utf-8') as f:
                    raw_data = json.load(f)
            elif data_file_path.suffix.lower() == '.csv':
                df = pd.read_csv(data_file_path)
                raw_data = df.to_dict('records')
            elif data_file_path.suffix.lower() == '.xml':
                # Enhanced XML support for Israeli supermarket data
                raw_data = self._parse_israeli_xml(data_file_path)
            else:
                print(f"⚠️  Unsupported file format: {data_file_path.suffix}")
                return []
            
            # Handle case where raw_data is not a list
            if not isinstance(raw_data, list):
                if isinstance(raw_data, dict):
                    # Try to find products in common keys
                    for key in ['products', 'items', 'data', 'results']:
                        if key in raw_data and isinstance(raw_data[key], list):
                            raw_data = raw_data[key]
                            break
                    else:
                        raw_data = [raw_data]
                else:
                    print(f"⚠️  Unexpected data format in {data_file_path}")
                    return []
            
            beef_products = []
            processed_count = 0
            
            for item in raw_data:
                processed_count += 1
                
                # Flexible field mapping (handle various data schemas)
                name_fields = ['name', 'product_name', 'item_name', 'description', 
                              'title', 'item_desc', 'product_desc', 'ItemName']
                price_fields = ['price', 'unit_price', 'cost', 'amount', 'UnitPrice',
                               'Price', 'ItemPrice', 'price_per_unit']
                
                product_name = None
                product_price = None
                
                # Extract name
                for field in name_fields:
                    if field in item and item[field]:
                        product_name = str(item[field]).strip()
                        break
                
                # Extract price (prioritize direct numeric values from XML)
                product_price = None
                if 'ItemPrice' in item and item['ItemPrice']:
                    try:
                        product_price = float(item['ItemPrice'])
                    except (ValueError, TypeError):
                        pass
                
                if not product_price:
                    for field in price_fields:
                        if field in item and item[field]:
                            product_price = self.extract_price(item[field])
                            if product_price:
                                break
                
                # Check if beef product
                if product_name:
                    is_beef, beef_confidence, matched_keywords = self.is_beef_product(product_name)
                    
                    if is_beef:
                        # Extract weight for per-kg calculation
                        weight = self.extract_weight(product_name)
                        
                        # Calculate overall confidence
                        overall_confidence = self.calculate_confidence(
                            product_name, product_price, weight, matched_keywords
                        )
                        
                        # Calculate price per kg if possible
                        price_per_kg = None
                        if product_price and weight and weight > 0:
                            price_per_kg = round(product_price / weight, 2)
                        
                        beef_product = {
                            'name': product_name,
                            'price': product_price,
                            'weight_kg': weight,
                            'price_per_kg': price_per_kg,
                            'confidence': round(overall_confidence, 3),
                            'beef_confidence': round(beef_confidence, 3),
                            'matched_keywords': matched_keywords,
                            'source': 'israeli_scrapers',
                            'source_file': str(data_file_path.name),
                            'original_data': item,
                            'processing_metadata': {
                                'hebrew_chars_count': len([c for c in product_name if '\u0590' <= c <= '\u05FF']),
                                'has_price': product_price is not None,
                                'has_weight': weight is not None,
                                'keyword_count': len(matched_keywords)
                            }
                        }
                        beef_products.append(beef_product)
            
            print(f"📊 Processed {processed_count} items from {data_file_path.name}")
            print(f"🥩 Found {len(beef_products)} beef products")
            
            if beef_products:
                avg_confidence = sum(p['confidence'] for p in beef_products) / len(beef_products)
                high_confidence = len([p for p in beef_products if p['confidence'] >= 0.85])
                print(f"📈 Average confidence: {avg_confidence:.3f}")
                print(f"🎯 High confidence (≥0.85): {high_confidence}/{len(beef_products)}")
            
            return beef_products
            
        except Exception as e:
            print(f"❌ Error processing {data_file_path}: {e}")
            return []
    
    def filter_high_quality_products(self, products: List[Dict], 
                                   min_confidence: float = 0.75) -> List[Dict]:
        """Filter products by confidence threshold"""
        return [p for p in products if p.get('confidence', 0) >= min_confidence]
    
    def generate_quality_report(self, products: List[Dict]) -> Dict:
        """Generate quality metrics report"""
        if not products:
            return {'error': 'No products to analyze'}
        
        confidences = [p.get('confidence', 0) for p in products]
        prices = [p.get('price') for p in products if p.get('price')]
        
        report = {
            'total_products': len(products),
            'confidence_metrics': {
                'average': round(sum(confidences) / len(confidences), 3),
                'min': round(min(confidences), 3),
                'max': round(max(confidences), 3),
                'high_confidence_count': len([c for c in confidences if c >= 0.85]),
                'meets_basarometer_standard': sum(c >= 0.85 for c in confidences) / len(confidences) >= 0.5
            },
            'price_metrics': {
                'products_with_price': len(prices),
                'price_coverage': round(len(prices) / len(products), 3) if products else 0,
                'avg_price': round(sum(prices) / len(prices), 2) if prices else None,
                'price_range': [round(min(prices), 2), round(max(prices), 2)] if prices else None
            },
            'hebrew_metrics': {
                'products_with_hebrew': len([p for p in products 
                                           if p.get('processing_metadata', {}).get('hebrew_chars_count', 0) > 0]),
                'hebrew_coverage': round(len([p for p in products 
                                            if p.get('processing_metadata', {}).get('hebrew_chars_count', 0) > 0]) / len(products), 3)
            }
        }
        
        return report

def main():
    """Test the beef intelligence processor"""
    processor = BeefIntelligenceProcessor()
    
    # Test with sample Hebrew beef products
    test_products = [
        "אנטריקוט בקר טרי 300 גרם - 45.90 ₪",
        "המבורגר בקר אנגוס 500 גרם - 32.50 ₪", 
        "סטייק פילה עגל 250 גרם - 78.90 ₪",
        "בשר טחון בקר 1 ק״ג - 56.00 ₪",
        "קציצות עוף ירקות 400 גרם - 18.90 ₪"  # Non-beef for comparison
    ]
    
    print("🧠 Testing Beef Intelligence Processor")
    print("="*50)
    
    for i, product in enumerate(test_products, 1):
        is_beef, confidence, keywords = processor.is_beef_product(product)
        price = processor.extract_price(product)
        weight = processor.extract_weight(product)
        
        print(f"{i}. {product}")
        print(f"   🥩 Beef: {is_beef} | Confidence: {confidence:.3f}")
        print(f"   💰 Price: {price} ₪ | Weight: {weight} kg")
        print(f"   🔑 Keywords: {keywords}")
        print()
    
    print("✅ Beef Intelligence Processor Ready!")
    return True

if __name__ == "__main__":
    main()