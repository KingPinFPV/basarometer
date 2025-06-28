# 📡 Basarometer V6.0 API Documentation

**Enhanced API Capabilities for 124+ Authenticated Products | Government-Verified Data | Market Leadership Platform**

---

## 🎯 API Overview

The Basarometer V6.0 API provides comprehensive access to Israel's most complete meat price intelligence platform, featuring 124+ authenticated products with government verification across 8+ retail networks.

### Key Features
- **124+ Products**: Authenticated meat database with government verification
- **Multi-Network**: 8+ Israeli retail chains with real-time price comparison
- **Government Integration**: Official Israeli data with 91.4% accuracy
- **Hebrew Excellence**: Perfect RTL support with Unicode handling
- **Performance**: Sub-120ms response times maintained at scale

### Base URL
```
Production: https://v3.basarometer.org/api
Development: http://localhost:3000/api
```

---

## 🔑 Authentication

### Admin Authentication
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@basarometer.org",
  "password": "your_secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@basarometer.org",
    "role": "admin"
  },
  "token": "jwt_token_here"
}
```

### Public Access
Most product and comparison endpoints are publicly accessible without authentication.

---

## 📦 Product Endpoints

### Get All Products
```bash
GET /api/products
```

**Enhanced Response (V6.0):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "unified_17433",
        "name": "פרגית עוף טרי שופרסל ללא עצם",
        "normalized_name": "פרגית עוף שופרסל ללא עצם",
        "category": "בשר ועוף",
        "subcategory": "",
        "networks_available": ["government", "shufersal"],
        "network_count": 2,
        "price_comparison": {
          "government": {
            "price": 32.5,
            "source": "government",
            "unit": "1kg",
            "quality_score": 50,
            "product_id": "gov_MEGA_פרגיתעוףטרילוףללאעצם_786799"
          },
          "shufersal": {
            "price": 35.9,
            "source": "shufersal",
            "unit": "1kg",
            "quality_score": 85,
            "confidence": 0.92
          }
        },
        "best_price": {
          "price": 32.5,
          "network": "government",
          "savings": 3.4,
          "savings_percentage": 9.5
        },
        "quality_metrics": {
          "average_quality_score": 67.5,
          "government_verified": true,
          "confidence_level": "high"
        }
      }
    ],
    "meta": {
      "total_products": 124,
      "government_verified": 68,
      "networks_covered": 8,
      "average_quality_score": 74.9,
      "last_updated": "2025-06-28T14:02:37Z"
    }
  }
}
```

### Get Product by ID
```bash
GET /api/products/{id}
```

### Search Products
```bash
GET /api/products/search?q={query}&category={category}&network={network}
```

**Parameters:**
- `q`: Search query (Hebrew/English supported)
- `category`: Product category filter
- `network`: Specific network filter
- `government_verified`: Boolean filter for government-verified products
- `min_quality`: Minimum quality score filter
- `max_price`: Maximum price filter

---

## 🏪 Network Endpoints

### Get All Networks
```bash
GET /api/networks
```

**Enhanced Response (V6.0):**
```json
{
  "success": true,
  "data": {
    "networks": [
      {
        "id": "government",
        "name": "Israeli Government Data",
        "hebrew_name": "נתוני ממשלה",
        "type": "official",
        "product_count": 68,
        "quality_score": 74.9,
        "verified": true,
        "coverage": "national",
        "last_updated": "2025-06-28T14:02:23Z"
      },
      {
        "id": "rami-levy",
        "name": "Rami Levy",
        "hebrew_name": "רמי לוי",
        "type": "supermarket_chain",
        "product_count": 39,
        "quality_score": 73.2,
        "verified": false,
        "coverage": "national",
        "last_updated": "2025-06-28T11:23:32Z"
      }
    ],
    "meta": {
      "total_networks": 8,
      "government_integrated": true,
      "coverage_percentage": 95.2
    }
  }
}
```

### Get Network Details
```bash
GET /api/networks/{network_id}
```

---

## 💰 Price Comparison Endpoints

### Compare Prices
```bash
GET /api/compare?product={product_id}
```

