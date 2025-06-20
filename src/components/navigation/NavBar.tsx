'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import { NavItem } from './NavItem'
import { MobileMenu } from './MobileMenu'
import { AuthButton } from '@/components/auth/AuthButton'
import { navigationItems } from './navigationConfig'
import LiveScannerStatus from '@/components/scanner/LiveScannerStatus'

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
          shadow-sm transition-all duration-200 min-h-[64px] ${className}
        `}
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 min-h-[64px]">
            
            {/* Brand Logo */}
            <div className="flex-shrink-0">
              <BrandLogo 
                size="sm" 
                showSubtext={false}
                className="hover:scale-105 transition-transform duration-200"
              />
            </div>

            {/* Desktop Navigation - Stable Layout Like BrandLogo */}
            <div className="hidden lg:flex items-center space-x-4 rtl:space-x-reverse flex-1 justify-between">
              {/* Navigation Items */}
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                {navigationItems.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    showDescription={false}
                    className="flex-shrink-0 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm whitespace-nowrap"
                  />
                ))}
              </div>
              
              {/* Auth Button - Always Visible */}
              <div className="flex-shrink-0 border-l border-gray-200 pl-4">
                <AuthButton size="sm" showText={true} />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
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

        {/* Scanner Status Bar - Visible on all screen sizes */}
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-2">
              <LiveScannerStatus />
            </div>
          </div>
        </div>

        {/* Medium Screen Navigation - Stable Layout */}
        <div className="hidden md:block lg:hidden border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2 min-h-[48px]">
              <div className="flex items-center space-x-3 rtl:space-x-reverse overflow-x-auto flex-1">
                {navigationItems.slice(0, 4).map((item) => (
                  <NavItem
                    key={`${item.href}-medium`}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    showDescription={false}
                    className="flex-shrink-0 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm whitespace-nowrap"
                  />
                ))}
              </div>
              
              {/* Auth Button for Medium Screens - Always Visible */}
              <div className="flex-shrink-0 border-l border-gray-200 pl-3 ml-3">
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