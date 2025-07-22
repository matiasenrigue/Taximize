import { Ride } from './ride.model';
import { Shift } from '../shifts/shift.model';
import { ShiftRepository } from '../shifts/shift.repository';
import { ShiftCalculationUtils } from '../shifts/utils/ShiftCalculationUtils';
import { ShiftSignal } from '../shift-signals/shiftSignal.model';
import { RIDE_ERRORS } from './ride.constants';
import { RideCoordinates } from './ride.types';
import { RideValidators } from './ride.validators';
import { RideRepository } from './ride.repository';
import { RideMLService } from './ride.mlService';


/**
 * Service layer for managing ride operations.
 * 
 * Handles the business logic for ride lifecycle management,
 * including starting rides, ending rides, and checking ride
 * eligibility based on shift and driver status.
 */
export class RideService {


    /**
     * Checks if a driver currently has an active ride.
     * 
     * @param driverId - The unique identifier of the driver
     * @returns Promise<boolean> - True if driver has an active ride
     */
    static async hasActiveRide(driverId: string): Promise<boolean> {
        // Get active shift for driver first
        const activeShift = await ShiftRepository.findActiveByDriverId(driverId);

        if (!activeShift) return false;

        return RideRepository.hasActiveRideForShift(activeShift.id);
    }



