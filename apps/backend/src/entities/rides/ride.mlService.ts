import { getZonesForRide } from './utils/zoneDetector';
import { scoreTripXGB, formatDateTimeForScoring } from '../../shared/utils/dataApiClient';
import { RIDE_CONSTANTS } from './ride.constants';
import { RideCoordinates } from './ride.types';
import { RideValidators } from './ride.validators';

/**
 * Service for ML-based ride evaluation and scoring.
 * 
 * Integrates with machine learning models to predict ride quality
 * and profitability based on location zones and timing. Provides
 * fallback behavior when ML services are unavailable.
 */
export class RideMLService {
    

    /**
     * Evaluates a ride using ML scoring and zone detection.
     * 
     * Determines origin/destination zones from coordinates and queries
     * the ML API for a quality prediction. Falls back to default rating
     * if ML service is unavailable. (value of "error", to let Frontend know that ML service is not available)
     * 
     * @param coords - Partial ride coordinates (requires all lat/lng values)
     * @returns Object containing rating (1-5) and detected zones
     * @throws Error if coordinates are missing or zones cannot be determined
     */
    static async evaluateRideScore(coords: Partial<RideCoordinates>): Promise<{
        rating: number | null;
        zones: {
            originZone: string | null;
            destinationZone: string | null;
        };
    }> {

        if (!coords.startLat || !coords.startLng || !coords.destLat || !coords.destLng) {
            throw new Error('Missing required coordinates for evaluation');
        }

        // Get zones
        const zones = getZonesForRide(
            coords.startLat, 
            coords.startLng, 
            coords.destLat, 
            coords.destLng
        );
        
        if (!zones.originZone || !zones.destinationZone) {
            throw new Error('Could not determine zones for coordinates');
        }
        
        try {
            // Call ML API
            const scoreResult = await scoreTripXGB({
                pickup_zone: zones.originZone,
                dropoff_zone: zones.destinationZone,
                pickup_datetime: formatDateTimeForScoring(new Date())
            });
            
            // Validate and convert score
            const prediction = scoreResult.percentile / 100;
            RideValidators.validatePredictionScore(prediction);
            
            const rating = this.convertPredictionToRating(prediction);
            
            return { rating, zones };
            
        } catch (error) {
            console.error('ML scoring error:', error);
            return { 
                rating: RIDE_CONSTANTS.DEFAULT_RATING, 
                zones 
            };
        }
    }
    
    /**
     * Converts ML prediction score to user-facing rating.
     * 
     * Maps the 0-1 probability scale from ML model to a 1-5 star rating.
     * Formula: rating = 1 + (prediction * 4)
     * This maps: 0 -> 1, 0.25 -> 2, 0.5 -> 3, 0.75 -> 4, 1 -> 5
     * 
     * @param prediction - ML prediction score (0-1 scale)
     * @returns Rating on 1-5 scale, clamped to valid bounds
     */
    private static convertPredictionToRating(prediction: number): number {
        const rating = Math.round(1 + (prediction * 4));
        return Math.max(
            RIDE_CONSTANTS.PREDICTION_SCALE.RATING_MIN,
            Math.min(RIDE_CONSTANTS.PREDICTION_SCALE.RATING_MAX, rating)
        );
    }
    
    /**
     * Evaluates ride coordinates and returns a rating.
     * 
     * This is a simplified interface that validates coordinates before evaluation.
     * Used by the service layer for quick rating retrieval.
     * 
     * @param startLat - Starting latitude coordinate
     * @param startLng - Starting longitude coordinate
     * @param destLat - Destination latitude coordinate
     * @param destLng - Destination longitude coordinate
     * @returns Promise<number> - Rating on 1-5 scale
     * @throws Error if coordinates are invalid
     */
    static async evaluateRide(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number | null> {

        // Validate coordinates
        RideValidators.validateCoordinates({ startLat, startLng, destLat, destLng });
        
        const evaluation = await this.evaluateRideScore({ 
            startLat, 
            startLng, 
            destLat, 
            destLng 
        });
        
        return evaluation.rating;
    }
}