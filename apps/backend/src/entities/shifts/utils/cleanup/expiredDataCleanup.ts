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
     * Close rides older than 4 hours with 0 earnings for the given driver
     * Sets everything to 0
     */
    static async manageExpiredRides(driverId: string): Promise<void> {
        const fourHoursAgo = new Date(Date.now() - ExpiredDataCleanup.RIDE_EXPIRY_MS);
        
        const expiredRides = await RideRepository.findExpiredRidesForDriver(driverId, fourHoursAgo);
        
        if (expiredRides.length > 0) {
            const rideIds = expiredRides.map(ride => ride.id);
            
            await RideRepository.bulkUpdate(
                {
                    end_time: new Date(),
                    earning_cents: 0,
                    earning_per_min: 0,
                    distance_km: 0
                },
                {
                    where: { id: rideIds }
                }
            );
            
            console.log(`Ended ${expiredRides.length} expired rides for driver ${driverId}`);
        }
    }

    
    /**
     * End shifts inactive for 1+ days.
     * Deletes empty shifts, saves shifts with rides.
     */
    static async manageExpiredShifts(driverId: string): Promise<void> {
        const expiryThreshold = new Date(Date.now() - ExpiredDataCleanup.SHIFT_EXPIRY_MS);

        // Find active shift for this driver (should be only one)
        const activeShift = await ShiftService.getActiveShift(driverId);
        
        if (!activeShift) {
            return;
        }

        const lastSignal = await ShiftSignal.findOne({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']]
        });

        // Skip if already stopped or recent activity
        if (!lastSignal || lastSignal.signal === 'stop' || lastSignal.timestamp.getTime() > expiryThreshold.getTime()) {
            return;
        }

        const rides = await RideRepository.findAllByShift(activeShift.id);

        if (rides.length > 0) {
            // Has rides - create stop signal and save
            await ShiftSignal.create({
                timestamp: lastSignal.timestamp,
                shift_id: activeShift.id,
                signal: 'stop'
            });

            await ShiftService.endShiftById(activeShift.id, driverId);
        } else {
            // Empty shift - delete it
            await ShiftService.deleteShiftSignals(driverId);
            
            await Shift.destroy({
                where: { id: activeShift.id }
            });
        }

        console.log(`Managed expired shift for driver: ${driverId}`);
    }

    /**
     * Run cleanup on login - rides first, then shifts.
     */
    static async performLoginCleanup(driverId: string): Promise<void> {
        try {
            await this.manageExpiredRides(driverId);
            
            await this.manageExpiredShifts(driverId);
        } catch (error) {
            console.error(`Error during login cleanup for driver ${driverId}:`, error);
            // Don't block login on cleanup errors
        }
    }
}