    /**
     * Validates whether a driver can start a new ride.
     * 
     * Checks multiple conditions:
     * - Driver must have an active shift
     * - Shift must not be paused
     * - Driver must not have another ride in progress
     * 
     * @param driverId - The unique identifier of the driver
     * @returns Promise with canStart boolean and optional reason for denial
     */
    static async canStartRide(driverId: string): Promise<{ canStart: boolean; reason?: string }> {
        // Check if driver has active shift
        const activeShift = await ShiftRepository.findActiveByDriverId(driverId);

        if (!activeShift) {
            return { canStart: false, reason: RIDE_ERRORS.NO_ACTIVE_SHIFT };
        }

        // Check if driver is paused
        const lastSignal = await ShiftSignal.findOne({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']]
        });

        if (lastSignal && lastSignal.signal === 'pause') {
            return { canStart: false, reason: RIDE_ERRORS.PAUSED_SHIFT };
        }

        // Check if driver already has an active ride
        const hasActive = await this.hasActiveRide(driverId);
        if (hasActive) {
            return { canStart: false, reason: RIDE_ERRORS.RIDE_IN_PROGRESS };
        }

        return { canStart: true };
    }



    
    /**
     * Evaluates a potential ride using machine learning service.
     * 
     * @param startLat - Starting latitude coordinate
     * @param startLng - Starting longitude coordinate
     * @param destLat - Destination latitude coordinate
     * @param destLng - Destination longitude coordinate
     * @returns Promise<number | null> - Predicted score (1-5 scale) or null if ML service unavailable
     */
    static async evaluateRide(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number | null> {
        return RideMLService.evaluateRide(startLat, startLng, destLat, destLng);
    }



    /**
     * Starts a new ride for a driver.
     * 
     * Creates a new ride record after validating the driver's eligibility
     * and ride coordinates. Associates the ride with the current shift.
     * 
     * @param driverId - The unique identifier of the driver
     * @param shiftId - The active shift ID
     * @param coords - Ride coordinates including start/dest points and predicted score
     * @returns Ride details including ID, start time, and predicted score
     * @throws Error if driver cannot start ride or coordinates are invalid
     */
    static async startRide(driverId: string, shiftId: string, coords: RideCoordinates): Promise<{
        rideId: string;
        startTime: number;
        predictedScore: number | null;
    }> {
        // Validate coordinates
        RideValidators.validateCoordinates(coords);

        // Check if driver can start ride
        const canStartResult = await this.canStartRide(driverId);
        if (!canStartResult.canStart) {
            throw new Error(canStartResult.reason || 'Cannot start ride');
        }

        // Use predicted score from request
        const predictedScore = coords.predictedScore;

        // Use provided timestamp or current time
        const startTime = coords.timestamp ? new Date(coords.timestamp) : new Date();

        // Create new ride
        const ride = await RideRepository.create({
            shift_id: shiftId,
            driver_id: driverId,
            start_latitude: coords.startLat,
            start_longitude: coords.startLng,
            destination_latitude: coords.destLat,
            destination_longitude: coords.destLng,
            address: coords.address || "Address not provided",
            start_time: startTime,
            predicted_score: predictedScore,
            end_time: null,
            earning_cents: null,
            earning_per_min: null,
            distance_km: null
        });

        return {
            rideId: ride.id,
            startTime: ride.start_time.getTime(),
            predictedScore: predictedScore
        };
    }


    /**
     * Ends an active ride and calculates final metrics.
     * 
     * Updates the ride with final earnings, distance, and duration.
     * Also triggers recalculation of shift statistics to include
     * the completed ride data.
     * 
     * @param rideId - The unique identifier of the ride to end
     * @param fareCents - Total fare earned in cents
     * @param actualDistanceKm - Actual distance traveled in kilometers
     * @param timestamp - Optional end timestamp (defaults to current time)
     * @returns Ride summary with final metrics
     * @throws Error if ride not found or already ended
     */
    static async endRide(rideId: string, fareCents: number, actualDistanceKm: number, timestamp?: number): Promise<{
        rideId: string;
        totalTimeMs: number;
        distanceKm: number;
        earningCents: number;
        earningPerMin: number;
    }> {
        // Find the active ride
        const ride = await RideRepository.findById(rideId);
        
        if (!ride) {
            throw new Error(RIDE_ERRORS.NOT_FOUND);
        }

        if (ride.end_time !== null) {
            throw new Error(RIDE_ERRORS.ALREADY_ENDED);
        }

        // Use provided timestamp or current time
        const endTime = timestamp ? new Date(timestamp) : new Date();
        const totalTimeMs = endTime.getTime() - ride.start_time.getTime();
        const earningPerMin = Math.round((fareCents / (totalTimeMs / (1000 * 60))));

        // Update the ride
        await RideRepository.update(ride, {
            end_time: endTime,
            earning_cents: fareCents,
            earning_per_min: earningPerMin,
            distance_km: actualDistanceKm
        });

        // Recalculate shift statistics for ride data only
        const shift = await Shift.findByPk(ride.shift_id);
        if (shift) {
            const rides = await RideRepository.findAllByShift(shift.id);
            await ShiftCalculationUtils.updateShiftCalculations(shift, 'onlyRideData', undefined, rides);
        }

        return {
            rideId: ride.id,
            totalTimeMs: totalTimeMs,
            distanceKm: actualDistanceKm,
            earningCents: fareCents,
            earningPerMin: earningPerMin
        };
    }

    
    static async getRideStatus(driverId: string): Promise<{
        rideId: string;
        startLatitude: number;
        startLongitude: number;
        currentDestinationLatitude: number;
        currentDestinationLongitude: number;
        startTime: number;
        address: string;
        elapsedTimeMs: number;
    }> {
        // Get active shift for driver first
        const activeShift = await ShiftRepository.findActiveByDriverId(driverId);

        if (!activeShift) {
            throw new Error(RIDE_ERRORS.NO_ACTIVE_SHIFT_STATUS);
        }

        // Find active ride for driver
        const activeRide = await RideRepository.findActiveByShift(activeShift.id);

        if (!activeRide) {
            throw new Error('No active ride found. Please start a ride first.');
        }

        const currentTime = new Date();
        const elapsedTimeMs = currentTime.getTime() - activeRide.start_time.getTime();

        // Use original destination coordinates
        const destLat = activeRide.destination_latitude;
        const destLng = activeRide.destination_longitude;

        return {
            rideId: activeRide.id,
            startLatitude: activeRide.start_latitude,
            startLongitude: activeRide.start_longitude,
            currentDestinationLatitude: destLat,
            currentDestinationLongitude: destLng,
            startTime: activeRide.start_time.getTime(),
            address: activeRide.address,
            elapsedTimeMs: elapsedTimeMs,
        };
    }


} 