# NodeJS to Python ML Model Integration Research

## Overview

This document researches various approaches for connecting our NodeJS backend to a Python ML model for ride evaluation. The current system uses a stub implementation that returns random scores, and we need to replace it with a real ML model integration.

## Current System Architecture

### Current Implementation
```typescript
// apps/backend/src/entities/rides/utils/mlStub.ts
export class MlStub {
  static getRandomScore(): number {
    return Math.floor(Math.random() * 5) + 1;
  }
}
```

### Integration Point
The ML model is called from `RideService.evaluateRide()` method:
```typescript
static async evaluateRide(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number> {
  // Validate coordinates
  this.validateCoordinates(startLat, startLng, destLat, destLng);
  
  // Use ML stub to get random score
  return MlStub.getRandomScore();
}
```

## Integration Approaches

### 1. HTTP API Approach (Recommended)

**Pros:**
- Clean separation of concerns
- Language-agnostic
- Scalable and can be deployed independently
- Easy to test and debug
- Supports load balancing and failover
- RESTful API standards

**Cons:**
- Network latency overhead
- Requires additional infrastructure
- Need to handle network failures

**Implementation:**
```typescript
// ML Service Client
export class MLServiceClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout: number = 5000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async predictRideScore(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number> {
    const response = await fetch(`${this.baseUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_latitude: startLat,
        start_longitude: startLng,
        destination_latitude: destLat,
        destination_longitude: destLng
      }),
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`ML Service error: ${response.status}`);
    }

    const data = await response.json();
    return data.predicted_score;
  }
}
```

**Python Service Example:**
```python
# ml_service.py
from flask import Flask, request, jsonify
import numpy as np
from your_ml_model import RideScorePredictor

app = Flask(__name__)
model = RideScorePredictor.load_model('model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        # Extract coordinates
        start_lat = data['start_latitude']
        start_lng = data['start_longitude']
        dest_lat = data['destination_latitude']
        dest_lng = data['destination_longitude']
        
        # Make prediction
        features = np.array([[start_lat, start_lng, dest_lat, dest_lng]])
        prediction = model.predict(features)[0]
        
        return jsonify({
            'predicted_score': int(prediction),
            'confidence': float(model.predict_proba(features).max())
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
```

### 2. Child Process Approach

**Pros:**
- Simple to implement
- No additional service required
- Direct integration

**Cons:**
- Performance overhead (process creation)
- Limited scalability
- Error handling complexity
- Platform-dependent

**Implementation:**
```typescript
import { spawn } from 'child_process';

export class MLChildProcess {
  static async predictRideScore(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', ['ml_models/predict_ride.py', 
        startLat.toString(), startLng.toString(), destLat.toString(), destLng.toString()]);
      
      let output = '';
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          resolve(parseInt(output.trim()));
        } else {
          reject(new Error(`Python script failed with code ${code}`));
        }
      });
      
      python.on('error', (error) => {
        reject(error);
      });
    });
  }
}
```

### 3. gRPC Approach

**Pros:**
- High performance
- Strong typing
- Efficient serialization
- Supports streaming

**Cons:**
- Complex setup
- Additional dependencies
- Learning curve

**Implementation:**
```typescript
// Generated gRPC client
import * as grpc from '@grpc/grpc-js';
import { MLServiceClient } from './generated/ml_service_grpc_pb';
import { PredictRequest, PredictResponse } from './generated/ml_service_pb';

export class MLgRPCClient {
  private client: MLServiceClient;

  constructor(serverAddress: string) {
    this.client = new MLServiceClient(serverAddress, grpc.credentials.createInsecure());
  }

  async predictRideScore(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number> {
    const request = new PredictRequest();
    request.setStartLatitude(startLat);
    request.setStartLongitude(startLng);
    request.setDestinationLatitude(destLat);
    request.setDestinationLongitude(destLng);

    return new Promise((resolve, reject) => {
      this.client.predict(request, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response.getPredictedScore());
        }
      });
    });
  }
}
```

### 4. Message Queue Approach

**Pros:**
- Asynchronous processing
- High throughput
- Decoupled architecture
- Fault tolerance

**Cons:**
- Complex setup
- Not suitable for real-time responses
- Additional infrastructure

**Implementation:**
```typescript
import Redis from 'ioredis';

