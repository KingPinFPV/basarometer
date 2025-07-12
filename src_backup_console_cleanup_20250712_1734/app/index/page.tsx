import { MeatIndexDashboard } from '@/components/index/MeatIndexDashboard'

// Force dynamic rendering for meat index page (complex calculations)
export const dynamic = 'force-dynamic'

export default function IndexPage() {
  return <MeatIndexDashboard />
}

export const metadata = {
  title: 'מדד הבשר הישראלי | בסרומטר',
  description: 'מעקב אחר מחירי הבשר והמגמות הכלכליות בזמן אמת. ניתוח מעמיק, תחזיות מחירים והמלצות לצרכנים חכמים.',
  keywords: 'מדד בשר, מחירי בשר, אינפלציה, תחזיות מחירים, כלכלה ישראלית'
}