#!/usr/bin/env python3
"""
Enhanced Government Meat Product Extractor
Uses meat_names_mapping.json for comprehensive product identification
Target: Extract 50+ meat products from government XML data
"""

import xml.etree.ElementTree as ET
import json
import glob
import re
from datetime import datetime
from typing import List, Dict, Optional, Set

class EnhancedMeatExtractor:
    def __init__(self):
        self.meat_terms = set()
        self.hebrew_terms = set()
        self.english_terms = set()
        self.load_extraction_terms()
        
        # Enhanced price patterns
        self.price_patterns = [
            r'(\d+\.?\d*)\s*₪',
            r'(\d+\.?\d*)\s*שקל',
            r'₪\s*(\d+\.?\d*)',
            r'(\d+\.?\d*)\s*NIS',
            r'price["\']?\s*[:=]\s*["\']?(\d+\.?\d*)',
            r'מחיר["\']?\s*[:=]\s*["\']?(\d+\.?\d*)',
            r'(\d+\.?\d*)\s*שח',
            r'(\d+\.\d+)',  # General decimal number
        ]
        
        # Enhanced unit patterns
        self.unit_patterns = [
            r'(\d+\.?\d*)\s*ק[״"]ג',
            r'(\d+\.?\d*)\s*kg',
            r'(\d+\.?\d*)\s*גרם',
            r'(\d+\.?\d*)\s*יח[״"]',
            r'לק[״"]ג',
            r'per\s*kg',
            r'ליחידה',
            r'100\s*ג',
            r'משקל',
        ]
    
    def load_extraction_terms(self):
        """Load processed extraction terms"""
        try:
            print("🥩 Loading enhanced extraction terms...")
            
            with open('extraction_terms.json', 'r', encoding='utf-8') as f:
                extraction_data = json.load(f)
            
            # Load all terms
            self.meat_terms = set(term.lower() for term in extraction_data.get('all_terms', []))
            self.hebrew_terms = set(term.lower() for term in extraction_data.get('hebrew_terms', []))
            self.english_terms = set(term.lower() for term in extraction_data.get('english_terms', []))
            
            print(f"✅ Loaded enhanced extraction terms:")
            print(f"   Total terms: {len(self.meat_terms)}")
            print(f"   Hebrew terms: {len(self.hebrew_terms)}")
            print(f"   English terms: {len(self.english_terms)}")
            
        except FileNotFoundError:
            print("⚠️ extraction_terms.json not found, creating basic terms")
            self.create_basic_terms()
        except Exception as e:
            print(f"❌ Error loading extraction terms: {e}")
            self.create_basic_terms()
    
    def create_basic_terms(self):
        """Create basic meat terms if extraction_terms.json not available"""
        basic_terms = [
            'בשר', 'בקר', 'עוף', 'טלה', 'כבש', 'עגל', 'חזיר',
            'meat', 'beef', 'chicken', 'lamb', 'veal', 'pork',
            'פרגית', 'שוקיים', 'כנפיים', 'חזה', 'ירך', 'צלעות',
            'אנטריקוט', 'פילה', 'סינטה', 'אסאדו', 'כתף', 'צוואר',
            'פילה מדומה', 'שייטל', 'אונטריב', 'בריסקט', 'אוסבוקו'
        ]
        
        self.meat_terms = set(term.lower() for term in basic_terms)
        self.hebrew_terms = set(term for term in self.meat_terms if any('\u0590' <= c <= '\u05FF' for c in term))
        self.english_terms = set(term for term in self.meat_terms if any('a' <= c <= 'z' for c in term))
    
    def is_meat_product_enhanced(self, text: str) -> float:
        """Enhanced meat product detection with confidence scoring"""
        if not text:
            return 0.0
        
        text_lower = text.lower().strip()
        confidence = 0.0
        
        # Direct term matching with confidence scoring
        for term in self.meat_terms:
            if len(term) < 3:  # Skip very short terms
                continue
                
            if term in text_lower:
                # Confidence based on term length and specificity
                term_confidence = min(1.0, len(term) / 10.0)
                
                # Bonus for Hebrew terms (more specific to local market)
                if any('\u0590' <= c <= '\u05FF' for c in term):
                    term_confidence *= 1.2
                
                # Bonus for longer, more specific terms
                if len(term) > 6:
                    term_confidence *= 1.3
                
                confidence = max(confidence, term_confidence)
        
        # Pattern-based matching for compound terms
        meat_patterns = [
            (r'בשר\s+\w+', 0.8),  # בשר + anything
            (r'\w+\s+בשר', 0.7),  # anything + בשר
            (r'עוף\s+\w+', 0.9),  # עוף + anything
            (r'\w+\s+עוף', 0.8),  # anything + עוף
            (r'בקר\s+\w+', 0.9),  # בקר + anything
            (r'meat\s+\w+', 0.6), # meat + anything
            (r'\w+\s+meat', 0.5), # anything + meat
            (r'טרי', 0.3),         # fresh indicator
            (r'קפוא', 0.3),        # frozen indicator
            (r'ק[״"]ג', 0.4),      # kg indicator
        ]
        
        for pattern, pattern_confidence in meat_patterns:
            if re.search(pattern, text_lower):
                confidence = max(confidence, pattern_confidence)
        
        return min(1.0, confidence)
    
    def extract_products_from_xml_enhanced(self, xml_file: str) -> List[Dict]:
        """Enhanced extraction using comprehensive meat terms"""
        products = []
        
        try:
            print(f"🔍 Enhanced processing: {xml_file}")
            
            tree = ET.parse(xml_file)
            root = tree.getroot()
            
            # Multi-strategy extraction
            strategy_results = []
            strategy_results.extend(self.extract_by_comprehensive_search(root))
            strategy_results.extend(self.extract_by_element_analysis(root))
            strategy_results.extend(self.extract_by_text_mining(root))
            strategy_results.extend(self.extract_by_price_detection(root))
            
            # Filter for meat products using enhanced detection with confidence
            for product in strategy_results:
                text_to_check = f"{product.get('name', '')} {product.get('raw_text', '')} {product.get('category', '')}"
                confidence = self.is_meat_product_enhanced(text_to_check)
                
                if confidence > 0.3:  # Threshold for meat products
                    product['meat_confidence'] = confidence
                    products.append(product)
            
            print(f"   Found {len(strategy_results)} total items, {len(products)} meat products")
            
            return products
            
        except Exception as e:
            print(f"   ❌ Error processing {xml_file}: {e}")
            return []
    
    def extract_by_comprehensive_search(self, root) -> List[Dict]:
        """Search using all meat terms with confidence scoring"""
        products = []
        
        # Priority search - start with most specific terms
        priority_terms = [term for term in self.meat_terms if len(term) > 5]
        regular_terms = [term for term in self.meat_terms if 3 <= len(term) <= 5]
        
        for term_list, priority in [(priority_terms, "high"), (regular_terms, "medium")]:
            for term in term_list:
                # Search in element text
                for element in root.iter():
                    if element.text and term in element.text.lower():
                        product = self.create_product_from_element(element, f"term_search_{term}", priority)
                        if product:
                            products.append(product)
                    
                    # Search in attributes
                    for attr_value in element.attrib.values():
                        if attr_value and term in str(attr_value).lower():
                            product = self.create_product_from_element(element, f"attr_search_{term}", priority)
                            if product:
                                products.append(product)
        
        return products
    
    def extract_by_element_analysis(self, root) -> List[Dict]:
        """Analyze XML structure for product elements"""
        products = []
        
        # Look for structured product data
        product_indicators = [
            'item', 'product', 'good', 'merchandise', 'article',
            'מוצר', 'פריט', 'דבר', 'סחורה', 'מאכל'
        ]
        
        for element in root.iter():
            tag_lower = element.tag.lower()
            
            # Check if element represents a product
            if any(indicator in tag_lower for indicator in product_indicators):
                product = self.parse_structured_element(element)
                if product:
                    products.append(product)
        
        return products
    
    def extract_by_text_mining(self, root) -> List[Dict]:
        """Mine text content for product information"""
        products = []
        
        for element in root.iter():
            if not element.text or len(element.text.strip()) < 5:
                continue
            
            text = element.text.strip()
            
            # Look for combinations of indicators
            has_price = any(re.search(pattern, text) for pattern in self.price_patterns)
            has_unit = any(re.search(pattern, text) for pattern in self.unit_patterns)
            meat_confidence = self.is_meat_product_enhanced(text)
            
            # Multiple criteria for product detection
            score = 0
            if has_price: score += 2
            if has_unit: score += 1
            if meat_confidence > 0.5: score += 3
            if len(text) > 10: score += 1
            
            if score >= 3:  # Threshold for considering as product
                product = self.parse_text_for_product(text, element, meat_confidence)
                if product:
                    products.append(product)
        
        return products
    
    def extract_by_price_detection(self, root) -> List[Dict]:
        """Find products by detecting price patterns"""
        products = []
        
        for element in root.iter():
            element_text = element.text or ''
            
            # Check text and attributes for prices
            all_text = element_text + ' ' + ' '.join(element.attrib.values())
            
            for pattern in self.price_patterns:
                if re.search(pattern, all_text):
                    # Found price, check if context suggests meat
                    meat_confidence = self.is_meat_product_enhanced(all_text)
                    if meat_confidence > 0.2:
                        product = self.create_product_from_price_context(element, all_text, meat_confidence)
                        if product:
                            products.append(product)
                    break
        
        return products
    
    def create_product_from_element(self, element, search_method: str, priority: str = "medium") -> Optional[Dict]:
        """Create product from XML element with enhanced data extraction"""
        try:
            name = self.extract_name_from_element(element)
            price = self.extract_price_from_element(element)
            
            if not name or len(name.strip()) < 3:
                return None
            
            # Calculate quality score
            confidence_factors = []
            if price: confidence_factors.append(0.3)
            if len(name) > 10: confidence_factors.append(0.2)
            if priority == "high": confidence_factors.append(0.3)
            if any(keyword in name.lower() for keyword in ['טרי', 'fresh', 'אנגוס', 'וואגיו']): 
                confidence_factors.append(0.4)
            
            confidence = min(1.0, sum(confidence_factors))
            
            product = {
                'name': name.strip()[:150],
                'price': price,
                'vendor': self.extract_vendor_from_context(element),
                'category': 'בשר',
                'unit': self.extract_unit_from_text(name),
                'source': 'government_enhanced',
                'extraction_method': search_method,
                'search_priority': priority,
                'extraction_confidence': confidence,
                'extracted_at': datetime.now().isoformat(),
                'raw_text': (element.text or '')[:200],
                'raw_attributes': dict(element.attrib)
            }
            
            return product
        
        except Exception as e:
            return None
    
    def extract_name_from_element(self, element) -> str:
        """Extract product name from element with multiple strategies"""
        # Try element text first
        if element.text and element.text.strip():
            return element.text.strip()
        
        # Try common attribute names
        name_attrs = ['name', 'itemname', 'productname', 'description', 'title', 'label']
        for attr in name_attrs:
            if attr in element.attrib and element.attrib[attr].strip():
                return element.attrib[attr].strip()
        
        # Try child elements
        for child in element:
            tag_lower = child.tag.lower()
            if any(name_tag in tag_lower for name_tag in ['name', 'title', 'description']):
                if child.text and child.text.strip():
                    return child.text.strip()
        
        return ""
    
    def extract_price_from_element(self, element) -> Optional[float]:
        """Extract price from element with multiple strategies"""
        # Check element text
        if element.text:
            for pattern in self.price_patterns:
                match = re.search(pattern, element.text)
                if match:
                    try:
                        return float(match.group(1))
                    except (ValueError, IndexError):
                        continue
        
        # Check attributes
        for attr_value in element.attrib.values():
            for pattern in self.price_patterns:
                match = re.search(pattern, str(attr_value))
                if match:
                    try:
                        return float(match.group(1))
                    except (ValueError, IndexError):
                        continue
        
        # Check child elements
        for child in element:
            if child.text:
                for pattern in self.price_patterns:
                    match = re.search(pattern, child.text)
                    if match:
                        try:
                            return float(match.group(1))
                        except (ValueError, IndexError):
                            continue
        
        return None
    
    def parse_structured_element(self, element) -> Optional[Dict]:
        """Parse structured product element with enhanced extraction"""
        product = {
            'name': '',
            'price': None,
            'vendor': '',
            'category': 'בשר',
            'unit': '',
            'source': 'government_enhanced',
            'extraction_method': 'structured_parsing',
            'extracted_at': datetime.now().isoformat()
        }
        
        # Extract from attributes
        attrs = element.attrib
        product['name'] = attrs.get('name', attrs.get('itemname', attrs.get('productname', '')))
        
        # Extract price from multiple possible attributes
        price_attrs = ['price', 'unitprice', 'cost', 'amount', 'value']
        for attr in price_attrs:
            if attr in attrs and attrs[attr]:
                try:
                    price_clean = re.sub(r'[^\d.]', '', str(attrs[attr]))
                    if price_clean:
                        product['price'] = float(price_clean)
                        break
                except ValueError:
                    continue
        
        # Extract from child elements
        for child in element:
            tag_lower = child.tag.lower()
            text = child.text or ''
            
            if any(name_tag in tag_lower for name_tag in ['name', 'title', 'description']) and not product['name']:
                product['name'] = text
            elif any(price_tag in tag_lower for price_tag in ['price', 'cost', 'amount']) and not product['price']:
                try:
                    price_clean = re.sub(r'[^\d.]', '', text)
                    if price_clean:
                        product['price'] = float(price_clean)
                except ValueError:
                    pass
            elif any(vendor_tag in tag_lower for vendor_tag in ['vendor', 'chain', 'store']):
                product['vendor'] = text
        
        # Validate product has minimum required data
        if product['name'] and len(product['name'].strip()) > 3:
            return product
        
        return None
    
    def parse_text_for_product(self, text: str, element, meat_confidence: float) -> Optional[Dict]:
        """Parse product information from text with enhanced extraction"""
        # Extract price
        price = None
        for pattern in self.price_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    price = float(match.group(1))
                    break
                except (ValueError, IndexError):
                    continue
        
        # Extract name (clean version of text)
        name = text
        if price:
            # Remove price from name
            for pattern in self.price_patterns:
                name = re.sub(pattern, '', name).strip()
        
        # Clean name
        name = re.sub(r'\s+', ' ', name).strip()
        name = re.sub(r'[^\w\u0590-\u05FF\s\-\(\)]', ' ', name).strip()  # Keep Hebrew, English, spaces, hyphens, parentheses
        
        if len(name) > 3:
            return {
                'name': name[:150],
                'price': price,
                'vendor': self.extract_vendor_from_context(element),
                'category': 'בשר',
                'unit': self.extract_unit_from_text(text),
                'source': 'government_enhanced',
                'extraction_method': 'text_mining',
                'meat_confidence': meat_confidence,
                'extracted_at': datetime.now().isoformat(),
                'raw_text': text[:200]
            }
        
        return None
    
    def create_product_from_price_context(self, element, text: str, meat_confidence: float) -> Optional[Dict]:
        """Create product from price detection context"""
        price_match = None
        for pattern in self.price_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    price_match = float(match.group(1))
                    break
                except (ValueError, IndexError):
                    continue
        
        if not price_match:
            return None
        
        # Extract name from context
        name = text
        for pattern in self.price_patterns:
            name = re.sub(pattern, '', name).strip()
        
        name = re.sub(r'\s+', ' ', name).strip()
        
        if len(name) > 3:
            return {
                'name': name[:150],
                'price': price_match,
                'vendor': self.extract_vendor_from_context(element),
                'category': 'בשר',
                'unit': self.extract_unit_from_text(text),
                'source': 'government_enhanced',
                'extraction_method': 'price_detection',
                'meat_confidence': meat_confidence,
                'extracted_at': datetime.now().isoformat(),
                'raw_text': text[:200]
            }
        
        return None
    
    def extract_vendor_from_context(self, element) -> str:
        """Extract vendor from XML context"""
        # Look up the tree for vendor information
        current = element
        for _ in range(5):  # Look up to 5 levels
            if current is None:
                break
                
            if hasattr(current, 'attrib') and current.attrib:
                for attr_name, attr_value in current.attrib.items():
                    if any(keyword in attr_name.lower() for keyword in ['chain', 'store', 'vendor', 'retailer', 'shop']):
                        return str(attr_value)
            
            current = getattr(current, 'getparent', lambda: None)()
        
        return 'Unknown'
    
    def extract_unit_from_text(self, text: str) -> str:
        """Extract unit from text with enhanced patterns"""
        for pattern in self.unit_patterns:
            if re.search(pattern, text):
                if 'ק' in pattern or 'kg' in pattern:
                    return 'ק"ג'
                elif 'גרם' in pattern:
                    return 'גרם'
                elif 'יח' in pattern:
                    return 'יחידה'
        return ''
    
    def deduplicate_products(self, products: List[Dict]) -> List[Dict]:
        """Remove duplicate products with enhanced logic"""
        seen = set()
        unique_products = []
        
        for product in products:
            # Create sophisticated key for deduplication
            name = product.get('name', '').lower().strip()
            price = product.get('price', 0) or 0
            vendor = product.get('vendor', '').lower()
            
            # Normalize name for better deduplication
            name_normalized = re.sub(r'\s+', ' ', name)
            name_normalized = re.sub(r'[^\w\u0590-\u05FF\s]', '', name_normalized)
            
            # Create multiple keys to catch variations
            key1 = f"{name_normalized[:30]}-{price}"
            key2 = f"{name_normalized[:20]}-{vendor}"
            key3 = f"{name_normalized.split()[0] if name_normalized.split() else ''}-{price}"
            
            if not any(key in seen for key in [key1, key2, key3]) and len(name) > 3:
                seen.update([key1, key2, key3])
                unique_products.append(product)
        
        return unique_products
    
    def process_all_xml_files(self) -> List[Dict]:
        """Process all XML files with enhanced extraction"""
        print("🏛️ Enhanced Government Meat Product Extraction")
        print("=" * 60)
        
        # Find XML files in multiple locations
        xml_files = []
        search_patterns = [
            "*.xml",
            "government_output/*.xml",
            "**/*.xml",
            "../*.xml",
            "temp/*.xml",
            "data/*.xml"
        ]
        
        for pattern in search_patterns:
            found_files = glob.glob(pattern, recursive=True)
            xml_files.extend(found_files)
        
        xml_files = list(set(xml_files))  # Remove duplicates
        
        if not xml_files:
            print("❌ No XML files found!")
            print("   Searched patterns:", search_patterns)
            return []
        
        print(f"📁 Processing {len(xml_files)} XML files with {len(self.meat_terms)} meat terms")
        print(f"   Files found: {[f.split('/')[-1] for f in xml_files[:5]]}")
        
        all_products = []
        
        for xml_file in xml_files:
            products = self.extract_products_from_xml_enhanced(xml_file)
            all_products.extend(products)
        
        # Deduplicate with enhanced logic
        unique_products = self.deduplicate_products(all_products)
        
        # Sort by confidence for quality assessment
        unique_products.sort(key=lambda x: x.get('extraction_confidence', 0), reverse=True)
        
        print(f"\n📊 Enhanced Extraction Results:")
        print(f"   Raw extractions: {len(all_products)}")
        print(f"   Unique meat products: {len(unique_products)}")
        print(f"   Target achievement: {len(unique_products)}/50+ products")
        print(f"   Average confidence: {sum(p.get('extraction_confidence', 0) for p in unique_products) / len(unique_products):.2f}" if unique_products else "   No products extracted")
        
        # Quality breakdown
        high_quality = [p for p in unique_products if p.get('extraction_confidence', 0) > 0.7]
        medium_quality = [p for p in unique_products if 0.4 <= p.get('extraction_confidence', 0) <= 0.7]
        
        print(f"   High quality products: {len(high_quality)}")
        print(f"   Medium quality products: {len(medium_quality)}")
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"enhanced_government_products_{timestamp}.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(unique_products, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"   Results saved: {output_file}")
        
        if unique_products:
            print(f"\n🥩 Sample Enhanced Products (Top 5 by confidence):")
            for i, product in enumerate(unique_products[:5]):
                method = product.get('extraction_method', 'unknown')
                confidence = product.get('extraction_confidence', 0)
                price = product.get('price', 'N/A')
                print(f"   {i+1}. {product['name'][:60]} - {price}₪ ({method}, conf: {confidence:.2f})")
        
        # Success assessment
        if len(unique_products) >= 30:
            print(f"\n🎉 SUCCESS: {len(unique_products)} products extracted!")
            print(f"🚀 Ready for integration with 39 web products")
            print(f"📊 Total projected: {39 + len(unique_products)} products")
        elif len(unique_products) >= 15:
            print(f"\n⚠️ PARTIAL SUCCESS: {len(unique_products)} products")
            print(f"💡 Good foundation, consider expanding search criteria")
        else:
            print(f"\n❌ LIMITED SUCCESS: {len(unique_products)} products")
            print(f"💡 Review XML structure or add more data sources")
        
        return unique_products

# Run enhanced extraction
if __name__ == "__main__":
    extractor = EnhancedMeatExtractor()
    products = extractor.process_all_xml_files()
    
    print(f"\n🎯 Enhanced Extraction Complete!")
    print(f"📦 Products ready for website integration: {len(products)}")