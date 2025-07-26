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
 * Manages driver rides - lifecycle, eligibility checks, and ML scoring.
 */
export class RideService {


    /**
     * Checks if driver has an active ride.
     */
    static async hasActiveRide(driverId: string): Promise<boolean> {
        const activeShift = await ShiftRepository.findActiveByDriverId(driverId);

        if (!activeShift) return false;

        return RideRepository.hasActiveRideForShift(activeShift.id);
    }



    /**
     * Checks if driver can start a new ride.
     * Validates: active shift, not paused, no ride in progress.
     */
    static async canStartRide(driverId: string): Promise<{ canStart: boolean; reason?: string }> {
        const activeShift = await ShiftRepository.findActiveByDriverId(driverId);

        if (!activeShift) {
            return { canStart: false, reason: RIDE_ERRORS.NO_ACTIVE_SHIFT };
        }

        // Need most recent signal to check pause state
        const lastSignal = await ShiftSignal.findOne({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']]
        });

        if (lastSignal && lastSignal.signal === 'pause') {
            return { canStart: false, reason: RIDE_ERRORS.PAUSED_SHIFT };
        }

        const hasActive = await this.hasActiveRide(driverId);
        if (hasActive) {
            return { canStart: false, reason: RIDE_ERRORS.RIDE_IN_PROGRESS };
        }

        return { canStart: true };
    }



    
    /**
     * Gets ML prediction score for ride coordinates.
     * @returns 1-5 rating or null if ML unavailable
     */
    static async evaluateRide(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number | null> {
        return RideMLService.evaluateRide(startLat, startLng, destLat, destLng);
    }



    /**
     * Starts a new ride for driver.
     * @param coords - Start/dest coordinates with predicted score
     * @throws If driver can't start ride or bad coordinates
     */
    static async startRide(driverId: string, shiftId: string, coords: RideCoordinates): Promise<{
        rideId: string;
        startTime: number;
        predictedScore: number | null;
    }> {
        RideValidators.validateCoordinates(coords);

        const canStartResult = await this.canStartRide(driverId);
        if (!canStartResult.canStart) {
            throw new Error(canStartResult.reason || 'Cannot start ride');
        }

        const predictedScore = coords.predictedScore;
        // FUTURE FIX
        // Solving Bug: FE hardcoded score to 0.5, we round it to interger
        // Reason: Confusion with Data team, we thought score was between 0-1, but is actually 1-5,
        // so all validations break, and we have to hardcode it to 0-1, even though it is not correct.
        // The user still sees the correct score, but we store it as 0-1 (which does not matter since we don't display historical records on scores)
        const roundedPredictedScore = predictedScore !== null && predictedScore !== undefined 
            ? Math.round(predictedScore) 
            : null;
            
        const startTime = coords.timestamp ? new Date(coords.timestamp) : new Date();
            const ride = await RideRepository.create({
                shift_id: shiftId,
                driver_id: driverId,
                start_latitude: coords.startLat,
                start_longitude: coords.startLng,
                destination_latitude: coords.destLat,
                destination_longitude: coords.destLng,
                address: coords.address || "Address not provided",
                start_time: startTime,
                predicted_score: roundedPredictedScore,
                end_time: null,
                earning_cents: null,
                earning_per_min: null,
                distance_km: null
            });

            return {
                rideId: ride.id,
                startTime: ride.start_time.getTime(),
                predictedScore: roundedPredictedScore
            };
    }


    /**
     * Ends ride and calculates final earnings.
     * Also updates shift statistics.
     * @throws If ride not found or already ended
     */
    static async endRide(rideId: string, fareCents: number, actualDistanceKm: number, timestamp?: number): Promise<{
        rideId: string;
        totalTimeMs: number;
        distanceKm: number;
        earningCents: number;
        earningPerMin: number;
    }> {
        const ride = await RideRepository.findById(rideId);
        
        if (!ride) {
            throw new Error(RIDE_ERRORS.NOT_FOUND);
        }

        if (ride.end_time !== null) {
            throw new Error(RIDE_ERRORS.ALREADY_ENDED);
        }

        const endTime = timestamp ? new Date(timestamp) : new Date();
        const totalTimeMs = endTime.getTime() - ride.start_time.getTime();
        const earningPerMin = Math.round((fareCents / (totalTimeMs / (1000 * 60))));

        await RideRepository.update(ride, {
            end_time: endTime,
            earning_cents: fareCents,
            earning_per_min: earningPerMin,
            distance_km: actualDistanceKm
        });

        // Need to update shift stats with this completed ride
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
        const activeShift = await ShiftRepository.findActiveByDriverId(driverId);

        if (!activeShift) {
            throw new Error(RIDE_ERRORS.NO_ACTIVE_SHIFT_STATUS);
        }

        const activeRide = await RideRepository.findActiveByShift(activeShift.id);

        if (!activeRide) {
            throw new Error('No active ride found. Please start a ride first.');
        }

        const currentTime = new Date();
        const elapsedTimeMs = currentTime.getTime() - activeRide.start_time.getTime();

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