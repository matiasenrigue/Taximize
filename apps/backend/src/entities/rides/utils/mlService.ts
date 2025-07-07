import { MLServiceClient, MLServiceError } from './mlServiceClient';
import { MlStub } from './mlStub';
import { mlConfig } from '../../../shared/config/ml.config';

// Simple in-memory cache for ML predictions
class MLCache {
  private cache = new Map<string, { score: number; timestamp: number }>();
  private ttl: number;

  constructor(ttl: number = 300000) { // 5 minutes default
    this.ttl = ttl;
  }

  get(key: string): number | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.score;
  }

  set(key: string, score: number): void {
    this.cache.set(key, { score, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export class MLService {
  private client: MLServiceClient;
  private cache: MLCache;
  private lastHealthCheck: number = 0;
  private isHealthy: boolean = false;

  constructor() {
    this.client = new MLServiceClient();
    this.cache = new MLCache(mlConfig.cacheTtl * 1000);
    
    // Set up periodic cache cleanup
    if (mlConfig.cacheEnabled) {
      setInterval(() => this.cache.cleanup(), 60000); // Clean every minute
    }
  }

  /**
   * Evaluate ride coordinates and get ML prediction score
   * @param startLat Starting latitude
   * @param startLng Starting longitude
   * @param destLat Destination latitude
   * @param destLng Destination longitude
   * @returns Promise<number> Predicted score (1-5)
   */
  async evaluateRide(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number> {
    // Input validation
    this.validateCoordinates(startLat, startLng, destLat, destLng);

    // Check cache first
    if (mlConfig.cacheEnabled) {
      const cacheKey = this.generateCacheKey(startLat, startLng, destLat, destLng);
      const cachedScore = this.cache.get(cacheKey);
      
      if (cachedScore !== null) {
        if (mlConfig.enableLogging) {
          console.log(`ML prediction cache hit for key: ${cacheKey}`);
        }
        return cachedScore;
      }
    }

    try {
      // Check service health if needed
      await this.checkHealthIfNeeded();

      // Make prediction request
      const score = await this.client.predictRideScore(startLat, startLng, destLat, destLng);

      // Cache the result
      if (mlConfig.cacheEnabled) {
        const cacheKey = this.generateCacheKey(startLat, startLng, destLat, destLng);
        this.cache.set(cacheKey, score);
      }

      if (mlConfig.enableLogging) {
        console.log(`ML prediction successful: ${score} for coordinates [${startLat},${startLng}] -> [${destLat},${destLng}]`);
      }

      return score;
    } catch (error) {
      if (mlConfig.enableLogging) {
        console.error('ML Service error:', error);
      }

      // Fallback to stub if enabled
      if (mlConfig.fallbackToStub) {
        if (mlConfig.enableLogging) {
          console.warn('Falling back to stub ML implementation');
        }
        return MlStub.getRandomScore();
      }

      // Re-throw error if no fallback
      throw error;
    }
  }

  /**
   * Get ML service health status
   */
  async getHealthStatus(): Promise<{ healthy: boolean; lastCheck: number; cacheSize: number }> {
    const healthy = await this.client.healthCheck();
    this.isHealthy = healthy;
    this.lastHealthCheck = Date.now();

    return {
      healthy,
      lastCheck: this.lastHealthCheck,
      cacheSize: this.cache.size()
    };
  }

  /**
   * Clear ML prediction cache
   */
  clearCache(): void {
    this.cache.clear();
    if (mlConfig.enableLogging) {
      console.log('ML prediction cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; enabled: boolean; ttl: number } {
    return {
      size: this.cache.size(),
      enabled: mlConfig.cacheEnabled,
      ttl: mlConfig.cacheTtl
    };
  }

  /**
   * Validate coordinate inputs
   */
  private validateCoordinates(startLat: number, startLng: number, destLat: number, destLng: number): void {
    if (startLat < -90 || startLat > 90 || destLat < -90 || destLat > 90) {
      throw new MLServiceError('Invalid latitude provided', 'INVALID_COORDINATES');
    }
    
    if (startLng < -180 || startLng > 180 || destLng < -180 || destLng > 180) {
      throw new MLServiceError('Invalid longitude provided', 'INVALID_COORDINATES');
    }
  }

  /**
   * Generate cache key for coordinates
   */
  private generateCacheKey(startLat: number, startLng: number, destLat: number, destLng: number): string {
    // Round coordinates to 4 decimal places for cache key (~11m precision)
    const roundedCoords = [startLat, startLng, destLat, destLng].map(coord => 
      Math.round(coord * 10000) / 10000
    );
    return `ml:${roundedCoords.join(',')}`;
  }

  /**
   * Check service health if interval has passed
   */
  private async checkHealthIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastHealthCheck > mlConfig.healthCheckInterval) {
      try {
        this.isHealthy = await this.client.healthCheck();
        this.lastHealthCheck = now;
      } catch (error) {
        this.isHealthy = false;
        if (mlConfig.enableLogging) {
          console.error('ML service health check failed:', error);
        }
      }
    }

    // If service is unhealthy and fallback is disabled, throw error
    if (!this.isHealthy && !mlConfig.fallbackToStub) {
      throw new MLServiceError('ML service is unhealthy', 'SERVICE_UNHEALTHY');
    }
  }
}

// Export singleton instance
export const mlService = new MLService();