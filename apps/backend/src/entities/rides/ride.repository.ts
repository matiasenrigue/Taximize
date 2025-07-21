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
    
    static async findExpiredRidesForDriver(driverId: string, expiryThreshold: Date): Promise<Ride[]> {
        return Ride.findAll({
            where: {
                driver_id: driverId,
                start_time: { [Op.lt]: expiryThreshold },
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
    
    /**
     * Check if a driver has an active ride in their current shift
     */
    static async hasActiveRideForShift(shiftId: string): Promise<boolean> {
        const activeRide = await this.findActiveByShift(shiftId);
        return !!activeRide;
    }
    
}