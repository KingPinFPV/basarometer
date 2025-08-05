import { renderHook, waitFor } from '@testing-library/react';
import { useEnhancedMeatData } from '@/hooks/useEnhancedMeatData';

// Mock fetch
global.fetch = jest.fn();

const mockSuccessResponse = {
  success: true,
  data: {
    enhanced_cuts: [
      {
        id: '1',
        name_hebrew: 'אנטריקוט',
        name_english: 'entrecote',
        category: { id: 'cat1', name_hebrew: 'בקר', name_english: 'beef' },
        quality_grades: [{ tier: 'regular', count: 5, avg_price: 150, market_share: 100 }],
        price_data: { min_price: 140, max_price: 160, avg_price: 150, price_trend: 'stable' },
        market_metrics: { coverage_percentage: 80, availability_score: 90, popularity_rank: 1 },
        retailers: [],
        variations_count: 5,
      },
    ],
    quality_breakdown: {
      total_variations: 100,
      by_quality: { regular: 80, premium: 20 },
      most_common_grade: 'regular',
      premium_percentage: 20,
      cuts_analyzed: 15,
    },
    market_insights: {
      total_products: 120,
      active_retailers: 8,
      avg_confidence: 0.85,
      avg_price_per_kg: 145.5,
      coverage_percentage: 85,
      enhanced_cuts_count: 15,
      trend_indicators: {
        price_direction: 'stable',
        availability_trend: 'stable',
        quality_trend: 'stable',
      },
    },
    performance_metrics: {
      data_freshness: 95,
      system_accuracy: 91,
      data_completeness: 89,
      last_scan: '2025-08-02T10:00:00Z',
    },
  },
  metadata: {
    last_updated: '2025-08-02T10:00:00Z',
    data_sources: ['meat_cuts', 'price_reports', 'scanner_products'],
    query_time_ms: 85,
  },
};

describe('useEnhancedMeatData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockSuccessResponse,
    });
  });

  it('should fetch enhanced meat data successfully', async () => {
    const { result } = renderHook(() => useEnhancedMeatData());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSuccessResponse.data);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith('/api/products/enhanced/matrix');
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: 'Internal server error' }),
    });

    const { result } = renderHook(() => useEnhancedMeatData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('should handle network errors', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEnhancedMeatData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('should support category filtering', async () => {
    const { result } = renderHook(() => useEnhancedMeatData({ category: 'בקר' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith('/api/products/enhanced/matrix?category=%D7%91%D7%A7%D7%A8');
  });

  it('should support quality filtering', async () => {
    const { result } = renderHook(() => useEnhancedMeatData({ quality: 'premium' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith('/api/products/enhanced/matrix?quality=premium');
  });

  it('should support disabling scanner data', async () => {
    const { result } = renderHook(() => useEnhancedMeatData({ includeScanner: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith('/api/products/enhanced/matrix?include_scanner=false');
  });

  it('should combine multiple filters correctly', async () => {
    const { result } = renderHook(() => 
      useEnhancedMeatData({ 
        category: 'בקר', 
        quality: 'angus', 
        includeScanner: false 
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/products/enhanced/matrix?category=%D7%91%D7%A7%D7%A8&quality=angus&include_scanner=false'
    );
  });

  it('should retry on failure with exponential backoff', async () => {
    (fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

    const { result } = renderHook(() => useEnhancedMeatData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 10000 });

    expect(result.current.data).toEqual(mockSuccessResponse.data);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should cache successful responses', async () => {
    const { result, rerender } = renderHook(() => useEnhancedMeatData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSuccessResponse.data);

    // Re-render with same params should use cache
    rerender();

    expect(fetch).toHaveBeenCalledTimes(1); // Should not fetch again
    expect(result.current.data).toEqual(mockSuccessResponse.data);
  });
});