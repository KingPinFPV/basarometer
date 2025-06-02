'use client'

import { Wifi, WifiOff } from 'lucide-react'

interface LiveIndicatorProps {
  isConnected: boolean
}

export default function LiveIndicator({ isConnected }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {isConnected ? (
        <>
          <div className="relative">
            <Wifi className="h-4 w-4 text-green-500" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="text-green-600 font-medium">חי</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-red-600 font-medium">לא מחובר</span>
        </>
      )}
    </div>
  )
}