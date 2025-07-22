import { RIDE_CONSTANTS, RIDE_ERRORS } from './ride.constants';
import { RideCoordinates } from './ride.types';
import { Ride } from './ride.model';

/**
 * Validation utilities for ride-related data.
 * 
 * Provides methods to validate coordinates, prediction scores,
 * and other ride data before processing or storage.
 */
export class RideValidators {

    /**
     * Validates ride coordinates for geographic validity.
     * 
     * Checks that all provided coordinates fall within valid
     * latitude and longitude bounds.
     * 
     * @param coords - Partial ride coordinates to validate
     * @throws Error if any coordinate is out of bounds
     */
    static validateCoordinates(coords: Partial<RideCoordinates>): void {
        const { startLat, startLng, destLat, destLng } = coords;
        
        if (startLat !== undefined) {
            this.validateLatitude(startLat);
        }
        if (startLng !== undefined) {
            this.validateLongitude(startLng);
        }
        if (destLat !== undefined) {
            this.validateLatitude(destLat);
        }
        if (destLng !== undefined) {
            this.validateLongitude(destLng);
        }
    }

    /**
     * Validates a latitude value.
     * @param lat - Latitude to validate (-90 to 90)
     * @throws Error if latitude is out of bounds
     */
    private static validateLatitude(lat: number): void {
        if (lat < RIDE_CONSTANTS.COORDINATE_BOUNDS.LATITUDE.MIN || 
            lat > RIDE_CONSTANTS.COORDINATE_BOUNDS.LATITUDE.MAX) {
            throw new Error(RIDE_ERRORS.INVALID_LATITUDE);
        }
    }

    /**
     * Validates a longitude value.
     * @param lng - Longitude to validate (-180 to 180)
     * @throws Error if longitude is out of bounds
     */
    private static validateLongitude(lng: number): void {
        if (lng < RIDE_CONSTANTS.COORDINATE_BOUNDS.LONGITUDE.MIN || 
            lng > RIDE_CONSTANTS.COORDINATE_BOUNDS.LONGITUDE.MAX) {
            throw new Error(RIDE_ERRORS.INVALID_LONGITUDE);
        }
    }

    /**
     * Validates an ML prediction score.
     * 
     * Ensures the score falls within the expected range (0-1)
     * before it's converted to a user-facing rating.
     * 
     * @param score - Prediction score to validate (0-1 scale)
     * @throws Error if score is out of bounds
     */
    static validatePredictionScore(score: number): void {
        if (score < RIDE_CONSTANTS.PREDICTION_SCALE.MIN || 
            score > RIDE_CONSTANTS.PREDICTION_SCALE.MAX) {
            throw new Error(`Invalid prediction score. Must be between ${RIDE_CONSTANTS.PREDICTION_SCALE.MIN} and ${RIDE_CONSTANTS.PREDICTION_SCALE.MAX}`);
        }
    }}