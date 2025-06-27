#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enhanced Government Meat Extractor V6.0
Basarometer - Israeli Meat Price Intelligence Platform

Uses the comprehensive 39KB meat_names_mapping.json for maximum extraction capability
Target: 100-150 high-quality meat products from government data sources
"""

import json
import re
import os
import glob
import xml.etree.ElementTree as ET
from datetime import datetime
from difflib import SequenceMatcher
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedGovernmentMeatExtractorV6:
    def __init__(self):
        """Initialize enhanced extractor with comprehensive meat mapping"""
        self.load_meat_mapping()
        self.initialize_extraction_patterns()
        self.quality_threshold = 70
        self.statistics = {
            'files_processed': 0,
            'products_found': 0,
            'meat_products_identified': 0,
            'high_quality_products': 0
        }
        
    def load_meat_mapping(self):
        """Load the comprehensive 39KB meat names mapping"""
        try:
            mapping_path = 'config/meat_names_mapping.json'
            if not os.path.exists(mapping_path):
                mapping_path = 'meat_names_mapping.json'
            
            with open(mapping_path, 'r', encoding='utf-8') as f:
                self.meat_mapping = json.load(f)
            
            logger.info(f"Loaded meat mapping with {len(self.meat_mapping)} categories")
            
            # Create enhanced lookup structures
            self.hebrew_meat_terms = set()
            self.english_meat_terms = set()
            self.category_keywords = {}
            
            for category, variations in self.meat_mapping.items():
                # Add category name
                self.hebrew_meat_terms.add(category.lower())
                
                # Process all variations
                for variation in variations:
                    variation_clean = self._clean_text(variation)
                    self.hebrew_meat_terms.add(variation_clean)
                    
                    # Extract English terms
                    english_words = re.findall(r'[a-zA-Z]+', variation)
                    for word in english_words:
                        if len(word) > 2:
                            self.english_meat_terms.add(word.lower())
                
                # Create category-specific keywords
                self.category_keywords[category] = [self._clean_text(v) for v in variations[:10]]
            
            logger.info(f"Extracted {len(self.hebrew_meat_terms)} Hebrew terms, {len(self.english_meat_terms)} English terms")
            
        except Exception as e:
            logger.error(f"Failed to load meat mapping: {e}")
            self.meat_mapping = {}
            self.hebrew_meat_terms = set()
            self.english_meat_terms = set()
            self.category_keywords = {}
    
    def _clean_text(self, text):
        """Clean and normalize text for matching"""
        if not text:
            return ""
        
        # Remove common noise
        text = re.sub(r'[\(\)\[\]״"\'\"]+', ' ', text)
        text = re.sub(r'\d+\s*[גק][\"\']?[גמל]?', ' ', text)  # Remove weights
        text = re.sub(r'טרי|מקורי|אמיתי|מובחר|פרימיום', ' ', text)  # Remove quality indicators
        text = re.sub(r'\s+', ' ', text).strip().lower()
        
        return text
    
    def initialize_extraction_patterns(self):
        """Initialize extraction patterns for government data"""
        
        # Basic meat categories with Hebrew/English variations
        self.base_categories = {
            'chicken': ['עוף', 'פרגית', 'תרנגולת', 'chicken', 'פרפר'],
            'beef': ['בקר', 'עגל', 'פרה', 'beef', 'אנגוס', 'וואגיו'],
            'lamb': ['כבש', 'טלה', 'lamb', 'sheep'],
            'turkey': ['הודו', 'turkey', 'תרנגול הודו'],
            'processed': ['נקניק', 'קבב', 'המבורגר', 'קציצה', 'מעושן'],
            'offal': ['כבד', 'לב', 'מוח', 'לשון', 'liver', 'heart']
        }
        
        # Quality indicators
        self.quality_indicators = {
            'premium': ['אנגוס', 'וואגיו', 'פרימיום', 'מובחר', 'איכות גבוהה'],
            'standard': ['טרי', 'רגיל', 'סטנדרט'],
            'processed': ['מעושן', 'מתובל', 'קפוא', 'מוכן']
        }
        
        # Price patterns
        self.price_patterns = [
            r'(\d+(?:\.\d+)?)\s*₪',
            r'(\d+(?:\.\d+)?)\s*שקל',
            r'מחיר[:\s]*(\d+(?:\.\d+)?)',
            r'עולה[:\s]*(\d+(?:\.\d+)?)',
            r'(\d+(?:\.\d+)?)\s*ש[״\"]?ח'
        ]
        
        # Weight/unit patterns
        self.unit_patterns = [
            r'(\d+(?:\.\d+)?)\s*ק[״\"]?ג',
            r'(\d+(?:\.\d+)?)\s*גר[״\']?ם?',
            r'(\d+(?:\.\d+)?)\s*מ[״\"]?ל',
            r'יח[״\']?ידה?',
            r'חבילה?',
            r'מארז'
        ]
    
    def enhanced_meat_classification(self, product_name, product_description="", price=None):
        """Enhanced meat classification using comprehensive mapping"""
        
        full_text = f"{product_name} {product_description}".lower()
        classification_result = {
            'is_meat': False,
            'meat_score': 0,
            'quality_score': 0,
            'category': 'unknown',
            'subcategory': None,
            'quality_grade': 'standard',
            'matched_terms': [],
            'confidence': 0.0,
            'extraction_metadata': {}
        }
        
        # Score based on meat mapping matches
        meat_score = 0
        matched_terms = []
        
        # Check against comprehensive meat mapping
        for category, variations in self.meat_mapping.items():
            category_score = 0
            category_matches = []
            
            # Check category name
            if self._clean_text(category) in full_text:
                category_score += 15
                category_matches.append(category)
            
            # Check variations
            for variation in variations:
                variation_clean = self._clean_text(variation)
                if variation_clean and variation_clean in full_text:
                    category_score += 10
                    category_matches.append(variation[:30])  # Limit length
                elif variation_clean and self._similarity_match(variation_clean, full_text):
                    category_score += 7
                    category_matches.append(f"~{variation[:25]}")
            
            if category_score > meat_score:
                meat_score = category_score
                classification_result['category'] = self._extract_main_category(category)
                classification_result['subcategory'] = category
                matched_terms = category_matches[:5]  # Top 5 matches
        
        # Additional scoring from base categories
        for main_cat, keywords in self.base_categories.items():
            for keyword in keywords:
                if keyword in full_text:
                    meat_score += 8
                    if classification_result['category'] == 'unknown':
                        classification_result['category'] = main_cat
        
        # Quality grade detection
        quality_grade = 'standard'
        quality_bonus = 0
        
        for grade, indicators in self.quality_indicators.items():
            for indicator in indicators:
                if indicator in full_text:
                    quality_grade = grade
                    quality_bonus = 10 if grade == 'premium' else 5
                    break
        
        # Price validation
        price_score = 0
        if price:
            price_score = self._validate_price_range(price, classification_result['category'])
        
        # Calculate final scores
        classification_result['meat_score'] = meat_score
        classification_result['quality_grade'] = quality_grade
        classification_result['matched_terms'] = matched_terms
        
        # Quality factors scoring
        quality_factors = {
            'meat_indicators': min(meat_score / 50, 1.0) * 40,  # Max 40 points
            'name_quality': self._score_name_quality(product_name) * 20,  # Max 20 points
            'price_realistic': price_score * 15,  # Max 15 points
            'quality_grade': quality_bonus,  # Max 10 points
            'text_completeness': min(len(full_text) / 50, 1.0) * 10,  # Max 10 points
            'hebrew_content': (5 if any(ord(c) > 127 for c in product_name) else 0)  # Max 5 points
        }
        
        final_quality_score = sum(quality_factors.values())
        
        # Determine if it's meat
        classification_result['is_meat'] = meat_score >= 15
        classification_result['quality_score'] = final_quality_score
        classification_result['confidence'] = min(final_quality_score / 100, 1.0)
        classification_result['extraction_metadata'] = quality_factors
        
        return classification_result
    
    def _extract_main_category(self, subcategory):
        """Extract main meat category from subcategory"""
        mapping = {
            'עוף': 'chicken',
            'הודו': 'turkey', 
            'בקר': 'beef',
            'עגל': 'beef',
            'כבש': 'lamb',
            'טלה': 'lamb',
            'חזיר': 'pork',
            'אווז': 'duck',
            'סלמון': 'fish'
        }
        
        for key, value in mapping.items():
            if key in subcategory:
                return value
        
        # Default category detection
        if any(term in subcategory for term in ['פרגית', 'עוף']):
            return 'chicken'
        elif any(term in subcategory for term in ['בקר', 'עגל', 'אנטריקוט', 'פילה']):
            return 'beef'
        elif any(term in subcategory for term in ['כבש', 'טלה']):
            return 'lamb'
        
        return 'unknown'
    
    def _similarity_match(self, term, text, threshold=0.8):
        """Check similarity match for fuzzy matching"""
        words = text.split()
        for word in words:
            if len(word) >= len(term) * 0.7:
                similarity = SequenceMatcher(None, term, word).ratio()
                if similarity >= threshold:
                    return True
        return False
    
    def _score_name_quality(self, name):
        """Score the quality of product name"""
        if not name:
            return 0
        
        score = 0
        
        # Length scoring
        if 10 <= len(name) <= 80:
            score += 0.3
        elif 5 <= len(name) < 10:
            score += 0.2
        
        # Hebrew content
        if any(ord(c) > 127 for c in name):
            score += 0.2
        
        # No excessive special characters
        special_chars = len(re.findall(r'[^\w\s\u0590-\u05FF]', name))
        if special_chars <= 3:
            score += 0.2
        
        # Contains meaningful words
        words = name.split()
        if len(words) >= 2:
            score += 0.3
        
        return min(score, 1.0)
    
    def _validate_price_range(self, price, category):
        """Validate if price is in reasonable range for meat category"""
        try:
            price_float = float(price)
            
            # Price ranges for different categories (per kg)
            price_ranges = {
                'chicken': (15, 120),
                'beef': (40, 300),
                'lamb': (60, 250),
                'turkey': (20, 100),
                'processed': (25, 150),
                'fish': (30, 200)
            }
            
            min_price, max_price = price_ranges.get(category, (10, 400))
            
            if min_price <= price_float <= max_price:
                return 1.0
            elif price_float < min_price * 2 and price_float > min_price * 0.5:
                return 0.7
            else:
                return 0.3
                
        except:
            return 0.5
    
    def process_government_xml_files(self, data_directory='dumps'):
        """Process government XML files for meat products"""
        xml_files = []
        
        # Find XML files in multiple locations
        search_dirs = [
            data_directory,
            'hybrid-integration/scrapers-data',
            'hybrid-integration/scrapers-data/VICTORY/Victory',
            'dumps/RamiLevy',
            'temp/government-data/dumps'
        ]
        
        for search_dir in search_dirs:
            if os.path.exists(search_dir):
                for pattern in ['**/*Price*.xml', '**/*price*.xml', '**/*.xml']:
                    xml_files.extend(glob.glob(os.path.join(search_dir, pattern), recursive=True))
        
        # Filter out promo files that are empty
        price_files = [f for f in xml_files if 'Price' in f or 'price' in f]
        if price_files:
            xml_files = price_files
        
        if not xml_files:
            logger.warning(f"No XML files found in search directories")
            return []
        
        logger.info(f"Found {len(xml_files)} XML files to process")
        
        all_products = []
        
        for xml_file in xml_files:
            try:
                products = self._extract_from_xml(xml_file)
                all_products.extend(products)
                self.statistics['files_processed'] += 1
                logger.info(f"Processed {xml_file}: {len(products)} products")
                
            except Exception as e:
                logger.error(f"Error processing {xml_file}: {e}")
        
        return all_products
    
    def _extract_from_xml(self, xml_file):
        """Extract products from government XML file"""
        products = []
        
        try:
            tree = ET.parse(xml_file)
            root = tree.getroot()
            
            # Common XML structures for Israeli government data
            product_elements = (
                root.findall('.//Product') + 
                root.findall('.//Item') + 
                root.findall('.//product') +
                root.findall('.//item')
            )
            
            for element in product_elements:
                product = self._parse_xml_product(element, xml_file)
                if product:
                    products.append(product)
            
            self.statistics['products_found'] += len(products)
            
        except ET.ParseError as e:
            logger.error(f"XML parse error in {xml_file}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error processing {xml_file}: {e}")
        
        return products
    
    def _parse_xml_product(self, element, source_file):
        """Parse individual product from XML element"""
        product = {
            'source': os.path.basename(source_file),
            'source_type': 'government_xml',
            'extracted_at': datetime.now().isoformat()
        }
        
        # Common field mappings for Israeli government data
        field_mappings = {
            'name': ['ItemName', 'ProductName', 'Name', 'ItemNm', 'ProdNm'],
            'price': ['ItemPrice', 'UnitOfMeasurePrice', 'Price', 'UnitPrice'],
            'description': ['ManufactureItemDescription', 'Description', 'ItemDesc', 'ProdDesc'],
            'manufacturer': ['ManufactureName', 'ManufacturerName', 'Manufacturer', 'Brand'],
            'unit': ['UnitMeasure', 'UnitQty', 'UnitOfMeasure', 'Unit'],
            'chain_id': ['ChainID', 'ChainId', 'Chain'],
            'store_id': ['StoreID', 'StoreId', 'Store'],
            'item_code': ['ItemCode', 'Code', 'ProdCode'],
            'quantity': ['Quantity', 'QtyInPackage'],
            'country': ['ManufactureCountry']
        }
        
        # Extract fields
        for field, xml_tags in field_mappings.items():
            for tag in xml_tags:
                elem = element.find(tag)
                if elem is not None and elem.text:
                    product[field] = elem.text.strip()
                    break
        
        # Must have at least a name
        if 'name' not in product or not product['name']:
            return None
        
        # Process price
        if 'price' in product:
            try:
                product['price'] = float(product['price'])
            except:
                del product['price']
        
        return product
    
    def classify_and_filter_products(self, products):
        """Classify products and filter for high-quality meat products"""
        meat_products = []
        
        for product in products:
            # Classify the product
            classification = self.enhanced_meat_classification(
                product.get('name', ''),
                product.get('description', ''),
                product.get('price')
            )
            
            # Add classification to product
            product['meat_classification'] = classification
            
            # Filter for meat products with good quality
            if classification['is_meat']:
                self.statistics['meat_products_identified'] += 1
                
                if classification['quality_score'] >= self.quality_threshold:
                    meat_products.append(product)
                    self.statistics['high_quality_products'] += 1
        
        return meat_products
    
    def save_results(self, products, output_dir='output'):
        """Save extraction results"""
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save products
        products_file = f"{output_dir}/enhanced_government_meat_products_{timestamp}.json"
        with open(products_file, 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        
        # Save statistics
        stats_file = f"{output_dir}/enhanced_extraction_stats_{timestamp}.json"
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(self.statistics, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Results saved to {products_file}")
        logger.info(f"Statistics saved to {stats_file}")
        
        return products_file, stats_file
    
    def generate_extraction_report(self, products):
        """Generate comprehensive extraction report"""
        report = {
            'extraction_summary': {
                'total_files_processed': self.statistics['files_processed'],
                'total_products_found': self.statistics['products_found'],
                'meat_products_identified': self.statistics['meat_products_identified'],
                'high_quality_products': self.statistics['high_quality_products'],
                'success_rate': (self.statistics['high_quality_products'] / max(self.statistics['products_found'], 1)) * 100
            },
            'category_breakdown': {},
            'quality_analysis': {},
            'top_products': []
        }
        
        # Category breakdown
        categories = {}
        quality_scores = []
        
        for product in products:
            classification = product.get('meat_classification', {})
            category = classification.get('category', 'unknown')
            
            if category not in categories:
                categories[category] = 0
            categories[category] += 1
            
            if 'quality_score' in classification:
                quality_scores.append(classification['quality_score'])
        
        report['category_breakdown'] = categories
        
        # Quality analysis
        if quality_scores:
            report['quality_analysis'] = {
                'average_quality_score': sum(quality_scores) / len(quality_scores),
                'min_quality_score': min(quality_scores),
                'max_quality_score': max(quality_scores),
                'products_above_80': len([s for s in quality_scores if s >= 80]),
                'products_above_90': len([s for s in quality_scores if s >= 90])
            }
        
        # Top products by quality
        sorted_products = sorted(
            products, 
            key=lambda x: x.get('meat_classification', {}).get('quality_score', 0), 
            reverse=True
        )
        
        report['top_products'] = [
            {
                'name': p.get('name', 'Unknown'),
                'category': p.get('meat_classification', {}).get('category', 'unknown'),
                'quality_score': p.get('meat_classification', {}).get('quality_score', 0),
                'confidence': p.get('meat_classification', {}).get('confidence', 0),
                'source': p.get('source', 'unknown')
            }
            for p in sorted_products[:20]
        ]
        
        return report

def main():
    """Main execution function"""
    print("🚀 Enhanced Government Meat Extractor V6.0 - Starting...")
    
    extractor = EnhancedGovernmentMeatExtractorV6()
    
    # Process government data
    print("📁 Processing government XML files...")
    raw_products = extractor.process_government_xml_files()
    
    if not raw_products:
        print("❌ No products found in government data")
        return
    
    print(f"✅ Found {len(raw_products)} raw products")
    
    # Classify and filter
    print("🧠 Classifying and filtering meat products...")
    meat_products = extractor.classify_and_filter_products(raw_products)
    
    print(f"🥩 Identified {len(meat_products)} high-quality meat products")
    
    # Save results
    print("💾 Saving results...")
    products_file, stats_file = extractor.save_results(meat_products)
    
    # Generate report
    print("📊 Generating extraction report...")
    report = extractor.generate_extraction_report(meat_products)
    
    # Print summary
    print("\n" + "="*60)
    print("🎯 ENHANCED GOVERNMENT EXTRACTION SUMMARY")
    print("="*60)
    print(f"📁 Files Processed: {report['extraction_summary']['total_files_processed']}")
    print(f"📦 Total Products Found: {report['extraction_summary']['total_products_found']}")
    print(f"🥩 Meat Products Identified: {report['extraction_summary']['meat_products_identified']}")
    print(f"⭐ High-Quality Products: {report['extraction_summary']['high_quality_products']}")
    print(f"📊 Success Rate: {report['extraction_summary']['success_rate']:.1f}%")
    
    if report['category_breakdown']:
        print(f"\n🏷️ CATEGORY BREAKDOWN:")
        for category, count in sorted(report['category_breakdown'].items(), key=lambda x: x[1], reverse=True):
            print(f"  • {category}: {count} products")
    
    if report['quality_analysis']:
        qa = report['quality_analysis']
        print(f"\n📈 QUALITY ANALYSIS:")
        print(f"  • Average Quality Score: {qa['average_quality_score']:.1f}")
        print(f"  • Products Above 80 Score: {qa['products_above_80']}")
        print(f"  • Products Above 90 Score: {qa['products_above_90']}")
    
    print(f"\n💾 Results saved to: {products_file}")
    print(f"📊 Statistics saved to: {stats_file}")
    print("\n🎉 Enhanced extraction complete!")

if __name__ == "__main__":
    main()