import { getZonesForRide } from './utils/zoneDetector';
import { scoreTripXGB, formatDateTimeForScoring } from '../../shared/utils/dataApiClient';
import { RIDE_CONSTANTS } from './ride.constants';
import { RideCoordinates, RideEvaluation } from './ride.types';
import { RideValidators } from './ride.validators';

export class RideMLService {
    
    static async evaluateRideScore(coords: Partial<RideCoordinates>): Promise<RideEvaluation> {

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
            const prediction = scoreResult.predicted_score / 100;
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
    
    private static convertPredictionToRating(prediction: number): number {
        // Convert 0-1 scale to 1-5 rating scale
        // Formula: rating = 1 + (prediction * 4)
        // This maps: 0 -> 1, 0.25 -> 2, 0.5 -> 3, 0.75 -> 4, 1 -> 5
        const rating = Math.round(1 + (prediction * 4));
        return Math.max(
            RIDE_CONSTANTS.PREDICTION_SCALE.RATING_MIN,
            Math.min(RIDE_CONSTANTS.PREDICTION_SCALE.RATING_MAX, rating)
        );
    }
    
    /**
     * Evaluates ride coordinates and returns a rating
     * This is a simplified interface that validates coordinates before evaluation
     */
    static async evaluateRide(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number> {

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