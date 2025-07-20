import { RIDE_CONSTANTS, RIDE_ERRORS } from './ride.constants';
import { RideCoordinates, RideUpdateData } from './ride.types';
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
    }

    static validateUpdateData(updateData: RideUpdateData, ride: Ride): void {
        // Validate end time
        if (updateData.end_time) {
            const endTime = new Date(updateData.end_time);
            if (endTime <= ride.start_time) {
                throw new Error('End time must be after start time');
            }
        }

        // Validate earnings
        if (updateData.earning_cents !== undefined && updateData.earning_cents <= 0) {
            throw new Error('Earning must be positive');
        }

        // Validate distance
        if (updateData.distance_km !== undefined && updateData.distance_km <= 0) {
            throw new Error('Distance must be positive');
        }
    }

    static validateForbiddenFields(updateData: any): void {
        const forbiddenFields = ['id', 'shift_id', 'driver_id', 'start_time', 'start_latitude', 'start_longitude', 'predicted_score'];
        for (const field of forbiddenFields) {
            if (field in updateData) {
                throw new Error(`Cannot modify ${field}`);
            }
        }
    }
}