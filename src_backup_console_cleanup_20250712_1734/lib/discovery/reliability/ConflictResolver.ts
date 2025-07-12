// Conflict Resolver - Resolve price conflicts between sources
import { supabase } from '@/lib/supabase'
import { PriceConflict, ConflictResolution } from '@/lib/database.types'
import { Logger } from '../utils/Logger'

export class ConflictResolver {
    private logger: Logger

    constructor() {
        this.logger = new Logger('ConflictResolver')
    }

    async resolveConflict(conflictId: string, method: 'algorithm' | 'admin' = 'algorithm'): Promise<ConflictResolution | null> {
        try {
            if (method === 'algorithm') {
                return await this.resolveAutomatically(conflictId)
            } else {
                // Admin resolution would be handled by admin interface
                this.logger.info(`Conflict ${conflictId} marked for admin resolution`)
                return null
            }
        } catch (error) {
            this.logger.error(`Failed to resolve conflict ${conflictId}:`, error)
            return null
        }
    }

    private async resolveAutomatically(conflictId: string): Promise<ConflictResolution | null> {
        // Get conflict details
        const { data: conflict, error } = await supabase
            .from('price_conflicts')
            .select(`
                *,
                source1:discovered_sources!price_conflicts_source1_id_fkey(reliability_score),
                source2:discovered_sources!price_conflicts_source2_id_fkey(reliability_score)
            `)
            .eq('id', conflictId)
            .single()

        if (error || !conflict) {
            this.logger.error('Failed to fetch conflict details:', error)
            return null
        }

        // Use database function for automatic resolution
        const { data: result, error: resolveError } = await supabase
            .rpc('auto_resolve_price_conflict', { conflict_id_param: conflictId })

        if (resolveError) {
            this.logger.error('Automatic conflict resolution failed:', resolveError)
            return null
        }

        // Fetch updated conflict to get resolution details
        const { data: resolvedConflict, error: fetchError } = await supabase
            .from('price_conflicts')
            .select('*')
            .eq('id', conflictId)
            .single()

        if (fetchError || !resolvedConflict) {
            this.logger.error('Failed to fetch resolved conflict:', fetchError)
            return null
        }

        const resolution: ConflictResolution = {
            conflictId,
            method: 'algorithm',
            resolvedPrice: resolvedConflict.resolved_price || 0,
            confidence: resolvedConflict.resolution_confidence || 0,
            resolver: 'system',
            timestamp: new Date(resolvedConflict.resolved_at || Date.now())
        }

        this.logger.info(`Conflict ${conflictId} resolved automatically: ₪${resolution.resolvedPrice}`)
        return resolution
    }

