import { Home, ShoppingCart, TrendingUp, Trophy, BarChart3, Camera, Users, LucideIcon } from 'lucide-react'

export interface NavigationItem {
  href: string
  icon: LucideIcon
  label: string
  description: string
  ariaLabel?: string
}

export const navigationItems: NavigationItem[] = [
  {
    href: '/',
    icon: Home,
    label: 'מטריצה',
    description: 'השוואת מחירים חכמה',
    ariaLabel: 'עמוד הבית - מטריצת השוואת מחירים'
  },
  {
    href: '/ocr',
    icon: Camera,
    label: 'סריקת קבלות',
    description: 'דיווח אוטומטי',
    ariaLabel: 'סריקת קבלות ודיווח מחירים אוטומטי'
  },
  {
    href: '/shopping-lists',
    icon: ShoppingCart,
    label: 'רשימות קניות',
    description: 'תכנון חכם וחיסכון',
    ariaLabel: 'רשימות קניות חכמות ותכנון מסלולים'
  },
  {
    href: '/index',
    icon: BarChart3,
    label: 'מדד כלכלי',
    description: 'ניתוח מתקדם',
    ariaLabel: 'מדד הבשר וניתוח כלכלי מתקדם'
  },
  {
    href: '/trends',
    icon: TrendingUp,
    label: 'מגמות',
    description: 'מעקב מחירים',
    ariaLabel: 'מגמות מחירים וניתוח היסטורי'
  },
  {
    href: '/rankings',
    icon: Trophy,
    label: 'דירוגים',
    description: 'חנויות ומשתמשים',
    ariaLabel: 'דירוגי חנויות ולוח מובילים'
  },
  {
    href: '/community',
    icon: Users,
    label: 'קהילה',
    description: 'ביקורות וחוויות',
    ariaLabel: 'קהילת משתמשים וביקורות חנויות'
  }
]

export const getNavigationItemByPath = (pathname: string): NavigationItem | undefined => {
  return navigationItems.find(item => item.href === pathname)
}

export const getPageTitle = (pathname: string): string => {
  const item = getNavigationItemByPath(pathname)
  return item ? `${item.label} | בשרומטר V5.1` : 'בשרומטר V5.1'
}