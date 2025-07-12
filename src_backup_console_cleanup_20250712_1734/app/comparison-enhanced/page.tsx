'use client';

import React, { Suspense } from 'react';
import Head from 'next/head';
import EnhancedProductsDisplay from '../../components/EnhancedProductsDisplay';

// Loading component with improved messaging
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <div className="text-xl text-gray-600 mb-2">טוען 120+ מוצרי בשר מאומתים...</div>
      <div className="text-sm text-gray-500 mb-1">כולל 89 מוצרים מאומתים ממשלתית</div>
      <div className="text-xs text-gray-400">מערכת השוואת מחירים מתקדמת V6.0</div>
    </div>
  </div>
);

export default function EnhancedComparisonPage() {
  return (
    <>
      <Head>
        <title>השוואת מחירי בשר - 120+ מוצרים מאומתים | Basarometer V6.0</title>
        <meta 
          name="description" 
          content="השוואת מחירי בשר במאסמרים הגדולים בישראל. 120+ מוצרי בשר מאומתים, כולל 89 מוצרים מאומתים ממשלתית. חיסכון עד ₪5,000 בשנה."
        />
        <meta name="keywords" content="השוואת מחירים, בשר, ישראל, מחירי בשר, קמעונאות, נתונים ממשלתיים" />
        <meta property="og:title" content="השוואת מחירי בשר - 120+ מוצרים מאומתים" />
        <meta property="og:description" content="פלטפורמה מתקדמת להשוואת מחירי בשר עם נתונים ממשלתיים מאומתים" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://v3.basarometer.org/comparison-enhanced" />
      </Head>

      <main>
        <Suspense fallback={<LoadingSpinner />}>
          <EnhancedProductsDisplay />
        </Suspense>
      </main>
    </>
  );
}