**Enhanced Response (V6.0):**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "unified_12345",
      "name": "אנטריקוט אנגוס טרי",
      "category": "בשר בקר"
    },
    "price_comparison": {
      "government": {
        "price": 89.90,
        "quality_score": 78,
        "verified": true
      },
      "victory": {
        "price": 79.90,
        "quality_score": 85,
        "verified": false
      },
      "shufersal": {
        "price": 94.50,
        "quality_score": 82,
        "verified": false
      }
    },
    "savings_analysis": {
      "best_price": {
        "network": "victory",
        "price": 79.90
      },
      "potential_savings": 14.60,
      "savings_percentage": 15.4,
      "annual_savings_estimate": 175.20
    },
    "quality_assessment": {
      "government_baseline": 78,
      "average_across_networks": 81.7,
      "confidence_level": "high"
    }
  }
}
```

### Bulk Price Comparison
```bash
POST /api/compare/bulk
Content-Type: application/json

{
  "product_ids": ["unified_12345", "unified_67890"],
  "networks": ["government", "victory", "shufersal"]
}
```

---

## 📊 Analytics Endpoints

### Market Analytics
```bash
GET /api/analytics/market
```

**Enhanced Response (V6.0):**
```json
{
  "success": true,
  "data": {
    "market_overview": {
      "total_products": 124,
      "government_verified": 68,
      "networks_monitored": 8,
      "average_savings_opportunity": 17.6,
      "total_consumer_savings_potential": 5000
    },
    "network_performance": [
      {
        "network": "victory",
        "cheapest_products": 42,
        "average_quality": 85.2,
        "market_share": 18.5
      },
      {
        "network": "government",
        "cheapest_products": 25,
        "average_quality": 74.9,
        "market_share": 54.8
      }
    ],
    "category_analysis": {
      "בשר בקר": {
        "product_count": 45,
        "average_price_range": "79.90-149.90",
        "best_value_network": "victory"
      },
      "בשר ועוף": {
        "product_count": 38,
        "average_price_range": "29.90-59.90",
        "best_value_network": "rami-levy"
      }
    }
  }
}
```

### Savings Report
```bash
GET /api/analytics/savings?period={period}&network={network}
```

### Quality Metrics
```bash
GET /api/analytics/quality
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_quality": {
      "average_score": 74.9,
      "government_verified_percentage": 54.8,
      "accuracy_rate": 91.4
    },
    "network_quality": {
      "government": 74.9,
      "victory": 85.2,
      "shufersal": 82.1
    },
    "category_quality": {
      "בשר בקר": 78.3,
      "בשר ועוף": 72.1,
      "בשר כבש": 76.8
    }
  }
}
```

---

## 🔍 Search Endpoints

### Advanced Search
```bash
GET /api/search?q={query}&filters={filters}
```

**Parameters:**
- `q`: Search query (supports Hebrew RTL)
- `filters`: JSON object with filter criteria
- `sort`: Sort criteria (price, quality, name)
- `limit`: Results limit (default: 50, max: 100)
- `offset`: Pagination offset

**Example with filters:**
```bash
GET /api/search?q=אנטריקוט&filters={"government_verified":true,"max_price":100,"min_quality":75}
```

### Category Search
```bash
GET /api/search/categories/{category}?network={network}&sort={sort}
```

### Auto-complete
```bash
GET /api/search/autocomplete?q={partial_query}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "אנטריקוט אנגוס",
      "אנטריקוט טרי",
      "אנטריקוט קפוא"
    ],
    "categories": [
      "בשר בקר",
      "בשר עגל"
    ]
  }
}
```

---

## 🏛️ Government Data Endpoints

### Government Products
```bash
GET /api/government/products
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "gov_MEGA_פרגיתעוףטרילוףללאעצם_786799",
        "name": "פרגית עוף טרי לוף ללא עצם",
        "category": "בשר ועוף",
        "price": 32.5,
        "unit": "1kg",
        "source_network": "MEGA",
        "quality_score": 50,
        "verified": true,
        "extraction_date": "2025-06-28T14:02:05Z"
      }
    ],
    "meta": {
      "total_government_products": 68,
      "data_sources": 120,
      "accuracy_rate": 91.4,
      "last_extraction": "2025-06-28T14:02:05Z"
    }
  }
}
```

### Government Quality Metrics
```bash
GET /api/government/quality
```

### Government Coverage
```bash
GET /api/government/coverage
```

---

## 📱 Mobile Optimization Endpoints

### Mobile Product List
```bash
GET /api/mobile/products?limit={limit}&category={category}
```

### Mobile Quick Compare
```bash
GET /api/mobile/quick-compare/{product_id}
```

### Mobile Savings Summary
```bash
GET /api/mobile/savings-summary
```

---

## 🔧 Admin Endpoints

### System Status
```bash
GET /api/admin/status
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "system_health": {
      "status": "healthy",
      "uptime": "99.9%",
      "avg_response_time": "118ms"
    },
    "database": {
      "total_products": 124,
      "government_verified": 68,
      "last_update": "2025-06-28T14:02:37Z"
    },
    "extraction_system": {
      "dual_track_operational": true,
      "government_integration": "active",
      "network_coverage": 8,
      "quality_score": 74.9
    }
  }
}
```

### Manual Extraction Trigger
```bash
POST /api/admin/extract
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "networks": ["government", "victory"],
  "force_refresh": true
}
```

### Quality Report
```bash
GET /api/admin/quality-report
Authorization: Bearer {jwt_token}
```

---

## 📈 Performance Specifications

### Response Times
- **Product Queries**: <120ms average
- **Search Operations**: <200ms average
- **Complex Analytics**: <500ms average
- **Bulk Operations**: <1000ms average

### Rate Limits
- **Public Endpoints**: 1000 requests/hour per IP
- **Authenticated Users**: 5000 requests/hour
- **Admin Endpoints**: 10000 requests/hour

### Data Freshness
- **Government Data**: Updated daily at 6:00 AM IST
- **Retail Networks**: Updated every 4-6 hours
- **Price Comparisons**: Real-time calculation
- **Analytics**: Updated every hour

---

## 🌐 Hebrew & Internationalization

### Hebrew RTL Support
All text fields support Hebrew with proper RTL rendering:
```json
{
  "name": "אנטריקוט אנגוס טרי",
  "category": "בשר בקר",
  "description": "נתח אנטריקוט מבקר אנגוס איכות פרימיום"
}
```

### Language Headers
```bash
Accept-Language: he-IL,he;q=0.9,en;q=0.8
```

### Unicode Handling
Full Unicode support for Hebrew characters, including:
- Niqqud (vowel marks)
- Special Hebrew punctuation
- Mixed Hebrew-English text
- Numeric formatting (Hebrew numerals)

---

## 🔐 Security

### HTTPS Only
All API endpoints require HTTPS in production.

### CORS Configuration
```
Access-Control-Allow-Origin: https://v3.basarometer.org
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Data Privacy
- No personal data stored without consent
- GDPR compliant data handling
- Price data anonymized across networks
- Secure token-based authentication

