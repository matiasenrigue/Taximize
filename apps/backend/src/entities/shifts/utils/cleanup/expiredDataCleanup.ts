import { Shift } from '../../shift.model';
import { ShiftSignal } from '../../../shift-signals/shiftSignal.model';
import { RideRepository } from '../../../rides/ride.repository';
import { ShiftService } from '../../shift.service';

export class ExpiredDataCleanup {
    private static readonly SHIFT_EXPIRY_DAYS = 1;
    private static readonly SHIFT_EXPIRY_MS = ExpiredDataCleanup.SHIFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    private static readonly RIDE_EXPIRY_HOURS = 4;
    private static readonly RIDE_EXPIRY_MS = ExpiredDataCleanup.RIDE_EXPIRY_HOURS * 60 * 60 * 1000;

    /**
     * Manages expired rides by closing any ride that has been active for more than 4 hours
     * Sets earnings to 0 for these rides as per business rules
     * Only affects rides for the specified driver
     */
    static async manageExpiredRides(driverId: string): Promise<void> {
        const fourHoursAgo = new Date(Date.now() - ExpiredDataCleanup.RIDE_EXPIRY_MS);
        
        // Find expired rides for this driver only
        const expiredRides = await RideRepository.findExpiredRidesForDriver(driverId, fourHoursAgo);
        
        for (const ride of expiredRides) {
            await RideRepository.update(ride, {
                end_time: new Date(),
                earning_cents: 0,
                earning_per_min: 0,
                distance_km: 0
            });
        }
        
        if (expiredRides.length > 0) {
            console.log(`Ended ${expiredRides.length} expired rides for driver ${driverId}`);
        }
    }

    /**
     * Manages expired shifts by closing shifts with no activity for more than 1 day
     * Creates synthetic stop signals for shifts with rides, deletes empty shifts
     * Only affects the active shift for the specified driver
     */
    static async manageExpiredShifts(driverId: string): Promise<void> {
        const expiryThreshold = new Date(Date.now() - ExpiredDataCleanup.SHIFT_EXPIRY_MS);

        // Find active shift for this driver (should be only one)
        const activeShift = await ShiftService.getActiveShift(driverId);
        
        if (!activeShift) {
            return; // No active shift to manage
        }

        // Get the last signal for this shift
        const lastSignal = await ShiftSignal.findOne({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']]
        });

        // Skip if no signals or last signal is 'stop' or within expiry threshold
        if (!lastSignal || lastSignal.signal === 'stop' || lastSignal.timestamp.getTime() > expiryThreshold.getTime()) {
            return;
        }

        // Check if they have any rides at all during this shift
        const rides = await RideRepository.findAllByShift(activeShift.id);

        if (rides.length > 0) {
            // If there are rides, just end the shift at the last signal time
            // (rides would have already been closed by manageExpiredRides if needed)
            await ShiftSignal.create({
                timestamp: lastSignal.timestamp,
                shift_id: activeShift.id,
                signal: 'stop'
            });

            // Save shift using the existing method
            await ShiftService.endShiftById(activeShift.id, driverId);
        } else {
            // No rides recorded - delete the empty shift entirely
            await ShiftService.deleteShiftSignals(driverId);
            
            await Shift.destroy({
                where: { id: activeShift.id }
            });
        }

        console.log(`Managed expired shift for driver: ${driverId}`);
    }

    /**
     * Main cleanup method that handles both expired rides and shifts for a specific driver
     * Should be called on user login to ensure data integrity
     * Order matters: clean rides first, then shifts
     */
    static async performLoginCleanup(driverId: string): Promise<void> {
        try {
            // First clean up expired rides (4+ hours) for this driver
            await this.manageExpiredRides(driverId);
            
            // Then clean up expired shifts (1+ days) for this driver
            await this.manageExpiredShifts(driverId);
        } catch (error) {
            console.error(`Error during login cleanup for driver ${driverId}:`, error);
            // Don't throw - we don't want cleanup failures to block login
        }
    }
}