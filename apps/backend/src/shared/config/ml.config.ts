export const mlConfig = {
  // ML Service URL
  serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5001',
  
  // Request timeout in milliseconds
  timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '5000'),
  
  // Number of retry attempts
  retryAttempts: parseInt(process.env.ML_SERVICE_RETRY_ATTEMPTS || '3'),
  
  // Whether to fallback to stub if ML service is unavailable
  fallbackToStub: process.env.ML_SERVICE_FALLBACK_TO_STUB === 'true' || process.env.NODE_ENV === 'development',
  
  // Cache settings
  cacheEnabled: process.env.ML_SERVICE_CACHE_ENABLED === 'true',
  cacheTtl: parseInt(process.env.ML_SERVICE_CACHE_TTL || '300'), // 5 minutes
  
  // Health check settings
  healthCheckInterval: parseInt(process.env.ML_SERVICE_HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
  
  // Logging settings
  enableLogging: process.env.ML_SERVICE_ENABLE_LOGGING !== 'false',
  logLevel: process.env.ML_SERVICE_LOG_LEVEL || 'info'
};