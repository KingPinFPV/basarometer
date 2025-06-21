'use client';

import React from 'react';

interface ScannerProduct {
  id: number;
  product_name: string;
  price: number;
  price_per_kg?: number;
  store_name: string;
  store_site: string;
  category: string;
  weight?: string;
  unit?: string;
  scanner_confidence: number;
  scanner_source: string;
  scan_timestamp: string;
  brand?: string;
  is_valid: boolean;
}

interface EnhancedProductCardProps {
  product: ScannerProduct;
  showConfidence?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

export default function EnhancedProductCard({
  product,
  showConfidence = true,
  showTimestamp = false,
  className = ''
}: EnhancedProductCardProps) {
  const confidenceColor = product.scanner_confidence >= 0.8 
    ? 'bg-green-100 text-green-800 border-green-200' 
    : product.scanner_confidence >= 0.6 
    ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
    : 'bg-red-100 text-red-800 border-red-200';

  const categoryEmoji = {
    'בקר': '🥩',
    'עוף': '🐔', 
    'אחר': '🍖',
    'דגים': '🐟',
    'טלה': '🐑',
    'עגל': '🐄',
    'כבש': '🐏'
  }[product.category] || '🍖';

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'זה עתה';
    if (diffInMinutes < 60) return `לפני ${diffInMinutes} דקות`;
    if (diffInMinutes < 1440) return `לפני ${Math.floor(diffInMinutes / 60)} שעות`;
    return date.toLocaleDateString('he-IL');
  };

  const qualityBadge = () => {
    if (product.scanner_confidence >= 0.9) return { text: 'איכות מעולה', color: 'bg-green-500' };
    if (product.scanner_confidence >= 0.8) return { text: 'איכות גבוהה', color: 'bg-blue-500' };
    if (product.scanner_confidence >= 0.6) return { text: 'איכות טובה', color: 'bg-yellow-500' };
    return { text: 'איכות נמוכה', color: 'bg-red-500' };
  };

  const badge = qualityBadge();

  return (
    <div className={`
      group relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm 
      hover:shadow-lg hover:border-blue-300 transition-all duration-200 
      hover:scale-[1.02] ${className}
    `} dir="rtl">
      
      {/* Top badges */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {/* Scanner badge */}
            <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-2 py-1">
              <span className="text-xs">🤖</span>
              <span className="text-xs font-medium text-blue-700">סריקה אוטומטית</span>
            </div>
            
            {/* Confidence badge */}
            {showConfidence && (
              <div className={`px-2 py-1 rounded-full text-xs font-medium border ${confidenceColor}`}>
                דיוק: {(product.scanner_confidence * 100).toFixed(0)}%
              </div>
            )}
          </div>
          
          {/* Quality indicator */}
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${badge.color}`}></div>
            <span className="text-xs text-gray-600">{badge.text}</span>
          </div>
        </div>
        
        {/* Timestamp */}
        {showTimestamp && (
          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            {formatTimestamp(product.scan_timestamp)}
          </div>
        )}
      </div>

      {/* Product details */}
      <div className="space-y-3">
        {/* Product name */}
        <div>
          <h3 className="font-semibold text-lg leading-tight text-gray-900 text-right mb-1">
            {product.product_name}
          </h3>
          {product.brand && (
            <p className="text-sm text-gray-600 text-right">
              מותג: <span className="font-medium">{product.brand}</span>
            </p>
          )}
        </div>

        {/* Price section */}
        <div className="bg-gray-50 rounded-lg p-3 text-right">
          <div className="flex items-baseline justify-end gap-2 mb-1">
            <span className="text-2xl font-bold text-green-600">
              ₪{product.price.toFixed(2)}
            </span>
            {product.weight && (
              <span className="text-sm text-gray-500">
                {product.weight} {product.unit}
              </span>
            )}
          </div>
          
          {product.price_per_kg && product.price_per_kg !== product.price && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">₪{product.price_per_kg.toFixed(2)}</span>
              <span className="mr-1">לק&quot;ג</span>
            </div>
          )}
        </div>

        {/* Store and category info */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">{categoryEmoji}</span>
            <div className="text-sm">
              <span className="font-medium text-gray-700">{product.category}</span>
              {product.scanner_source && (
                <div className="text-xs text-gray-500">
                  מקור: {product.scanner_source}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-medium text-gray-900">{product.store_name}</div>
            <div className="text-xs text-gray-500">
              {product.store_site}
            </div>
          </div>
        </div>
      </div>

      {/* Validation indicator */}
      <div className="absolute top-2 left-2">
        {product.is_valid ? (
          <div className="w-3 h-3 bg-green-500 rounded-full" title="מוצר תקין"></div>
        ) : (
          <div className="w-3 h-3 bg-red-500 rounded-full" title="מוצר לא תקין"></div>
        )}
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200 pointer-events-none"></div>
    </div>
  );
}

export { EnhancedProductCard };
export type { ScannerProduct, EnhancedProductCardProps };