export class MLQueueClient {
  private redis: Redis;
  private requestQueue = 'ml:prediction:requests';
  private responseQueue = 'ml:prediction:responses';

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async predictRideScore(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number> {
    const requestId = `req_${Date.now()}_${Math.random()}`;
    
    // Send request
    await this.redis.lpush(this.requestQueue, JSON.stringify({
      id: requestId,
      startLat, startLng, destLat, destLng
    }));
    
    // Wait for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('ML prediction timeout'));
      }, 10000);
      
      const checkResponse = async () => {
        const response = await this.redis.brpop(this.responseQueue, 1);
        if (response) {
          const data = JSON.parse(response[1]);
          if (data.id === requestId) {
            clearTimeout(timeout);
            resolve(data.predicted_score);
          } else {
            checkResponse(); // Continue waiting
          }
        } else {
          checkResponse(); // Continue waiting
        }
      };
      
      checkResponse();
    });
  }
}
```

## Recommended Implementation Strategy

### Phase 1: HTTP API Integration (Immediate)
1. Create ML service client with HTTP requests
2. Add configuration for ML service URL
3. Implement error handling and fallback to stub
4. Add logging and monitoring

### Phase 2: Production Readiness
1. Add retry logic and circuit breaker
2. Implement caching for repeated requests
3. Add health checks for ML service
4. Set up monitoring and alerting

### Phase 3: Advanced Features
1. A/B testing framework for different models
2. Model versioning support
3. Batch prediction API
4. Real-time model updates

## Configuration Management

```typescript
// config/ml.config.ts
export const mlConfig = {
  serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5001',
  timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '5000'),
  retryAttempts: parseInt(process.env.ML_SERVICE_RETRY_ATTEMPTS || '3'),
  fallbackToStub: process.env.ML_SERVICE_FALLBACK_TO_STUB === 'true',
  cacheEnabled: process.env.ML_SERVICE_CACHE_ENABLED === 'true',
  cacheTtl: parseInt(process.env.ML_SERVICE_CACHE_TTL || '300') // 5 minutes
};
```

## Error Handling Strategy

```typescript
export class MLServiceError extends Error {
  constructor(message: string, public code: string, public statusCode?: number) {
    super(message);
    this.name = 'MLServiceError';
  }
}

// Error handling in service
try {
  return await this.mlClient.predictRideScore(startLat, startLng, destLat, destLng);
} catch (error) {
  console.error('ML Service error:', error);
  
  if (mlConfig.fallbackToStub) {
    console.warn('Falling back to stub ML implementation');
    return MlStub.getRandomScore();
  }
  
  throw new MLServiceError('ML service unavailable', 'ML_SERVICE_ERROR');
}
```

## Testing Strategy

1. **Unit Tests**: Mock ML service responses
2. **Integration Tests**: Test with real ML service
3. **Load Tests**: Verify performance under load
4. **Circuit Breaker Tests**: Test fallback mechanisms

## Deployment Considerations

### Docker Compose Example
```yaml
version: '3.8'
services:
  backend:
    build: ./apps/backend
    environment:
      - ML_SERVICE_URL=http://ml-service:5001
    depends_on:
      - ml-service
      
  ml-service:
    build: ./ml-service
    ports:
      - "5001:5001"
    environment:
      - MODEL_PATH=/app/models/ride_score_model.pkl
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-service
  template:
    metadata:
      labels:
        app: ml-service
    spec:
      containers:
      - name: ml-service
        image: taxi-app/ml-service:latest
        ports:
        - containerPort: 5001
        env:
        - name: MODEL_PATH
          value: "/app/models/ride_score_model.pkl"
```

## Monitoring and Observability

1. **Metrics to Track**:
   - Request/response times
   - Error rates
   - Model prediction accuracy
   - Cache hit rates

2. **Logging**:
   - Request/response payloads
   - Error details
   - Performance metrics

3. **Health Checks**:
   - ML service availability
   - Model loading status
   - Database connectivity

## Security Considerations

1. **Authentication**: Use API keys or JWT tokens
2. **Rate Limiting**: Prevent abuse
3. **Input Validation**: Sanitize coordinates
4. **Network Security**: Use HTTPS in production
5. **Data Privacy**: Ensure compliance with regulations

## Conclusion

The HTTP API approach is recommended for its simplicity, scalability, and maintainability. This approach allows the Python ML service to be developed and deployed independently while providing a clean integration point for the NodeJS backend.

The implementation should start with a basic HTTP client and evolve to include advanced features like caching, retry logic, and monitoring as the system matures.