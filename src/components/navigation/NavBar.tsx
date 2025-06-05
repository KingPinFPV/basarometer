'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import { NavItem } from './NavItem'
import { MobileMenu } from './MobileMenu'
import { AuthButton } from '@/components/auth/AuthButton'
import { navigationItems } from './navigationConfig'

interface NavBarProps {
  className?: string
}

export function NavBar({ className = '' }: NavBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Main Navigation Bar */}
      <nav 
        className={`
          sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 
          shadow-sm transition-all duration-200 ${className}
        `}
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            
            {/* Brand Logo */}
            <div className="flex-shrink-0">
              <BrandLogo 
                size="sm" 
                showSubtext={false}
                className="hover:scale-105 transition-transform duration-200"
              />
            </div>

            {/* Desktop Navigation - Simplified Top Bar */}
            <div className="hidden lg:flex items-center space-x-3 rtl:space-x-reverse">
              {navigationItems.slice(0, 3).map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  showDescription={false}
                  className="px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm"
                />
              ))}
              
              {/* Auth Button */}
              <div className="border-r border-gray-200 pr-3 mr-3">
                <AuthButton size="sm" showText={true} />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="פתח תפריט ראשי"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Navigation - Full Width for Medium Screens */}
        <div className="hidden md:block lg:hidden border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                {navigationItems.map((item) => (
                  <NavItem
                    key={`${item.href}-desktop`}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    showDescription={true}
                    className="px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 min-w-[120px] text-sm"
                  />
                ))}
              </div>
              
              {/* Auth Button for Medium Screens */}
              <div className="border-r border-gray-200 pr-3 mr-3">
                <AuthButton size="sm" showText={true} />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={closeMobileMenu} 
      />

      {/* Spacer to prevent content from hiding behind sticky navbar */}
      <div className="h-0" id="navbar-spacer" />
    </>
  )
}

export default NavBar