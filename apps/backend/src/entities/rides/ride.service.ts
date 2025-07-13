import { Ride } from './ride.model';
import { Shift } from '../shifts/shift.model';
import { ShiftSignal } from '../shifts/shift-signal.model';
import { ShiftService } from '../shifts/shift.service';
import { Op } from 'sequelize';
import { getZonesForRide } from './utils/zoneDetector';

interface RideCoordinates {
    startLat: number;
    startLng: number;
    destLat: number;
    destLng: number;
    address?: string;
    timestamp?: number;
    predictedScore: number;
}


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

        const activeRide = await Ride.findOne({
            where: { 
                shift_id: activeShift.id,
                end_time: null 
            },
            order: [['start_time', 'DESC']]
        });
        
        return !!activeRide;
    }

    static async canStartRide(driverId: string): Promise<{ canStart: boolean; reason?: string }> {
        // Check if driver has active shift
        const activeShift = await Shift.findOne({
            where: { 
                driver_id: driverId,
                shift_end: null
            }
        });

        if (!activeShift) {
            return { canStart: false, reason: 'No active shift found. Please start a shift before starting a ride.' };
        }

        // Check if driver is paused
        const lastSignal = await ShiftSignal.findOne({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']]
        });

        if (lastSignal && lastSignal.signal === 'pause') {
            return { canStart: false, reason: 'Cannot start ride while on break. Please continue your shift first.' };
        }

        // Check if driver already has an active ride
        const hasActive = await this.hasActiveRide(driverId);
        if (hasActive) {
            return { canStart: false, reason: 'Another ride is already in progress. Please end the current ride first.' };
        }

        return { canStart: true };
    }

    static async evaluateRide(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number> {
        // Validate coordinates
        this.validateCoordinates(startLat, startLng, destLat, destLng);
        
        // Get zones for origin and destination
        const zones = getZonesForRide(startLat, startLng, destLat, destLng);
        
        console.log('Ride evaluation:', {
            origin: { lat: startLat, lng: startLng, zone: zones.originZone },
            destination: { lat: destLat, lng: destLng, zone: zones.destinationZone }
        });
        
        // TODO: Replace this with actual API call
        // For now, using placeholder prediction value
        const prediction = 0.73; // Placeholder API response (0-1 scale)
        
        // Validate prediction is in valid range
        if (prediction < 0 || prediction > 1) {
            throw new Error('Invalid prediction value from API');
        }
        
        // Convert prediction from 0-1 scale to 1-5 rating scale
        // Formula: rating = 1 + (prediction * 4)
        // This maps: 0 -> 1, 0.25 -> 2, 0.5 -> 3, 0.75 -> 4, 1 -> 5
        const rating = Math.round(1 + (prediction * 4));
        
        // Ensure rating is within valid bounds (1-5)
        return Math.max(1, Math.min(5, rating));
    }

    static async startRide(driverId: string, shiftId: string, coords: RideCoordinates): Promise<any> {
        // Validate coordinates
        this.validateCoordinates(coords.startLat, coords.startLng, coords.destLat, coords.destLng);

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
        const ride = await Ride.create({
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

    static async endRide(rideId: string, fareCents: number, actualDistanceKm: number, timestamp?: number): Promise<any> {
        // Find the active ride
        const ride = await Ride.findByPk(rideId);
        
        if (!ride) {
            throw new Error('Ride not found');
        }

        if (ride.end_time !== null) {
            throw new Error('Ride is already ended');
        }

        // Use provided timestamp or current time
        const endTime = timestamp ? new Date(timestamp) : new Date();
        const totalTimeMs = endTime.getTime() - ride.start_time.getTime();
        const earningPerMin = Math.round((fareCents / (totalTimeMs / (1000 * 60))));

        // Update the ride
        await ride.update({
            end_time: endTime,
            earning_cents: fareCents,
            earning_per_min: earningPerMin,
            distance_km: actualDistanceKm
        });

        return {
            rideId: ride.id,
            total_time_ms: totalTimeMs,
            distance_km: actualDistanceKm,
            earning_cents: fareCents,
            earning_per_min: earningPerMin
        };
    }

    static async getRideStatus(driverId: string): Promise<any> {
        // Get active shift for driver first
        const activeShift = await Shift.findOne({
            where: { 
                driver_id: driverId,
                shift_end: null
            }
        });

        if (!activeShift) {
            throw new Error('No active shift found. Please start a shift before checking ride status.');
        }

        // Find active ride for driver
        const activeRide = await Ride.findOne({
            where: { 
                shift_id: activeShift.id,
                end_time: null 
            },
            order: [['start_time', 'DESC']]
        });

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
            start_latitude: activeRide.start_latitude,
            start_longitude: activeRide.start_longitude,
            current_destination_latitude: destLat,
            current_destination_longitude: destLng,
            startTime: activeRide.start_time.getTime(),
            address: activeRide.address,
            elapsed_time_ms: elapsedTimeMs,
        };
    }

    static async manageExpiredRides(): Promise<void> {
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

        // Find rides that started more than 4 hours ago and are still active
        const expiredRides = await Ride.findAll({
            where: {
                start_time: { [Op.lt]: fourHoursAgo },
                end_time: null
            }
        });

        // End each expired ride with duration 0 (nullify earnings)
        for (const ride of expiredRides) {
            await ride.update({
                end_time: new Date(),
                earning_cents: 0,
                earning_per_min: 0,
                distance_km: 0
            });
        }
    }

    private static validateCoordinates(startLat: number, startLng: number, destLat: number, destLng: number): void {
        if (startLat < -90 || startLat > 90 || destLat < -90 || destLat > 90) {
            throw new Error('Invalid latitude provided');
        }
        
        if (startLng < -180 || startLng > 180 || destLng < -180 || destLng > 180) {
            throw new Error('Invalid longitude provided');
        }
    }

    static async editRide(rideId: string, driverId: string, updateData: any): Promise<Ride> {
        // Find the ride
        const ride = await Ride.findByPk(rideId);
        if (!ride) {
            throw new Error('Ride not found');
        }

        // Check authorization
        if (ride.driver_id !== driverId) {
            throw new Error('Not authorized to edit this ride');
        }

        // Check if ride is active
        if (!ride.end_time) {
            throw new Error('Cannot edit active ride');
        }

        // Validate forbidden fields
        const forbiddenFields = ['id', 'shift_id', 'driver_id', 'start_time', 'start_latitude', 'start_longitude', 'predicted_score'];
        for (const field of forbiddenFields) {
            if (field in updateData) {
                throw new Error(`Cannot modify ${field}`);
            }
        }

        // Validate coordinates if provided
        if ('destination_latitude' in updateData || 'destination_longitude' in updateData) {
            const destLat = updateData.destination_latitude || ride.destination_latitude;
            const destLng = updateData.destination_longitude || ride.destination_longitude;
            if (destLat < -90 || destLat > 90 || destLng < -180 || destLng > 180) {
                throw new Error('Invalid coordinates');
            }
        }

        // Validate distance if provided
        if ('distance_km' in updateData && updateData.distance_km <= 0) {
            throw new Error('Distance must be positive');
        }

        // Validate earning if provided
        if ('earning_cents' in updateData && updateData.earning_cents <= 0) {
            throw new Error('Earning must be positive');
        }

        // Validate end_time if provided
        if ('end_time' in updateData) {
            const endTime = new Date(updateData.end_time);
            if (endTime <= ride.start_time) {
                throw new Error('End time must be after start time');
            }
        }

        // Update the ride
        await ride.update(updateData);


        return ride;
    }

    static async deleteRide(rideId: string, driverId: string): Promise<void> {
        // Find the ride
        const ride = await Ride.findByPk(rideId);
        if (!ride) {
            throw new Error('Ride not found');
        }

        // Check authorization
        if (ride.driver_id !== driverId) {
            throw new Error('Not authorized to delete this ride');
        }

        // Check if ride is active
        if (!ride.end_time) {
            throw new Error('Cannot delete active ride');
        }

        // Soft delete the ride
        await ride.destroy();

    }

    static async restoreRide(rideId: string, driverId: string): Promise<void> {
        // Find the deleted ride (paranoid: false to include soft-deleted records)
        const ride = await Ride.findByPk(rideId, { paranoid: false });
        if (!ride) {
            throw new Error('Ride not found');
        }

        // Check authorization
        if (ride.driver_id !== driverId) {
            throw new Error('Not authorized to restore this ride');
        }

        // Check if ride is deleted (handle both snake_case and camelCase)
        const deletedAt = ride.deleted_at || (ride as any).deletedAt;
        if (!deletedAt) {
            throw new Error('Ride is not deleted');
        }

        // Restore the ride using Sequelize's restore method
        await ride.restore();

    }

    static async getRidesByDriver(driverId: string): Promise<Ride[]> {
        return await Ride.findAll({
            where: { driver_id: driverId },
            order: [['start_time', 'DESC']]
        });
    }

} 