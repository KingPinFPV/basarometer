'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { PriceReportWithDetails } from '@/lib/database.types'

export function useLivePrices() {
  const [prices, setPrices] = useState<PriceReportWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const fetchInitialPrices = async () => {
      try {
        const { data, error } = await supabase
          .from('price_reports')
          .select(`
            *,
            products (
              id,
              name,
              brand,
              image_url,
              cuts (
                id,
                name,
                category
              )
            ),
            retailers (
              id,
              name,
              type,
              logo_url
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        setPrices(data as PriceReportWithDetails[])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch prices')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialPrices()

    const channel = supabase
      .channel('price-updates-v3')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_reports'
        },
        async (payload) => {
          console.log('Real-time price update:', payload)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('price_reports')
              .select(`
                *,
                products (
                  id,
                  name,
                  brand,
                  image_url,
                  cuts (
                    id,
                    name,
                    category
                  )
                ),
                retailers (
                  id,
                  name,
                  type,
                  logo_url
                )
              `)
              .eq('id', payload.new?.id)
              .single()

            if (data) {
              setPrices(prev => {
                const updated = prev.filter(p => p.id !== data.id)
                return [data as PriceReportWithDetails, ...updated].slice(0, 50)
              })
            }
          } else if (payload.eventType === 'DELETE') {
            setPrices(prev => prev.filter(p => p.id !== payload.old?.id))
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { prices, loading, error, isConnected }
}