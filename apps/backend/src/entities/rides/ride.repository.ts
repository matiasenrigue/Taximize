import { Op, Sequelize } from 'sequelize';
import { Ride } from './ride.model';
import { RIDE_CONSTANTS } from './ride.constants';
import { sequelize } from '../../shared/config/db';

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
    
    /**
     * Find rides within a date range for a driver
     */
    static async findRidesInDateRange(driverId: string, startDate: Date, endDate: Date): Promise<Ride[]> {
        return Ride.findAll({
            where: {
                driver_id: driverId,
                start_time: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['start_time', 'ASC']]
        });
    }
    
    
    /**
     * Find rides by day of week for a driver
     */
    static async findRidesByDayOfWeek(driverId: string, dayOfWeek: number): Promise<Ride[]> {
        const dialectType = sequelize.getDialect();
        
        let whereClause: any = { driver_id: driverId };
        
        if (dialectType === 'postgres') {
            whereClause[Op.and] = [
                Sequelize.where(
                    Sequelize.fn('EXTRACT', Sequelize.literal('DOW FROM start_time')),
                    dayOfWeek
                )
            ];
        } else {
            // SQLite uses 0-6 where 0 is Sunday
            whereClause[Op.and] = [
                Sequelize.where(
                    Sequelize.fn('strftime', '%w', Sequelize.col('start_time')),
                    dayOfWeek.toString()
                )
            ];
        }
        
        return Ride.findAll({
            where: whereClause,
            order: [['start_time', 'DESC']]
        });
    }
    
    /**
     * Aggregate earnings by date for a driver
     */
    static async aggregateEarningsByDate(driverId: string, startDate: Date, endDate: Date): Promise<any[]> {
        const dialectType = sequelize.getDialect();
        
        let dateFunction;
        if (dialectType === 'postgres') {
            dateFunction = Sequelize.fn('DATE', Sequelize.col('start_time'));
        } else {
            // SQLite
            dateFunction = Sequelize.fn('date', Sequelize.col('start_time'));
        }
        
        const result = await Ride.findAll({
            attributes: [
                [dateFunction, 'date'],
                [Sequelize.fn('SUM', Sequelize.col('earning_cents')), 'totalCents']
            ],
            where: {
                driver_id: driverId,
                start_time: {
                    [Op.between]: [startDate, endDate]
                },
                earning_cents: {
                    [Op.not]: null
                }
            },
            group: [dateFunction],
            raw: true
        });
        
        return result;
    }
    
}