---

## 📊 Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "המוצר המבוקש לא נמצא",
    "details": {
      "product_id": "invalid_id",
      "suggested_products": ["similar_id_1", "similar_id_2"]
    }
  }
}
```

### Common Error Codes
- `PRODUCT_NOT_FOUND`: Product doesn't exist
- `NETWORK_UNAVAILABLE`: Network temporarily unavailable
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `GOVERNMENT_DATA_UNAVAILABLE`: Government service temporarily down
- `INVALID_SEARCH_QUERY`: Search parameters invalid

---

## 🚀 SDK and Integration

### JavaScript SDK
```javascript
import BasarometerAPI from '@basarometer/api-client';

const api = new BasarometerAPI({
  baseURL: 'https://v3.basarometer.org/api',
  apiKey: 'your_api_key' // for authenticated requests
});

// Get all products
const products = await api.products.getAll();

// Search with Hebrew
const results = await api.search('אנטריקוט אנגוס');

// Compare prices
const comparison = await api.compare.product('unified_12345');
```

### Python SDK
```python
from basarometer import BasarometerAPI

api = BasarometerAPI(
    base_url='https://v3.basarometer.org/api',
    api_key='your_api_key'
)

# Get products with government verification
products = api.products.get_all(government_verified=True)

# Hebrew search
results = api.search('אנטריקוט אנגוס')
```

---

## 📞 Support

### API Support
- **Documentation**: [https://v3.basarometer.org/api/docs](https://v3.basarometer.org/api/docs)
- **Status Page**: [https://status.basarometer.org](https://status.basarometer.org)
- **GitHub Issues**: [https://github.com/KingPinFPV/basarometer/issues](https://github.com/KingPinFPV/basarometer/issues)

### Rate Limit Support
Contact support for higher rate limits or enterprise API access.

### Integration Support
Free integration support available for legitimate applications serving Israeli consumers.

---

**🚀 Basarometer V6.0 API - Powering Israeli Meat Price Intelligence**

*124+ Authenticated Products | Government-Verified Quality | Market Leadership Platform*