import { OCRPage } from '@/components/ocr/OCRPage'

// Force dynamic rendering for OCR page (uses browser APIs)
export const dynamic = 'force-dynamic'

export default function OCRPageRoute() {
  return <OCRPage />
}

export const metadata = {
  title: 'סריקת קבלות חכמה | בסרומטר',
  description: 'סרוק קבלות באמצעות AI וזיהוי טקסט עברי. דווח על מחירי בשר אוטומטית ומהר למאגר הקהילתי.',
  keywords: 'OCR, סריקת קבלות, זיהוי טקסט עברי, דיווח מחירים אוטומטי, בינה מלאכותית'
}