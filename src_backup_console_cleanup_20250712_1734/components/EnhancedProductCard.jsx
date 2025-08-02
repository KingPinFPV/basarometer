import React from 'react';

const EnhancedProductCard = ({ product, isGovernmentVerified = false }) => {
  const {
    name,
    price_per_kg,
    vendor,
    source,
    verification,
    category,
    confidence,
    id
  } = product;

  const formatPrice = (price) => {
    return typeof price === 'number' ? price.toFixed(2) : parseFloat(price || 0).toFixed(2);
  };

  const getVendorIcon = (vendorName) => {
    const vendor = vendorName?.toLowerCase() || '';
    if (vendor.includes('victory') || vendor.includes('ויקטורי')) return '🏆';
    if (vendor.includes('shufersal') || vendor.includes('שופרסל')) return '🛒';
    if (vendor.includes('rami') || vendor.includes('רמי')) return '🏪';
    if (vendor.includes('government') || vendor.includes('ממשלה')) return '🏛️';
    if (vendor.includes('mega') || vendor.includes('מגא')) return '🔷';
    if (vendor.includes('yohananof') || vendor.includes('יוחננוף')) return '🏬';
    return '🏬';
  };

  const getSourceBadge = () => {
    if (source === 'government') {
      return (
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
          🏛️ מאומת ממשלתית
        </div>
      );
    }
    if (verification === 'system_verified') {
      return (
        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
          ✅ מאומת מערכת
        </div>
      );
    }
    return null;
  };

  const getPriceColor = (price) => {
    const numPrice = parseFloat(price);
    if (numPrice < 30) return 'text-green-600';
    if (numPrice < 60) return 'text-blue-600';
    if (numPrice < 100) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 0.9) return 'text-green-600';
    if (conf >= 0.75) return 'text-blue-600';
    if (conf >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="relative bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Government/Verification Badge */}
      {getSourceBadge()}

      <div className="p-6">
        {/* Product Name */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors" title={name}>
          {name}
        </h3>

        {/* Category */}
        {category && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {category}
            </span>
          </div>
        )}

        {/* Price Display */}
        <div className="mb-4">
          <div className={`text-2xl font-bold ${getPriceColor(price_per_kg)}`}>
            ₪{formatPrice(price_per_kg)}
          </div>
          <div className="text-sm text-gray-500">
            לקילוגרם
          </div>
        </div>

        {/* Vendor Information */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getVendorIcon(vendor)}</span>
            <span className="text-sm font-medium text-gray-700">
              {vendor}
            </span>
          </div>
          
          {source === 'government' && (
            <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
              נתונים רשמיים
            </div>
          )}
        </div>

        {/* Confidence Score */}
        {confidence && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">דיוק נתונים</span>
              <span className={`font-medium ${getConfidenceColor(confidence)}`}>
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className={`h-1.5 rounded-full ${
                  confidence >= 0.9 ? 'bg-green-500' :
                  confidence >= 0.75 ? 'bg-blue-500' :
                  confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Product ID */}
        <div className="text-xs text-gray-500 mb-4">
          קוד מוצר: {id || 'N/A'}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            השווה מחירים
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            📊
          </button>
        </div>
      </div>

      {/* Government Verification Stripe */}
      {source === 'government' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
      )}
    </div>
  );
};

export default EnhancedProductCard;