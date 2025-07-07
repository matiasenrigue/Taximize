import { MLService } from '../../utils/mlService';
import { MLServiceClient } from '../../utils/mlServiceClient';
import { MlStub } from '../../utils/mlStub';

// Mock the ML service client
jest.mock('../../utils/mlServiceClient');
jest.mock('../../utils/mlStub');
jest.mock('../../../../shared/config/ml.config', () => ({
  mlConfig: {
    serviceUrl: 'http://localhost:5001',
    timeout: 5000,
    retryAttempts: 3,
    fallbackToStub: true,
    cacheEnabled: true,
    cacheTtl: 300,
    healthCheckInterval: 30000,
    enableLogging: false
  }
}));

const MockMLServiceClient = MLServiceClient as jest.MockedClass<typeof MLServiceClient>;
const MockMlStub = MlStub as jest.MockedClass<typeof MlStub>;

describe('MLService', () => {
  let mlService: MLService;
  let mockClient: jest.Mocked<MLServiceClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock client instance
    mockClient = {
      predictRideScore: jest.fn(),
      healthCheck: jest.fn()
    } as any;
    
    MockMLServiceClient.mockImplementation(() => mockClient);
    MockMlStub.getRandomScore = jest.fn().mockReturnValue(3);
    
    mlService = new MLService();
  });

  describe('evaluateRide', () => {
    it('should return score from ML service', async () => {
      mockClient.predictRideScore.mockResolvedValueOnce(4);

      const result = await mlService.evaluateRide(53.349805, -6.260310, 53.343794, -6.254573);

      expect(result).toBe(4);
      expect(mockClient.predictRideScore).toHaveBeenCalledWith(53.349805, -6.260310, 53.343794, -6.254573);
    });

    it('should validate coordinates', async () => {
      // Test that coordinates are validated before making ML service call
      await expect(mlService.evaluateRide(91, -6.260310, 53.343794, -6.254573))
        .rejects
        .toThrow('Invalid latitude provided');

      await expect(mlService.evaluateRide(53.349805, 181, 53.343794, -6.254573))
        .rejects
        .toThrow('Invalid longitude provided');
        
      // Verify the ML service was not called for invalid coordinates
      expect(mockClient.predictRideScore).not.toHaveBeenCalled();
    });

    it('should fallback to stub when ML service fails', async () => {
      mockClient.predictRideScore.mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await mlService.evaluateRide(53.349805, -6.260310, 53.343794, -6.254573);

      expect(result).toBe(3);
      expect(MockMlStub.getRandomScore).toHaveBeenCalled();
    });

    it('should cache results', async () => {
      mockClient.predictRideScore.mockResolvedValueOnce(4);

      // First call
      const result1 = await mlService.evaluateRide(53.349805, -6.260310, 53.343794, -6.254573);
      expect(result1).toBe(4);
      expect(mockClient.predictRideScore).toHaveBeenCalledTimes(1);

      // Second call with same coordinates - should use cache
      const result2 = await mlService.evaluateRide(53.349805, -6.260310, 53.343794, -6.254573);
      expect(result2).toBe(4);
      expect(mockClient.predictRideScore).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should not cache when caching is disabled', async () => {
      // Create a new MLService instance with caching disabled
      const mlServiceNoCaching = new MLService();
      
      // Mock the config to have caching disabled
      Object.defineProperty(mlServiceNoCaching as any, 'cache', {
        value: {
          get: jest.fn().mockReturnValue(null),
          set: jest.fn(),
          clear: jest.fn(),
          size: jest.fn().mockReturnValue(0),
          cleanup: jest.fn()
        }
      });

      mockClient.predictRideScore.mockResolvedValue(4);

      // First call
      await mlServiceNoCaching.evaluateRide(53.349805, -6.260310, 53.343794, -6.254573);
      expect(mockClient.predictRideScore).toHaveBeenCalledTimes(1);

      // Second call - should make new request since caching is disabled
      await mlServiceNoCaching.evaluateRide(53.349805, -6.260310, 53.343794, -6.254573);
      expect(mockClient.predictRideScore).toHaveBeenCalledTimes(2);
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status', async () => {
      mockClient.healthCheck.mockResolvedValueOnce(true);

      const status = await mlService.getHealthStatus();

      expect(status.healthy).toBe(true);
      expect(status.cacheSize).toBe(0);
      expect(typeof status.lastCheck).toBe('number');
    });
  });

  describe('clearCache', () => {
    it('should clear cache', async () => {
      mockClient.predictRideScore.mockResolvedValue(4);

      // Add item to cache
      await mlService.evaluateRide(53.349805, -6.260310, 53.343794, -6.254573);
      expect(mockClient.predictRideScore).toHaveBeenCalledTimes(1);

      // Clear cache
      mlService.clearCache();

      // Next call should hit service again
      await mlService.evaluateRide(53.349805, -6.260310, 53.343794, -6.254573);
      expect(mockClient.predictRideScore).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = mlService.getCacheStats();

      expect(stats).toEqual({
        size: 0,
        enabled: true,
        ttl: 300
      });
    });
  });
});