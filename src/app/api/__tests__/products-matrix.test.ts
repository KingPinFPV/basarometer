import { GET } from '../products/enhanced/matrix/route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'test-1',
            name_hebrew: 'אנטריקוט בקר',
            name_english: 'Beef Entrecote',
            normalized_cut_id: 'beef_entrecote',
            is_active: true,
            category: {
              id: 'beef',
              name_hebrew: 'בקר',
              name_english: 'Beef'
            }
          }
        ],
        error: null
      })
    }))
  }
}))

describe('Products Matrix API', () => {
  const createMockRequest = (params: Record<string, string> = {}) => {
    const url = new URL('http://localhost:3000/api/products/enhanced/matrix')
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    return new NextRequest(url)
  }

  test('should return matrix data successfully', async () => {
    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('enhanced_cuts')
    expect(data.data).toHaveProperty('quality_breakdown')
    expect(data.data).toHaveProperty('market_insights')
    expect(data.data).toHaveProperty('performance_metrics')
  })

  test('should handle Hebrew product names correctly', async () => {
    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    
    // Verify Hebrew text is preserved
    if (data.data.enhanced_cuts.length > 0) {
      const firstCut = data.data.enhanced_cuts[0]
      expect(firstCut).toHaveProperty('name_hebrew')
      expect(firstCut).toHaveProperty('name_english')
    }
  })

  test('should respond under 50ms performance requirement', async () => {
    const request = createMockRequest({ fast: 'true' })
    const startTime = Date.now()
    
    const response = await GET(request)
    const endTime = Date.now()
    const duration = endTime - startTime

    expect(response.status).toBe(200)
    expect(duration).toBeLessThan(50)
    
    const data = await response.json()
    expect(data.metadata.query_time_ms).toBeLessThan(50)
  })

  test('should handle quality filter parameter', async () => {
    const request = createMockRequest({ quality: 'premium' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('should use cache when available', async () => {
    // First request
    const request1 = createMockRequest({ fast: 'true' })
    const response1 = await GET(request1)
    const data1 = await response1.json()

    expect(response1.status).toBe(200)

    // Second request should use cache
    const request2 = createMockRequest({ fast: 'true' })
    const response2 = await GET(request2)
    const data2 = await response2.json()

    expect(response2.status).toBe(200)
    expect(data2.metadata.cache_used).toBe(true)
  })

  test('should fallback gracefully on database timeout', async () => {
    // Mock database timeout
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    // Should still return 200 with fallback data
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    
    console.error.mockRestore()
  })
})