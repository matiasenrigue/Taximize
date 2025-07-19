# TaxiApp ML Integration Implementation Plan

## Overview
This document provides a detailed technical plan for integrating the Data Team's Machine Learning capabilities with the Backend API to bridge the current functionality gap.

## Current ML Assets Inventory

### 1. Trip Scoring Models (Available)
- **XGBoost Model**: `scoring_model/models/July/model_july_xgb.pkl`
- **LightGBM Model**: `scoring_model/models/July/model_july_lgb.pkl`
- **Feature Scalers**: `scoring_model/models/July/scaler_july.pkl`
- **Scoring Weights**: `scoring_model/models/July/scoring_weights_july.json`
- **Hotness Tables**: `scoring_model/models/July/hotness_table_july.csv`
- **Duration Data**: `scoring_model/models/July/duration_variability_july.csv`
- **Column Definitions**: `scoring_model/models/expected_columns/`

### 2. Hotspot Prediction Models (Available)
- **Monthly Models**: `hotspot_model/models/hotspot_model_X_to_Y.pkl` (2-12 months)
- **Feature Engineering**: `hotspot_model/model_features.pkl`
- **Target Encodings**: Multiple interaction encoding maps in `encoding_maps/`
- **Zone Mappings**: `hotspot_model/zone_coordinates.csv`

### 3. Flask API Service (Ready)
- **Combined Service**: `combined_flask_app/flask_app.py`
- **Endpoints**: `/score_xgb`, `/score_lgbm`, `/hotspots`
- **Dependencies**: Listed in `requirements.txt`

## Integration Architecture

### Phase 1: Service Integration Layer
```
┌─────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Frontend  │───▶│ Express Backend │───▶│ Flask ML Service │
│  (Next.js)  │    │   (Port 3001)   │    │   (Port 5000)    │
└─────────────┘    └─────────────────┘    └──────────────────┘
                           │
                           ▼
                   ┌─────────────────┐
                   │   PostgreSQL    │
                   │   Database      │
                   └─────────────────┘
```

### Phase 2: Backend API Extensions

#### 2.1 New Ride Evaluation Endpoint Enhancement
**Current**: `POST /api/rides/evaluate-ride` (basic evaluation)
**Enhanced**: Integrate with ML scoring models

```typescript
// New enhanced ride evaluation
interface MLRideEvaluationRequest {
  pickup_zone: string;
  dropoff_zone: string;
  pickup_datetime: string; // ISO format
}

interface MLRideEvaluationResponse {
  basic_score: number;        // Existing basic evaluation
  ml_scores: {
    xgb_score: number;        // XGBoost profitability score (0-1)
    lgbm_score: number;       // LightGBM profitability score (0-1)
    ensemble_score: number;   // Weighted combination
    confidence: number;       // Prediction confidence
  };
  factors: {
    pickup_hotness: number;
    dropoff_hotness: number;
    duration_variability: number;
    time_factors: object;
  };
}
```

#### 2.2 New Dynamic Hotspots Endpoint
**New**: `GET /api/hotspots/predictions?time={ISO_TIMESTAMP}`

```typescript
interface HotspotPrediction {
  pickup_zone: string;
  location_id: number;
  predicted_trip_count: number;
  confidence_score: number;
  rank: number;              // 1-265 ranking
  last_updated: string;
}

interface HotspotPredictionsResponse {
  timestamp: string;
  predictions: HotspotPrediction[];
  model_info: {
    model_month: number;
    features_used: string[];
    prediction_horizon: string;
  };
}
```

### Phase 3: Implementation Steps

#### Step 3.1: ML Service Client (Backend)
Create `src/shared/services/mlService.ts`:

```typescript
class MLService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
    this.timeout = 5000; // 5 second timeout
  }

  async scoreTripXGB(request: MLRideEvaluationRequest): Promise<any> {
    // Call Flask /score_xgb endpoint
  }

  async scoreTripLGBM(request: MLRideEvaluationRequest): Promise<any> {
    // Call Flask /score_lgbm endpoint
  }

  async getHotspotPredictions(time?: string): Promise<any> {
    // Call Flask /hotspots endpoint
  }

  // Error handling and fallback mechanisms
  private async withFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error('ML Service error:', error);
      return fallback;
    }
  }
}
```

#### Step 3.2: Enhanced Ride Controller
Modify `src/entities/rides/ride.controller.ts`:

```typescript
class RideController {
  static async evaluateRide(req: Request, res: Response): Promise<void> {
    try {
      // Existing basic evaluation logic
      const basicScore = await existingEvaluationLogic(req.body);
      
      // New ML-powered evaluation
      const mlService = new MLService();
      const mlScores = await mlService.withFallback(
        () => mlService.scoreTripXGB(req.body),
        { predicted_score: null, final_score: null }
      );

      const response = {
        basic_evaluation: basicScore,
        ml_evaluation: mlScores,
        enhanced: mlScores.predicted_score !== null
      };

      res.json(response);
    } catch (error) {
      // Error handling
    }
  }
}
```

