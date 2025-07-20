import { Op } from 'sequelize';
import { Ride } from './ride.model';
import { RIDE_CONSTANTS } from './ride.constants';

export class RideRepository {
    
    static async findById(id: string, includeDeleted = false): Promise<Ride | null> {
        return Ride.findByPk(id, { paranoid: !includeDeleted });
    }
    
    static async findActiveByShift(shiftId: string): Promise<Ride | null> {
        return Ride.findOne({
            where: { 
                shift_id: shiftId,
                end_time: null 
            },
            order: [['start_time', 'DESC']]
        });
    }
    
    static async findExpiredRides(): Promise<Ride[]> {
        const fourHoursAgo = new Date(Date.now() - RIDE_CONSTANTS.EXPIRY_TIME_MS);
        return Ride.findAll({
            where: {
                start_time: { [Op.lt]: fourHoursAgo },
                end_time: null
            }
        });
    }
    
    static async findByDriver(driverId: string): Promise<Ride[]> {
        return Ride.findAll({
            where: { driver_id: driverId },
            order: [['start_time', 'DESC']]
        });
    }
    
    static async findAllByShift(shiftId: string): Promise<Ride[]> {
        return Ride.findAll({
            where: { shift_id: shiftId }
        });
    }
    
    static async create(data: Partial<Ride>): Promise<Ride> {
        return Ride.create(data);
    }
    
    static async update(ride: Ride, data: any): Promise<Ride> {
        await ride.update(data);
        return ride;
    }
    
    static async softDelete(ride: Ride): Promise<void> {
        await ride.destroy();
    }
    
    static async restore(ride: Ride): Promise<void> {
        await ride.restore();
    }
    
    /**
     * Check if a driver has an active ride in their current shift
     */
    static async hasActiveRideForShift(shiftId: string): Promise<boolean> {
        const activeRide = await this.findActiveByShift(shiftId);
        return !!activeRide;
    }
    
    /**
     * End all expired rides with zero earnings
     */
    static async endExpiredRides(): Promise<number> {
        const expiredRides = await this.findExpiredRides();
        
        for (const ride of expiredRides) {
            await this.update(ride, {
                end_time: new Date(),
                earning_cents: 0,
                earning_per_min: 0,
                distance_km: 0
            });
        }
        
        return expiredRides.length;
    }
}