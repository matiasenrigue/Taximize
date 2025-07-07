# ML Service

This directory contains a sample Python ML service that provides ride score predictions.

## Setup

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the service:
   ```bash
   python ml_service.py
   ```

3. The service will be available at `http://localhost:5001`

## API Endpoints

### POST /predict
Predict ride score based on coordinates.

**Request:**
```json
{
  "start_latitude": 53.349805,
  "start_longitude": -6.260310,
  "destination_latitude": 53.343794,
  "destination_longitude": -6.254573
}
```

**Response:**
```json
{
  "predicted_score": 4,
  "confidence": 0.85,
  "model_version": "1.0.0",
  "timestamp": "2024-01-01T12:00:00"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00",
  "model_version": "1.0.0",
  "service": "ml-service"
}
```

### GET /info
Service information endpoint.

**Response:**
```json
{
  "service_name": "Taxi Ride Score ML Service",
  "version": "1.0.0",
  "model_version": "1.0.0",
  "features": ["start_lat", "start_lng", "dest_lat", "dest_lng", "distance", "hour"],
  "endpoints": {
    "predict": "/predict",
    "health": "/health",
    "info": "/info"
  },
  "description": "ML service for predicting taxi ride scores based on pickup and destination coordinates"
}
```

## Configuration

The service can be configured using environment variables:

- `PORT`: Port to run the service on (default: 5001)
- `DEBUG`: Enable debug mode (default: false)

## Docker Support

To run with Docker:

1. Build the image:
   ```bash
   docker build -t taxi-ml-service .
   ```

2. Run the container:
   ```bash
   docker run -p 5001:5001 taxi-ml-service
   ```

## Production Considerations

This is a simple example service. For production use, consider:

1. **Model Management**: Use a proper model registry and versioning
2. **Monitoring**: Add metrics collection and alerting
3. **Scalability**: Use WSGI servers like Gunicorn or uWSGI
4. **Security**: Add authentication and input validation
5. **Performance**: Optimize model loading and inference
6. **Caching**: Cache predictions for repeated requests