#### Step 3.3: New Hotspots Controller
Create `src/entities/hotspots/hotspots.controller.ts`:

```typescript
class HotspotsController {
  static async getHotspots(req: Request, res: Response): Promise<void> {
    // Existing static hotspots logic
  }

  static async getPredictiveHotspots(req: Request, res: Response): Promise<void> {
    try {
      const time = req.query.time as string;
      const mlService = new MLService();
      
      const predictions = await mlService.withFallback(
        () => mlService.getHotspotPredictions(time),
        []
      );

      // Enhance predictions with zone metadata from database
      const enhancedPredictions = await enhanceWithZoneData(predictions);

      res.json({
        success: true,
        data: enhancedPredictions,
        cached: false, // TODO: Implement caching
        generated_at: new Date().toISOString()
      });
    } catch (error) {
      // Error handling with fallback to static hotspots
    }
  }
}
```

#### Step 3.4: Frontend Integration Points

1. **Enhanced Ride Evaluation Modal**
   - Display ML confidence scores
   - Show profitability predictions
   - Provide trip recommendation reasoning

2. **Predictive Hotspot Map Overlay**
   - Real-time hotspot predictions on map
   - Color-coded intensity based on predicted demand
   - Auto-refresh every 15 minutes

3. **Smart Dashboard Widgets**
   - "Best Zones Now" recommendations
   - "Optimal Trip Score" indicators
   - Performance trend predictions

### Phase 4: Production Considerations

#### 4.1 Caching Strategy
- **Hotspot Predictions**: Cache for 15-minute intervals
- **Trip Scoring Models**: Load models into memory for faster inference
- **Zone Metadata**: Cache zone information for 24 hours

#### 4.2 Error Handling & Resilience
- **Circuit Breaker Pattern**: Prevent cascading failures
- **Graceful Degradation**: Fall back to basic functionality when ML unavailable
- **Health Checks**: Monitor ML service availability

#### 4.3 Performance Optimization
- **Async Processing**: Non-blocking ML calls
- **Connection Pooling**: Reuse HTTP connections to Flask service
- **Request Batching**: Batch multiple predictions when possible

#### 4.4 Monitoring & Observability
- **ML Service Metrics**: Response times, error rates, prediction accuracy
- **User Experience Metrics**: Feature adoption, prediction usage
- **System Health**: Memory usage, model loading times

### Phase 5: Development Timeline

| Week | Tasks | Deliverables |
|------|-------|-------------|
| 1 | ML Service Client Implementation | Working ML service integration layer |
| 2 | Enhanced Ride Evaluation API | Updated ride evaluation with ML scoring |
| 3 | Predictive Hotspots API | Real-time hotspot prediction endpoint |
| 4 | Frontend Integration | UI components consuming ML features |
| 5 | Testing & QA | Comprehensive test coverage |
| 6 | Production Deployment | Live ML-powered features |

### Phase 6: Success Metrics

#### Technical Metrics
- **ML Service Uptime**: >99.5%
- **API Response Time**: <500ms for ML-enhanced endpoints
- **Prediction Accuracy**: Track prediction vs. actual outcomes
- **Feature Adoption**: % of rides using ML scoring

#### Business Metrics
- **Driver Efficiency**: Average earnings per hour improvement
- **User Engagement**: Time spent using ML-powered features
- **Operational KPIs**: Reduced empty driving time

## Risk Mitigation

### High-Risk Items
1. **ML Service Dependency**: Flask service becomes single point of failure
   - **Mitigation**: Implement circuit breaker and fallback mechanisms

2. **Model Accuracy**: Predictions may not match real-world outcomes
   - **Mitigation**: A/B testing framework to validate model performance

3. **Performance Impact**: ML calls may slow down API responses
   - **Mitigation**: Async processing and aggressive caching

### Medium-Risk Items
1. **Data Freshness**: Models trained on 2023 data may not reflect current patterns
   - **Mitigation**: Plan for model retraining pipeline

2. **Scaling**: Flask service may not handle high concurrent load
   - **Mitigation**: Load balancing and horizontal scaling

## Conclusion

This integration plan bridges the gap between the sophisticated ML capabilities developed by the Data Team and the production-ready Backend API. The phased approach ensures minimal disruption to existing functionality while progressively enhancing the application with AI-powered features.

**Key Success Factor**: Maintaining system reliability while introducing advanced ML capabilities through careful fallback mechanisms and performance optimization.