import { Op, Sequelize } from 'sequelize';
import { Ride } from './ride.model';
import { RIDE_CONSTANTS } from './ride.constants';
import { sequelize } from '../../shared/config/db';

/**
 * Database operations for rides.
 */
export class RideRepository {
    
    /**
     * Get ride by ID.
     * @param includeDeleted - Include soft-deleted rides
     */
    static async findById(id: string, includeDeleted = false): Promise<Ride | null> {
        return Ride.findByPk(id, { paranoid: !includeDeleted });
    }
    

    /** Get active ride for shift. */
    static async findActiveByShift(shiftId: string): Promise<Ride | null> {
        return Ride.findOne({
            where: { 
                shift_id: shiftId,
                end_time: null 
            },
            order: [['start_time', 'DESC']]
        });
    }
    
  
    /**
     * Find expired rides (exceeded max duration).
     * @param expiryThreshold - Rides started before this are expired
     */
    static async findExpiredRidesForDriver(driverId: string, expiryThreshold: Date): Promise<Ride[]> {
        return Ride.findAll({
            where: {
                driver_id: driverId,
                start_time: { [Op.lt]: expiryThreshold },
                end_time: null
            },
            limit: RIDE_CONSTANTS.QUERY_LIMITS.DEFAULT
        });
    }
   
    
    /** Get all driver's rides (newest first). */
    static async findByDriver(driverId: string): Promise<Ride[]> {
        return Ride.findAll({
            where: { driver_id: driverId },
            order: [['start_time', 'DESC']],
            limit: RIDE_CONSTANTS.QUERY_LIMITS.DEFAULT
        });
    }
   
    
    /** Get all rides for a shift. */
    static async findAllByShift(shiftId: string): Promise<Ride[]> {
        return Ride.findAll({
            where: { shift_id: shiftId },
            limit: RIDE_CONSTANTS.QUERY_LIMITS.DEFAULT
        });
    }
    

    /** Create new ride. */
    static async create(data: Partial<Ride>): Promise<Ride> {
        return Ride.create(data);
    }
    

    /** Update ride data. */
    static async update(ride: Ride, data: any): Promise<Ride> {
        await ride.update(data);
        return ride;
    }
    

    /**
     * Bulk update multiple rides.
     * @param data - Fields to update
     * @param options - Where clause and other options
     */
    static async bulkUpdate(data: any, options: any): Promise<[number, Ride[]]> {
        return Ride.update(data, options);
    }
    

    /** Check if shift has active ride. */
    static async hasActiveRideForShift(shiftId: string): Promise<boolean> {
        const activeRide = await this.findActiveByShift(shiftId);
        return !!activeRide;
    }
    
    /**
     * Get rides within date range.
     */
    static async findRidesInDateRange(driverId: string, startDate: Date, endDate: Date): Promise<Ride[]> {
        return Ride.findAll({
            where: {
                driver_id: driverId,
                start_time: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['start_time', 'ASC']],
            limit: RIDE_CONSTANTS.QUERY_LIMITS.DEFAULT
        });
    }
    

    // Sources: 
    //      https://www.grouparoo.com/blog/sql-dialect-differences
    //      https://sequelize.org/docs/v6/other-topics/dialect-specific-things/
    // Need to handle different SQL dialects to differentiate testing and production environments

    
    /**
     * Find rides by day of week.
     * @param dayOfWeek - 0=Sunday, 6=Saturday
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
     * Aggregate earnings by date.
     * @returns Array of {date, totalCents}
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