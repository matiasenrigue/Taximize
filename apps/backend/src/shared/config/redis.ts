import Redis from 'ioredis';

/**
 * Manages Redis connections for caching expensive operations
 * 
 * The app works perfectly fine without Redis - if Redis is down,
 * we just skip caching and compute everything fresh.
 */
class RedisClient {
    private client: Redis | null = null;
    private isConnected = false;

    /**
     * Tries to connect to Redis when the server starts
     * If Redis isn't available, we'll just run without caching
     */
    async connect(): Promise<void> {
        if (this.client) return;

        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        try {
            this.client = new Redis(redisUrl, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => {
                    if (times > 3) return null; // Give up after 3 tries
                    return Math.min(times * 50, 100); // Wait a bit longer each retry
                },
                lazyConnect: true
            });

            this.client.on('connect', () => {
                console.log('✅ Redis connected');
                this.isConnected = true;
            });

            this.client.on('error', (err) => {
                console.error('Redis error:', err.message);
                this.isConnected = false;
            });

            await this.client.connect();
        } catch (error) {
            console.warn('⚠️  Redis connection failed - caching disabled');
            this.client = null;
        }
    }

    /**
     * Fetches a value from cache
     * If Redis is down or the key doesn't exist, returns null
     * and the calling code will compute the value fresh
     */
    async get(key: string): Promise<string | null> {
        if (!this.isConnected || !this.client) {
            console.log(`INFO: Cache SKIP (Redis not connected) for key: ${key}`);
            return null;
        }
        
        try {
            const value = await this.client.get(key);
            if (value) {
                console.log(`INFO: Cache HIT for key: ${key}`);
            } else {
                console.log(`INFO: Cache MISS for key: ${key}`);
            }
            return value;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    /**
     * Stores a value in cache with an expiration time
     * If Redis is down, this does nothing (and that's okay)
     */
    async setEx(key: string, seconds: number, value: string): Promise<void> {
        if (!this.isConnected || !this.client) {
            console.log(`INFO: Cache SKIP (Redis not connected) - Unable to cache key: ${key}`);
            return;
        }
        
        try {
            await this.client.setex(key, seconds, value);
            console.log(`INFO: Cache SET for key: ${key} (TTL: ${seconds}s)`);
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }

}

// Singleton instance
export const redisClient = new RedisClient();

// Export connect function for app initialization
export const connectRedis = async () => {
    await redisClient.connect();
};