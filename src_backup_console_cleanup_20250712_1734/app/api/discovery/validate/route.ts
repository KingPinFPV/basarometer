// Discovery Validation API - POST validate new source
import { NextResponse } from 'next/server'
import { DiscoveryEngine } from '@/lib/discovery/core/DiscoveryEngine'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { url, name, description, location, business_type } = body
        
        // Validate required fields
        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL is required for validation' },
                { status: 400 }
            )
        }
        
        const discoveryEngine = new DiscoveryEngine()
        
        // Validate the business candidate
        const validation = await discoveryEngine.validateSingleSource({
            url,
            name,
            description,
            location,
            business_type
        })
        
        // Add URL accessibility check result
        const isAccessible = await checkUrlAccessibility(url)
        
        const response = {
            success: true,
            validation: {
                ...validation,
                urlAccessible: isAccessible,
                validationTimestamp: new Date().toISOString()
            },
            recommendations: generateRecommendations(validation)
        }
        
        return NextResponse.json(response)
        
    } catch (error) {
        console.error('Validation API error:', error)
        return NextResponse.json(
            { success: false, error: 'Validation failed' },
            { status: 500 }
        )
    }
}

async function checkUrlAccessibility(url: string): Promise<boolean> {
    try {
        // Basic URL validation
        const urlObj = new URL(url)
        
        // Check for valid protocol
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return false
        }
        
        // Check for Israeli domains (common pattern)
        const isIsraeliDomain = urlObj.hostname.endsWith('.co.il') ||
                               urlObj.hostname.endsWith('.org.il') ||
                               urlObj.hostname.endsWith('.net.il')
        
        // For now, return true for valid URLs (in production, you'd make an actual HTTP request)
        return isIsraeliDomain || urlObj.hostname.includes('.com')
        
    } catch {
        return false
    }
}

function generateRecommendations(validation: any): string[] {
    const recommendations: string[] = []
    
    if (!validation.isValid) {
        if (validation.scores.nameScore < 50) {
            recommendations.push('Consider adding Hebrew meat-related terms to the business name')
        }
        if (validation.scores.locationScore < 50) {
            recommendations.push('Verify the business is located in Israel')
        }
        if (validation.scores.urlScore < 30) {
            recommendations.push('URL should contain meat or business-related terms')
        }
    } else {
        if (validation.confidence < 0.8) {
            recommendations.push('Add more business details to improve confidence score')
        }
        if (validation.meatCategories.length === 0) {
            recommendations.push('Specify meat categories offered by this business')
        }
        if (!validation.qualityIndicators.includes('כשר')) {
            recommendations.push('Consider adding kosher certification status')
        }
    }
    
    return recommendations
}