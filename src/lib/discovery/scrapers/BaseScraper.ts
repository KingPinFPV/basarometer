// Base Scraper Class - Abstract base for all scrapers
import { BusinessCandidate } from '@/lib/database.types'

export abstract class BaseScraper {
    abstract scrape(): Promise<BusinessCandidate[]>

    protected async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    protected normalizeBusinessName(name: string): string {
        return name.trim().replace(/\s+/g, ' ')
    }

    protected extractDomain(url: string): string {
        try {
            const urlObj = new URL(url)
            return urlObj.hostname
        } catch {
            return ''
        }
    }

    protected isValidUrl(url: string): boolean {
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    }

    protected containsHebrewText(text: string): boolean {
        return /[\u0590-\u05FF]/.test(text)
    }

    protected sanitizeText(text: string): string {
        return text.replace(/[<>]/g, '').trim()
    }
}