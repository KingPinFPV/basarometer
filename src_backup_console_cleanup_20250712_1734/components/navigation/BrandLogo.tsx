'use client'

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

interface BrandLogoProps {
  className?: string
  showSubtext?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function BrandLogo({ 
  className = '', 
  showSubtext = true,
  size = 'md' 
}: BrandLogoProps) {
  const sizeClasses = {
    sm: {
      container: 'space-x-2 rtl:space-x-reverse',
      icon: 'w-5 h-5',
      title: 'text-lg font-bold',
      subtitle: 'text-xs'
    },
    md: {
      container: 'space-x-3 rtl:space-x-reverse',
      icon: 'w-6 h-6',
      title: 'text-xl font-bold',
      subtitle: 'text-sm'
    },
    lg: {
      container: 'space-x-4 rtl:space-x-reverse',
      icon: 'w-8 h-8',
      title: 'text-2xl font-bold',
      subtitle: 'text-base'
    }
  }

  const classes = sizeClasses[size]

  return (
    <Link 
      href="/" 
      className={`flex items-center ${classes.container} group transition-all duration-200 hover:scale-105 ${className}`}
    >
      {/* Logo Icon */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg group-hover:shadow-lg transition-all duration-200">
        <TrendingUp className={`${classes.icon} text-white`} />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <h1 className={`${classes.title} text-gray-900 group-hover:text-blue-600 transition-colors`}>
          בשרומטר V5.1
        </h1>
        {showSubtext && (
          <p className={`${classes.subtitle} text-gray-500 group-hover:text-gray-600 transition-colors`}>
            פלטפורמת קנייה חכמה
          </p>
        )}
      </div>
    </Link>
  )
}