import { Ride } from './ride.model';
import { Shift } from '../shifts/shift.model';
import { ShiftCalculationUtils } from '../shifts/utils/ShiftCalculationUtils';
import { ShiftSignal } from '../shifts/shiftSignal.model';
import { RIDE_ERRORS } from './ride.constants';
import { 
    RideCoordinates, 
    RideUpdateData, 
    RideMetrics, 
    StartRideResult, 
    CanStartRideResult, 
    RideStatus 
} from './ride.types';
import { RideValidators } from './ride.validators';
import { RideRepository } from './ride.repository';
import { RideMLService } from './ride.mlService';


export class RideService {
    static async hasActiveRide(driverId: string): Promise<boolean> {
        // Get active shift for driver first
        const activeShift = await Shift.findOne({
            where: { 
                driver_id: driverId,
                shift_end: null
            }
        });

        if (!activeShift) return false;

        return RideRepository.hasActiveRideForShift(activeShift.id);
    }

    static async canStartRide(driverId: string): Promise<CanStartRideResult> {
        // Check if driver has active shift
        const activeShift = await Shift.findOne({
            where: { 
                driver_id: driverId,
                shift_end: null
            }
        });

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

    static async evaluateRide(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number> {
        return RideMLService.evaluateRide(startLat, startLng, destLat, destLng);
    }

    static async startRide(driverId: string, shiftId: string, coords: RideCoordinates): Promise<StartRideResult> {
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
            predicted_score: predictedScore
        };
    }

    static async endRide(rideId: string, fareCents: number, actualDistanceKm: number, timestamp?: number): Promise<RideMetrics> {
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

    static async getRideStatus(driverId: string): Promise<RideStatus> {
        // Get active shift for driver first
        const activeShift = await Shift.findOne({
            where: { 
                driver_id: driverId,
                shift_end: null
            }
        });

        if (!activeShift) {
            throw new Error(RIDE_ERRORS.NO_ACTIVE_SHIFT);
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

    static async manageExpiredRides(): Promise<void> {
        await RideRepository.endExpiredRides();
    }


    static async editRide(rideId: string, driverId: string, updateData: RideUpdateData): Promise<Ride> {
        // Find the ride
        const ride = await RideRepository.findById(rideId);
        if (!ride) {
            throw new Error(RIDE_ERRORS.NOT_FOUND);
        }

        // Check authorization
        if (ride.driver_id !== driverId) {
            throw new Error(RIDE_ERRORS.NOT_AUTHORIZED);
        }

        // Check if ride is active
        if (!ride.end_time) {
            throw new Error(RIDE_ERRORS.CANNOT_EDIT_ACTIVE);
        }

        // Validate forbidden fields
        RideValidators.validateForbiddenFields(updateData);

        // Validate coordinates if provided
        if ('destination_latitude' in updateData || 'destination_longitude' in updateData) {
            const destLat = updateData.destination_latitude || ride.destination_latitude;
            const destLng = updateData.destination_longitude || ride.destination_longitude;
            RideValidators.validateCoordinates({ destLat, destLng });
        }

        // Validate update data
        RideValidators.validateUpdateData(updateData, ride);

        // Update the ride
        await RideRepository.update(ride, updateData);

        // If earnings or distance were updated, recalculate shift statistics
        if ('earning_cents' in updateData || 'distance_km' in updateData) {
            const shift = await Shift.findByPk(ride.shift_id);
            if (shift) {
                const rides = await RideRepository.findAllByShift(shift.id);
                await ShiftCalculationUtils.updateShiftCalculations(shift, 'onlyRideData', undefined, rides);
            }
        }

        return ride;
    }

    static async deleteRide(rideId: string, driverId: string): Promise<void> {
        // Find the ride
        const ride = await RideRepository.findById(rideId);
        if (!ride) {
            throw new Error(RIDE_ERRORS.NOT_FOUND);
        }

        // Check authorization
        if (ride.driver_id !== driverId) {
            throw new Error(RIDE_ERRORS.NOT_AUTHORIZED);
        }

        // Check if ride is active
        if (!ride.end_time) {
            throw new Error(RIDE_ERRORS.CANNOT_DELETE_ACTIVE);
        }

        // Soft delete the ride
        await RideRepository.softDelete(ride);

    }

    static async restoreRide(rideId: string, driverId: string): Promise<void> {
        // Find the deleted ride (paranoid: false to include soft-deleted records)
        const ride = await RideRepository.findById(rideId, true);
        if (!ride) {
            throw new Error(RIDE_ERRORS.NOT_FOUND);
        }

        // Check authorization
        if (ride.driver_id !== driverId) {
            throw new Error(RIDE_ERRORS.NOT_AUTHORIZED);
        }

        // Check if ride is deleted (handle both snake_case and camelCase)
        const deletedAt = ride.deleted_at || (ride as any).deletedAt;
        if (!deletedAt) {
            throw new Error('Ride is not deleted');
        }

        // Restore the ride using repository method
        await RideRepository.restore(ride);

    }

    static async getRidesByDriver(driverId: string): Promise<Ride[]> {
        return await RideRepository.findByDriver(driverId);
    }

} 