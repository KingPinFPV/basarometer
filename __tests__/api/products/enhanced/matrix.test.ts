import { GET } from '@/app/api/products/enhanced/matrix/route';
import { NextRequest } from 'next/server';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: mockMeatCuts,
          error: null,
        }),
        gte: jest.fn().mockReturnValue({
          data: mockPriceData,
          error: null,
        }),
      }),
    }),
  },
}));

const mockMeatCuts = [
  {
    id: '1',
    name_hebrew: 'אנטריקוט',
    name_english: 'entrecote',
    is_active: true,
    category: {
      id: 'cat1',
      name_hebrew: 'בקר',
      name_english: 'beef',
    },
  },
];

const mockPriceData = [
  {
    meat_cut_id: '1',
    price_per_kg: '150',
    retailer_id: 'retailer1',
    created_at: new Date().toISOString(),
    is_active: true,
  },
];

describe('/api/products/enhanced/matrix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return enhanced matrix data successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/products/enhanced/matrix');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('enhanced_cuts');
    expect(data.data).toHaveProperty('quality_breakdown');
    expect(data.data).toHaveProperty('market_insights');
    expect(data.data).toHaveProperty('performance_metrics');
  });

  it('should handle category filtering', async () => {
    const request = new NextRequest('http://localhost:3000/api/products/enhanced/matrix?category=בקר');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should handle quality filtering', async () => {
    const request = new NextRequest('http://localhost:3000/api/products/enhanced/matrix?quality=premium');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should include scanner data by default', async () => {
    const request = new NextRequest('http://localhost:3000/api/products/enhanced/matrix');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.metadata.data_sources).toContain('scanner_products');
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          data: null,
          error: new Error('Database connection failed'),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/products/enhanced/matrix');
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch enhanced matrix data');
  });

  it('should return performance metadata', async () => {
    const request = new NextRequest('http://localhost:3000/api/products/enhanced/matrix');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.metadata).toHaveProperty('query_time_ms');
    expect(data.metadata).toHaveProperty('last_updated');
    expect(typeof data.metadata.query_time_ms).toBe('number');
  });

  it('should handle missing meat_name_mappings table gracefully', async () => {
    const { supabase } = require('@/lib/supabase');
    
    // Mock the meat_cuts query to succeed
    const mockFrom = jest.fn();
    mockFrom.mockImplementation((table) => {
      if (table === 'meat_cuts') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: mockMeatCuts,
              error: null,
            }),
          }),
        };
      }
      if (table === 'meat_name_mappings') {
        throw new Error('Table does not exist');
      }
      if (table === 'retailers') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: [],
              error: null,
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              data: [],
              error: null,
            }),
          }),
        }),
      };
    });
    
    supabase.from = mockFrom;

    const request = new NextRequest('http://localhost:3000/api/products/enhanced/matrix');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});