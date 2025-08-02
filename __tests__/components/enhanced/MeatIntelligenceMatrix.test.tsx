import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MeatIntelligenceMatrix } from '@/components/enhanced/MeatIntelligenceMatrix';

// Mock the hook
jest.mock('@/hooks/useEnhancedMeatData', () => ({
  useEnhancedMeatData: jest.fn(),
}));

const mockEnhancedData = {
  enhanced_cuts: [
    {
      id: '1',
      name_hebrew: 'אנטריקוט',
      name_english: 'entrecote',
      category: { id: 'cat1', name_hebrew: 'בקר', name_english: 'beef' },
      quality_grades: [{ tier: 'regular', count: 5, avg_price: 150, market_share: 100 }],
      price_data: { min_price: 140, max_price: 160, avg_price: 150, price_trend: 'stable' },
      market_metrics: { coverage_percentage: 80, availability_score: 90, popularity_rank: 1 },
      retailers: [
        {
          retailer_id: 'shufersal',
          retailer_name: 'שופרסל',
          current_price: 155,
          price_confidence: 0.95,
          last_updated: '2025-08-02T10:00:00Z',
          is_available: true,
        },
      ],
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
};

describe('MeatIntelligenceMatrix', () => {
  const mockUseEnhancedMeatData = require('@/hooks/useEnhancedMeatData').useEnhancedMeatData;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEnhancedMeatData.mockReturnValue({
      data: mockEnhancedData,
      isLoading: false,
      error: null,
    });
  });

  it('should render successfully with data', () => {
    render(<MeatIntelligenceMatrix />);
    
    expect(screen.getByText('אנטריקוט')).toBeInTheDocument();
    expect(screen.getByText('שופרסל')).toBeInTheDocument();
    expect(screen.getByText('155')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseEnhancedMeatData.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<MeatIntelligenceMatrix />);
    
    expect(screen.getByText(/טוען/)).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUseEnhancedMeatData.mockReturnValue({
      data: null,
      isLoading: false,
      error: 'Failed to load data',
    });

    render(<MeatIntelligenceMatrix />);
    
    expect(screen.getByText(/שגיאה/)).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    mockUseEnhancedMeatData.mockReturnValue({
      data: { ...mockEnhancedData, enhanced_cuts: [] },
      isLoading: false,
      error: null,
    });

    render(<MeatIntelligenceMatrix />);
    
    expect(screen.getByText(/אין מוצרים זמינים/)).toBeInTheDocument();
  });

  it('should filter by category', async () => {
    render(<MeatIntelligenceMatrix />);
    
    const categoryFilter = screen.getByLabelText(/קטגוריה/);
    fireEvent.change(categoryFilter, { target: { value: 'בקר' } });

    await waitFor(() => {
      expect(mockUseEnhancedMeatData).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'בקר' })
      );
    });
  });

  it('should filter by quality grade', async () => {
    render(<MeatIntelligenceMatrix />);
    
    const qualityFilter = screen.getByLabelText(/איכות/);
    fireEvent.change(qualityFilter, { target: { value: 'premium' } });

    await waitFor(() => {
      expect(mockUseEnhancedMeatData).toHaveBeenCalledWith(
        expect.objectContaining({ quality: 'premium' })
      );
    });
  });

  it('should toggle scanner data inclusion', async () => {
    render(<MeatIntelligenceMatrix />);
    
    const scannerToggle = screen.getByLabelText(/כלול נתוני סקנר/);
    fireEvent.click(scannerToggle);

    await waitFor(() => {
      expect(mockUseEnhancedMeatData).toHaveBeenCalledWith(
        expect.objectContaining({ includeScanner: false })
      );
    });
  });

  it('should display market insights correctly', () => {
    render(<MeatIntelligenceMatrix />);
    
    expect(screen.getByText('120')).toBeInTheDocument(); // total_products
    expect(screen.getByText('8')).toBeInTheDocument(); // active_retailers
    expect(screen.getByText('85%')).toBeInTheDocument(); // coverage_percentage
  });

  it('should display quality breakdown', () => {
    render(<MeatIntelligenceMatrix />);
    
    expect(screen.getByText('100')).toBeInTheDocument(); // total_variations
    expect(screen.getByText('20%')).toBeInTheDocument(); // premium_percentage
    expect(screen.getByText('regular')).toBeInTheDocument(); // most_common_grade
  });

  it('should display performance metrics', () => {
    render(<MeatIntelligenceMatrix />);
    
    expect(screen.getByText('95%')).toBeInTheDocument(); // data_freshness
    expect(screen.getByText('91%')).toBeInTheDocument(); // system_accuracy
    expect(screen.getByText('89%')).toBeInTheDocument(); // data_completeness
  });

  it('should handle price trend indicators', () => {
    render(<MeatIntelligenceMatrix />);
    
    // Should show stable trend indicator
    expect(screen.getByText(/יציב/)).toBeInTheDocument();
  });

  it('should sort cuts by popularity rank', () => {
    const multiplecuts = {
      ...mockEnhancedData,
      enhanced_cuts: [
        {
          ...mockEnhancedData.enhanced_cuts[0],
          id: '1',
          name_hebrew: 'אנטריקוט',
          market_metrics: { ...mockEnhancedData.enhanced_cuts[0].market_metrics, popularity_rank: 2 },
        },
        {
          ...mockEnhancedData.enhanced_cuts[0],
          id: '2',
          name_hebrew: 'פילה',
          market_metrics: { ...mockEnhancedData.enhanced_cuts[0].market_metrics, popularity_rank: 1 },
        },
      ],
    };

    mockUseEnhancedMeatData.mockReturnValue({
      data: multiplecuts,
      isLoading: false,
      error: null,
    });

    render(<MeatIntelligenceMatrix />);
    
    const cuts = screen.getAllByTestId('meat-cut-row');
    expect(cuts[0]).toHaveTextContent('פילה'); // Should be first (rank 1)
    expect(cuts[1]).toHaveTextContent('אנטריקוט'); // Should be second (rank 2)
  });

  it('should display retailer confidence scores', () => {
    render(<MeatIntelligenceMatrix />);
    
    expect(screen.getByText('95%')).toBeInTheDocument(); // price_confidence
  });
});