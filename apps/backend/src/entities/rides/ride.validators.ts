import { RIDE_CONSTANTS, RIDE_ERRORS } from './ride.constants';
import { RideCoordinates } from './ride.types';
import { Ride } from './ride.model';

export class RideValidators {

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

    private static validateLatitude(lat: number): void {
        if (lat < RIDE_CONSTANTS.COORDINATE_BOUNDS.LATITUDE.MIN || 
            lat > RIDE_CONSTANTS.COORDINATE_BOUNDS.LATITUDE.MAX) {
            throw new Error(RIDE_ERRORS.INVALID_LATITUDE);
        }
    }

    private static validateLongitude(lng: number): void {
        if (lng < RIDE_CONSTANTS.COORDINATE_BOUNDS.LONGITUDE.MIN || 
            lng > RIDE_CONSTANTS.COORDINATE_BOUNDS.LONGITUDE.MAX) {
            throw new Error(RIDE_ERRORS.INVALID_LONGITUDE);
        }
    }

    static validatePredictionScore(score: number): void {
        if (score < RIDE_CONSTANTS.PREDICTION_SCALE.MIN || 
            score > RIDE_CONSTANTS.PREDICTION_SCALE.MAX) {
            throw new Error(`Invalid prediction score. Must be between ${RIDE_CONSTANTS.PREDICTION_SCALE.MIN} and ${RIDE_CONSTANTS.PREDICTION_SCALE.MAX}`);
        }
    }}