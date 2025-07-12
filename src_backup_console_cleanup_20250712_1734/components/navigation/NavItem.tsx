'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'

interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
  description?: string
  onClick?: () => void
  className?: string
  showDescription?: boolean
}

const NavItem = React.memo(function NavItem({ 
  href, 
  icon: Icon, 
  label, 
  description,
  onClick,
  className = '',
  showDescription = true
}: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        nav-item-enhanced group relative 
        ${isActive 
          ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-500' 
          : 'text-gray-700 hover:text-gray-900'
        }
        ${className}
      `}
    >
      {/* Icon */}
      <Icon 
        className={`w-5 h-5 transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
        }`} 
      />

      {/* Text Content */}
      <div className="flex flex-col min-w-0">
        <span className={`text-sm font-medium truncate ${
          isActive ? 'text-blue-600' : 'text-gray-900'
        }`}>
          {label}
        </span>
        {showDescription && description && (
          <span className={`text-xs truncate ${
            isActive ? 'text-blue-500' : 'text-gray-500'
          }`}>
            {description}
          </span>
        )}
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
      )}

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg" />
    </Link>
  )
})

export { NavItem }
export default NavItem