    async detectPriceConflicts(): Promise<PriceConflict[]> {
        // Query for potential price conflicts
        const query = `
            SELECT DISTINCT
                p1.meat_cut_id,
                p1.retailer_id as source1_id,
                p2.retailer_id as source2_id,
                p1.price_per_kg as price1,
                p2.price_per_kg as price2,
                ABS(p1.price_per_kg - p2.price_per_kg) as price_difference,
                ROUND(ABS(p1.price_per_kg - p2.price_per_kg) / LEAST(p1.price_per_kg, p2.price_per_kg) * 100, 2) as percentage_difference,
                mc.name_hebrew as product_identifier
            FROM price_reports p1
            JOIN price_reports p2 ON p1.meat_cut_id = p2.meat_cut_id 
                AND p1.retailer_id != p2.retailer_id
                AND p1.created_at::date = p2.created_at::date
            JOIN meat_cuts mc ON p1.meat_cut_id = mc.id
            WHERE p1.is_active = true 
                AND p2.is_active = true
                AND ABS(p1.price_per_kg - p2.price_per_kg) / LEAST(p1.price_per_kg, p2.price_per_kg) > 0.2
            ORDER BY percentage_difference DESC
            LIMIT 50
        `

        const { data, error } = await supabase.rpc('execute_raw_sql', { sql_query: query })

        if (error) {
            this.logger.error('Failed to detect price conflicts:', error)
            return []
        }

        // Create conflict records for new conflicts
        const conflicts: PriceConflict[] = []
        
        for (const row of data || []) {
            try {
                // Check if conflict already exists
                const { data: existing } = await supabase
                    .from('price_conflicts')
                    .select('id')
                    .eq('meat_cut_id', row.meat_cut_id)
                    .eq('source1_id', row.source1_id)
                    .eq('source2_id', row.source2_id)
                    .eq('resolved', false)
                    .single()

                if (existing) continue // Conflict already recorded

                // Create new conflict record
                const { data: newConflict, error: insertError } = await supabase
                    .from('price_conflicts')
                    .insert({
                        product_identifier: row.product_identifier,
                        meat_cut_id: row.meat_cut_id,
                        source1_id: row.source1_id,
                        source2_id: row.source2_id,
                        price1: row.price1 / 100, // Convert from agorot to shekels
                        price2: row.price2 / 100,
                        price_difference: row.price_difference / 100,
                        percentage_difference: row.percentage_difference,
                        resolved: false
                    })
                    .select()
                    .single()

                if (insertError) {
                    this.logger.error('Failed to create conflict record:', insertError)
                    continue
                }

                if (newConflict) {
                    conflicts.push(newConflict)
                }

            } catch (error) {
                this.logger.error('Error processing conflict detection:', error)
                continue
            }
        }

        this.logger.info(`Detected ${conflicts.length} new price conflicts`)
        return conflicts
    }

    async getUnresolvedConflicts(): Promise<PriceConflict[]> {
        const { data, error } = await supabase
            .from('price_conflicts')
            .select(`
                *,
                meat_cuts(name_hebrew),
                source1:discovered_sources!price_conflicts_source1_id_fkey(name, reliability_score),
                source2:discovered_sources!price_conflicts_source2_id_fkey(name, reliability_score)
            `)
            .eq('resolved', false)
            .order('percentage_difference', { ascending: false })

        if (error) {
            this.logger.error('Failed to fetch unresolved conflicts:', error)
            return []
        }

        return data || []
    }

    async resolveAllPendingConflicts(): Promise<number> {
        const conflicts = await this.getUnresolvedConflicts()
        let resolved = 0

        for (const conflict of conflicts) {
            try {
                const resolution = await this.resolveAutomatically(conflict.id)
                if (resolution) {
                    resolved++
                    this.logger.debug(`Auto-resolved conflict: ${conflict.product_identifier}`)
                }
            } catch (error) {
                this.logger.error(`Failed to resolve conflict ${conflict.id}:`, error)
                continue
            }
        }

        this.logger.info(`Auto-resolved ${resolved}/${conflicts.length} conflicts`)
        return resolved
    }

    async getConflictResolutionStats(): Promise<any> {
        const { data, error } = await supabase
            .from('conflict_resolution_stats')
            .select('*')
            .single()

        if (error) {
            this.logger.error('Failed to fetch conflict resolution stats:', error)
            return null
        }

        return data
    }

    // Manual resolution for admin interface
    async resolveManually(
        conflictId: string, 
        resolvedPrice: number, 
        adminNotes: string,
        adminId: string
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('price_conflicts')
                .update({
                    resolved: true,
                    resolved_price: resolvedPrice,
                    resolution_method: 'manual_admin',
                    resolver: 'admin',
                    resolution_confidence: 1.0,
                    notes: adminNotes,
                    resolved_at: new Date().toISOString()
                })
                .eq('id', conflictId)

            if (error) {
                this.logger.error('Manual conflict resolution failed:', error)
                return false
            }

            this.logger.info(`Conflict ${conflictId} manually resolved by admin`)
            return true

        } catch (error) {
            this.logger.error('Manual resolution error:', error)
            return false
        }
    }
}