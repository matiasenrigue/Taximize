# ML Integration Guide

This document provides a complete guide for integrating the NodeJS backend with the Python ML service.

## Architecture Overview

The taxi app now supports real ML model integration through a Python service that can be deployed separately from the main NodeJS backend. The integration uses HTTP communication with built-in fallback mechanisms.

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│  NodeJS Backend │ ──────────────► │  Python ML      │
│  (Ride Service) │                │  Service        │
│                 │ ◄────────────── │  (Port 5001)    │
└─────────────────┘   JSON Response └─────────────────┘
```

## Quick Start

### 1. Start the ML Service

```bash
# Navigate to ML service directory
cd ml_service

# Install dependencies
pip install -r requirements.txt

# Start the service
python ml_service.py
```

The ML service will be available at `http://localhost:5001`

### 2. Configure the Backend

Set the following environment variables for the backend:

```bash
# Required
ML_SERVICE_URL=http://localhost:5001

# Optional (with defaults)
ML_SERVICE_TIMEOUT=5000
ML_SERVICE_RETRY_ATTEMPTS=3
ML_SERVICE_FALLBACK_TO_STUB=true
ML_SERVICE_CACHE_ENABLED=true
ML_SERVICE_CACHE_TTL=300
```

### 3. Test the Integration

Use the existing ride evaluation API:

```bash
POST /api/rides/evaluate-ride
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "start_latitude": 53.349805,
  "start_longitude": -6.260310,
  "destination_latitude": 53.343794,
  "destination_longitude": -6.254573
}
```

Response:
```json
{
  "success": true,
  "rating": 4
}
```

## Integration Features

### 1. **HTTP-based Communication**
- Clean REST API between services
- JSON request/response format
- Timeout handling and retries

### 2. **Caching**
- In-memory caching of ML predictions
- Configurable TTL (default 5 minutes)
- Automatic cache cleanup

### 3. **Fallback Mechanism**
- Automatic fallback to stub when ML service is unavailable
- Configurable fallback behavior
- Graceful degradation

### 4. **Error Handling**
- Comprehensive error types and messages
- Retry logic with exponential backoff
- Circuit breaker pattern for service health

### 5. **Health Monitoring**
- Health check endpoint
- Periodic health status updates
- Service availability tracking

## Configuration Options

### Backend Configuration (`apps/backend/.env`)

```env
# ML Service Configuration
ML_SERVICE_URL=http://localhost:5001
ML_SERVICE_TIMEOUT=5000
ML_SERVICE_RETRY_ATTEMPTS=3
ML_SERVICE_FALLBACK_TO_STUB=true
ML_SERVICE_CACHE_ENABLED=true
ML_SERVICE_CACHE_TTL=300
ML_SERVICE_HEALTH_CHECK_INTERVAL=30000
ML_SERVICE_ENABLE_LOGGING=true
ML_SERVICE_LOG_LEVEL=info
```

### Python ML Service Configuration

```bash
# Environment variables for ML service
PORT=5001
DEBUG=false
```

## Code Examples

### Backend Usage

```typescript
import { mlService } from './utils/mlService';

// Evaluate ride coordinates
const score = await mlService.evaluateRide(
  startLat, startLng, destLat, destLng
);

// Check service health
const health = await mlService.getHealthStatus();
console.log('ML Service healthy:', health.healthy);

// Get cache statistics
const stats = mlService.getCacheStats();
console.log('Cache size:', stats.size);
```

### Python ML Service

```python
# Example of adding a new ML model
class CustomRideScorePredictor:
    def __init__(self, model_path):
        self.model = joblib.load(model_path)
    
    def predict(self, start_lat, start_lng, dest_lat, dest_lng):
        features = np.array([[start_lat, start_lng, dest_lat, dest_lng]])
        prediction = self.model.predict(features)[0]
        confidence = self.model.predict_proba(features).max()
        return prediction, confidence
```

## Testing

### Unit Tests

```bash
# Run ML integration tests
npm test --workspace=backend -- --testPathPattern=ml
```

### Integration Tests

```bash
# Test ML service directly
cd ml_service
python test_ml_service.py

# Test full API integration
npm test --workspace=backend -- --testPathPattern=rideAPI
```

## Deployment

### Docker Compose

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
    build: ./ml_service
    ports:
      - "5001:5001"
```

### Kubernetes

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
```

## Monitoring

### Health Checks

The ML service provides several monitoring endpoints:

- `GET /health` - Service health status
- `GET /info` - Service information and metadata

### Metrics

Monitor these key metrics:

- Request/response times
- Error rates
- Cache hit/miss ratios
- Model prediction accuracy
- Service availability

### Logging

Both services provide structured logging:

```typescript
// Backend logs
console.log('ML prediction successful:', { score, coordinates });
console.error('ML Service error:', error);
```

```python
# Python service logs
logger.info(f"Prediction made: score={score}, coords=[{lat},{lng}]")
logger.error(f"Prediction error: {str(e)}")
```

## Troubleshooting

### Common Issues

1. **ML Service Not Available**
   - Check if service is running on correct port
   - Verify network connectivity
   - Check firewall settings

2. **High Response Times**
   - Enable caching
   - Optimize ML model inference
   - Add load balancing

3. **Memory Issues**
   - Monitor cache size
   - Adjust cache TTL
   - Optimize model memory usage

### Debug Commands

```bash
# Check ML service health
curl http://localhost:5001/health

# Test prediction endpoint
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"start_latitude": 53.349805, "start_longitude": -6.260310, "destination_latitude": 53.343794, "destination_longitude": -6.254573}'

# View service logs
docker-compose logs ml-service
```

## Security Considerations

1. **API Authentication**: Add API keys or JWT tokens
2. **Input Validation**: Validate all coordinate inputs
3. **Rate Limiting**: Prevent API abuse
4. **Network Security**: Use HTTPS in production
5. **Data Privacy**: Ensure compliance with regulations

## Performance Optimization

1. **Caching Strategy**: Implement multi-level caching
2. **Model Optimization**: Use optimized ML frameworks
3. **Load Balancing**: Distribute requests across multiple instances
4. **Async Processing**: Use async/await for non-blocking operations

## Future Enhancements

1. **Model Versioning**: Support A/B testing of different models
2. **Batch Processing**: Process multiple predictions in single request
3. **Real-time Updates**: Stream model updates
4. **Advanced Monitoring**: Add detailed performance metrics
5. **Auto-scaling**: Automatically scale based on demand

This integration provides a solid foundation for connecting NodeJS to Python ML models while maintaining high availability and performance.