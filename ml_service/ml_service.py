"""
Example Python ML Service for Taxi Ride Score Prediction

This is a simple Flask-based ML service that provides ride score predictions
based on pickup and destination coordinates.

To run this service:
1. Install dependencies: pip install flask numpy scikit-learn
2. Run the service: python ml_service.py
3. The service will be available at http://localhost:5001
"""

from flask import Flask, request, jsonify
import numpy as np
from datetime import datetime
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class RideScorePredictor:
    """
    Simple ML model for predicting taxi ride scores.
    
    This is a mock implementation for demonstration purposes.
    In a real implementation, you would load a trained model
    from a file or model registry.
    """
    
    def __init__(self):
        self.model_version = "1.0.0"
        self.features = ["start_lat", "start_lng", "dest_lat", "dest_lng", "distance", "hour"]
        logger.info(f"Initialized RideScorePredictor v{self.model_version}")
    
    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate approximate distance between two coordinates"""
        # Simple Euclidean distance approximation
        # In production, use proper geospatial distance calculation
        return np.sqrt((lat2 - lat1)**2 + (lon2 - lon1)**2)
    
    def predict(self, start_lat, start_lng, dest_lat, dest_lng):
        """
        Predict ride score based on coordinates.
        
        This is a simple rule-based prediction for demonstration.
        In a real implementation, this would use a trained ML model.
        """
        try:
            # Calculate features
            distance = self.calculate_distance(start_lat, start_lng, dest_lat, dest_lng)
            hour = datetime.now().hour
            
            # Simple rule-based scoring
            score = 3  # Base score
            
            # Adjust based on distance
            if distance > 0.1:  # Longer rides get higher scores
                score += 1
            if distance > 0.2:
                score += 0.5
            
            # Adjust based on time of day
            if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
                score += 0.5
            elif 22 <= hour or hour <= 5:  # Late night/early morning
                score -= 0.5
            
            # Add some randomness to simulate real model variance
            score += np.random.normal(0, 0.3)
            
            # Ensure score is within valid range
            score = max(1, min(5, score))
            
            return round(score), 0.85  # Return score and confidence
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            return 3, 0.5  # Default score with low confidence

# Initialize the predictor
predictor = RideScorePredictor()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model_version': predictor.model_version,
        'service': 'ml-service'
    })

@app.route('/predict', methods=['POST'])
def predict_ride_score():
    """Predict ride score based on coordinates"""
    try:
        # Parse request data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Extract coordinates
        required_fields = ['start_latitude', 'start_longitude', 'destination_latitude', 'destination_longitude']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        start_lat = float(data['start_latitude'])
        start_lng = float(data['start_longitude'])
        dest_lat = float(data['destination_latitude'])
        dest_lng = float(data['destination_longitude'])
        
        # Validate coordinates
        if not (-90 <= start_lat <= 90) or not (-90 <= dest_lat <= 90):
            return jsonify({'error': 'Invalid latitude values'}), 400
        
        if not (-180 <= start_lng <= 180) or not (-180 <= dest_lng <= 180):
            return jsonify({'error': 'Invalid longitude values'}), 400
        
        # Make prediction
        predicted_score, confidence = predictor.predict(start_lat, start_lng, dest_lat, dest_lng)
        
        # Log the prediction
        logger.info(f"Prediction made: score={predicted_score}, confidence={confidence:.2f}, "
                   f"coords=[{start_lat:.4f},{start_lng:.4f}]->[{dest_lat:.4f},{dest_lng:.4f}]")
        
        return jsonify({
            'predicted_score': predicted_score,
            'confidence': confidence,
            'model_version': predictor.model_version,
            'timestamp': datetime.now().isoformat()
        })
        
    except ValueError as e:
        logger.error(f"Value error: {str(e)}")
        return jsonify({'error': 'Invalid coordinate values'}), 400
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/info', methods=['GET'])
def service_info():
    """Get service information"""
    return jsonify({
        'service_name': 'Taxi Ride Score ML Service',
        'version': '1.0.0',
        'model_version': predictor.model_version,
        'features': predictor.features,
        'endpoints': {
            'predict': '/predict',
            'health': '/health',
            'info': '/info'
        },
        'description': 'ML service for predicting taxi ride scores based on pickup and destination coordinates'
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Starting ML service on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)