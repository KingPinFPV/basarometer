'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, TrendingUp, Users, Settings } from 'lucide-react'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="bg-gradient-primary text-white shadow-lg relative z-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse group">
              <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">בשרומטר</h1>
                <p className="text-xs text-white/80">השוואת מחירי בשר מתקדמת</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
            <Link 
              href="/" 
              className="flex items-center space-x-2 rtl:space-x-reverse text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/10"
            >
              <TrendingUp className="w-4 h-4" />
              <span>מטריקס מחירים</span>
            </Link>
            <Link 
              href="/community" 
              className="flex items-center space-x-2 rtl:space-x-reverse text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/10"
            >
              <Users className="w-4 h-4" />
              <span>קהילה</span>
            </Link>
            <Link 
              href="/admin" 
              className="flex items-center space-x-2 rtl:space-x-reverse text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/10"
            >
              <Settings className="w-4 h-4" />
              <span>ניהול</span>
            </Link>
            
            {/* Status Badge */}
            <div className="bg-green-500/20 text-green-100 px-3 py-1 rounded-full text-xs font-medium border border-green-400/30">
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>מערכת פעילה</span>
              </div>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="תפריט"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={toggleMobileMenu}
          />
          
          {/* Mobile Menu */}
          <div className="absolute top-16 right-0 left-0 bg-white shadow-lg border-t border-gray-200 z-50 md:hidden animate-fade-in">
            <nav className="px-4 py-4 space-y-2">
              <Link 
                href="/" 
                className="flex items-center space-x-3 rtl:space-x-reverse text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-3 rounded-md text-base font-medium transition-colors"
                onClick={toggleMobileMenu}
              >
                <TrendingUp className="w-5 h-5" />
                <span>מטריקס מחירים</span>
              </Link>
              <Link 
                href="/community" 
                className="flex items-center space-x-3 rtl:space-x-reverse text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-3 rounded-md text-base font-medium transition-colors"
                onClick={toggleMobileMenu}
              >
                <Users className="w-5 h-5" />
                <span>קהילה</span>
              </Link>
              <Link 
                href="/admin" 
                className="flex items-center space-x-3 rtl:space-x-reverse text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-3 rounded-md text-base font-medium transition-colors"
                onClick={toggleMobileMenu}
              >
                <Settings className="w-5 h-5" />
                <span>ניהול</span>
              </Link>
              
              {/* Mobile Status */}
              <div className="px-3 py-3">
                <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm font-medium border border-green-200">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>מערכת פעילה</span>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}