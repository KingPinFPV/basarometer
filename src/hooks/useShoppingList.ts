'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { MeatCut, Retailer, PriceReport } from '@/lib/database.types'

export interface ShoppingList {
  id: string
  user_id: string
  name: string
  created_at: string
  is_active: boolean
}

export interface ShoppingListItem {
  id: string
  list_id: string
  meat_cut_id: string
  quantity: number
  unit: 'kg' | '100g' | 'pieces'
  priority: number
  notes?: string
  meat_cut?: MeatCut
}

export interface ShoppingListOptimization {
  retailer: Retailer
  items: ShoppingListItem[]
  totalCost: number
  estimatedSavings: number
  averageDistance?: number
}

export function useShoppingList() {
  const { user } = useAuth()
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null)
  const [currentItems, setCurrentItems] = useState<ShoppingListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's shopping lists
  const fetchLists = useCallback(async () => {
    if (!user) {
      setLists([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setLists(data || [])

      // Auto-select the most recent list
      if (data && data.length > 0 && !currentList) {
        setCurrentList(data[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shopping lists')
    } finally {
      setLoading(false)
    }
  }, [user, currentList])

  // Fetch items for current list
  const fetchListItems = async (listId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('shopping_list_items')
        .select(`
          *,
          meat_cut:meat_cuts(*)
        `)
        .eq('list_id', listId)
        .order('priority', { ascending: true })

      if (fetchError) throw fetchError

      setCurrentItems(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch list items')
    } finally {
      setLoading(false)
    }
  }

  // Create new shopping list
  const createList = async (name: string): Promise<ShoppingList | null> => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      const { data, error: createError } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          name,
          is_active: true
        })
        .select()
        .single()

      if (createError) throw createError

      const newList = data as ShoppingList
      setLists(prev => [newList, ...prev])
      setCurrentList(newList)
      setCurrentItems([])

      return newList
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shopping list')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Add item to shopping list
  const addItem = async (
    listId: string,
    meatCutId: string,
    quantity: number = 1,
    unit: 'kg' | '100g' | 'pieces' = 'kg',
    notes?: string
  ): Promise<boolean> => {
    if (!user) return false

    setLoading(true)
    setError(null)

    try {
      // Check if item already exists
      const existingItem = currentItems.find(item => item.meat_cut_id === meatCutId)
      
      if (existingItem) {
        // Update quantity instead of adding duplicate
        const { error: updateError } = await supabase
          .from('shopping_list_items')
          .update({
            quantity: existingItem.quantity + quantity,
            notes: notes || existingItem.notes
          })
          .eq('id', existingItem.id)

        if (updateError) throw updateError

        // Refresh items
        await fetchListItems(listId)
      } else {
        // Add new item
        const { data, error: insertError } = await supabase
          .from('shopping_list_items')
          .insert({
            list_id: listId,
            meat_cut_id: meatCutId,
            quantity,
            unit,
            priority: currentItems.length + 1,
            notes
          })
          .select(`
            *,
            meat_cut:meat_cuts(*)
          `)
          .single()

        if (insertError) throw insertError

        setCurrentItems(prev => [...prev, data])
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to list')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Remove item from shopping list
  const removeItem = async (itemId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId)

      if (deleteError) throw deleteError

      setCurrentItems(prev => prev.filter(item => item.id !== itemId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Update item quantity/notes
  const updateItem = async (
    itemId: string,
    updates: Partial<Pick<ShoppingListItem, 'quantity' | 'unit' | 'notes' | 'priority'>>
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('shopping_list_items')
        .update(updates)
        .eq('id', itemId)

      if (updateError) throw updateError

      setCurrentItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, ...updates }
            : item
        )
      )

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Delete shopping list
  const deleteList = async (listId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      // Mark as inactive instead of deleting (preserve data)
      const { error: updateError } = await supabase
        .from('shopping_lists')
        .update({ is_active: false })
        .eq('id', listId)

      if (updateError) throw updateError

      setLists(prev => prev.filter(list => list.id !== listId))
      
      if (currentList?.id === listId) {
        setCurrentList(null)
        setCurrentItems([])
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete list')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Calculate total cost and optimization
  const calculateOptimization = async (items: ShoppingListItem[]): Promise<ShoppingListOptimization[]> => {
    try {
      // Get current price reports for all items
      const meatCutIds = items.map(item => item.meat_cut_id)
      
      const { data: priceReports, error: priceError } = await supabase
        .from('price_reports')
        .select(`
          *,
          retailer:retailers(*),
          meat_cut:meat_cuts(*)
        `)
        .in('meat_cut_id', meatCutIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (priceError) throw priceError

      // Group by retailer and calculate costs
      const retailerData = new Map<string, {
        retailer: Retailer
        items: Array<{ item: ShoppingListItem, priceReport: PriceReport }>
        totalCost: number
      }>()

      // Process each item
      items.forEach(item => {
        const itemPrices = priceReports.filter(report => report.meat_cut_id === item.meat_cut_id)
        
        itemPrices.forEach(report => {
          const retailerId = report.retailer.id
          
          if (!retailerData.has(retailerId)) {
            retailerData.set(retailerId, {
              retailer: report.retailer,
              items: [],
              totalCost: 0
            })
          }

          const retailerInfo = retailerData.get(retailerId)!
          
          // Calculate cost for this item
          const effectivePrice = report.is_on_sale && report.sale_price_per_kg 
            ? report.sale_price_per_kg 
            : report.price_per_kg

          const itemCost = (effectivePrice / 100) * item.quantity // Convert agorot to shekels
          
          retailerInfo.items.push({ item, priceReport: report })
          retailerInfo.totalCost += itemCost
        })
      })

      // Convert to optimization results
      const optimizations: ShoppingListOptimization[] = Array.from(retailerData.values())
        .map(data => ({
          retailer: data.retailer,
          items: data.items.map(({ item }) => item),
          totalCost: data.totalCost,
          estimatedSavings: 0 // Will calculate below
        }))
        .sort((a, b) => a.totalCost - b.totalCost)

      // Calculate savings relative to most expensive option
      if (optimizations.length > 1) {
        const mostExpensive = optimizations[optimizations.length - 1].totalCost
        optimizations.forEach(opt => {
          opt.estimatedSavings = mostExpensive - opt.totalCost
        })
      }

      return optimizations
    } catch (err) {
      console.error('Failed to calculate optimization:', err)
      return []
    }
  }

  // Auto-fetch lists when user changes
  useEffect(() => {
    fetchLists()
  }, [user, fetchLists])

  // Auto-fetch items when current list changes
  useEffect(() => {
    if (currentList) {
      fetchListItems(currentList.id)
    }
  }, [currentList])

  return {
    // State
    lists,
    currentList,
    currentItems,
    loading,
    error,

    // Actions
    fetchLists,
    fetchListItems,
    createList,
    addItem,
    removeItem,
    updateItem,
    deleteList,
    calculateOptimization,
    setCurrentList,

    // Computed
    hasItems: currentItems.length > 0,
    totalItems: (currentItems || []).reduce((sum, item) => sum + (item?.quantity || 0), 0)
  }
}