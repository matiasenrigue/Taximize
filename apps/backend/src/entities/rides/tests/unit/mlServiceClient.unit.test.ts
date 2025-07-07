import { MLServiceClient, MLServiceError } from '../../utils/mlServiceClient';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('MLServiceClient', () => {
  let client: MLServiceClient;

  beforeEach(() => {
    client = new MLServiceClient('http://localhost:5001', 5000, 2);
    mockFetch.mockClear();
  });

  describe('predictRideScore', () => {
    it('should return predicted score on successful request', async () => {
      const mockResponse = {
        predicted_score: 4,
        confidence: 0.85,
        model_version: '1.0.0'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await client.predictRideScore(53.349805, -6.260310, 53.343794, -6.254573);

      expect(result).toBe(4);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5001/predict',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            start_latitude: 53.349805,
            start_longitude: -6.260310,
            destination_latitude: 53.343794,
            destination_longitude: -6.254573
          })
        })
      );
    });

    it('should round fractional scores', async () => {
      const mockResponse = {
        predicted_score: 4.7,
        confidence: 0.85
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await client.predictRideScore(53.349805, -6.260310, 53.343794, -6.254573);

      expect(result).toBe(5);
    });

    it('should throw error for invalid response score', async () => {
      const mockResponse = {
        predicted_score: 6, // Invalid score > 5
        confidence: 0.85
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      await expect(client.predictRideScore(53.349805, -6.260310, 53.343794, -6.254573))
        .rejects
        .toThrow(MLServiceError);
    });

    it('should throw error for HTTP error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValueOnce('Internal Server Error')
      });

      await expect(client.predictRideScore(53.349805, -6.260310, 53.343794, -6.254573))
        .rejects
        .toThrow(MLServiceError);
    });

    it('should retry on failure', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          predicted_score: 3,
          confidence: 0.75
        })
      });

      const result = await client.predictRideScore(53.349805, -6.260310, 53.343794, -6.254573);

      expect(result).toBe(3);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.predictRideScore(53.349805, -6.260310, 53.343794, -6.254573))
        .rejects
        .toThrow(MLServiceError);

      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial call + 1 retry
    });
  });

  describe('healthCheck', () => {
    it('should return true when service is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      const result = await client.healthCheck();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5001/health',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should return false when service is unhealthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });
});