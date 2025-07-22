import { Op, Sequelize } from 'sequelize';
import { Ride } from './ride.model';
import { RIDE_CONSTANTS } from './ride.constants';
import { sequelize } from '../../shared/config/db';

/**
 * Repository layer for ride data access.
 * 
 * Encapsulates all database operations for rides,
 * providing a clean interface for the service layer
 * to interact with ride data.
 */
export class RideRepository {
    
    /**
     * Finds a ride by its unique identifier.
     * @param id - The ride ID to search for
     * @param includeDeleted - Whether to include soft-deleted rides
     * @returns The ride if found, null otherwise
     */
    static async findById(id: string, includeDeleted = false): Promise<Ride | null> {
        return Ride.findByPk(id, { paranoid: !includeDeleted });
    }
    
    /**
     * Finds the active ride for a specific shift.
     * @param shiftId - The shift ID to check
     * @returns The active ride if exists, null otherwise
     */
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
     * Finds rides that have exceeded the maximum duration.
     * @param driverId - The driver ID to check
     * @param expiryThreshold - The timestamp before which rides are considered expired
     * @returns Array of expired rides
     */
    static async findExpiredRidesForDriver(driverId: string, expiryThreshold: Date): Promise<Ride[]> {
        return Ride.findAll({
            where: {
                driver_id: driverId,
                start_time: { [Op.lt]: expiryThreshold },
                end_time: null
            }
        });
    }
    
    /**
     * Finds all rides for a specific driver.
     * @param driverId - The driver ID to search for
     * @returns Array of rides ordered by start time (newest first)
     */
    static async findByDriver(driverId: string): Promise<Ride[]> {
        return Ride.findAll({
            where: { driver_id: driverId },
            order: [['start_time', 'DESC']]
        });
    }
    
    /**
     * Finds all rides associated with a specific shift.
     * @param shiftId - The shift ID to search for
     * @returns Array of all rides in the shift
     */
    static async findAllByShift(shiftId: string): Promise<Ride[]> {
        return Ride.findAll({
            where: { shift_id: shiftId }
        });
    }
    
    /**
     * Creates a new ride record.
     * @param data - The ride data to create
     * @returns The newly created ride
     */
    static async create(data: Partial<Ride>): Promise<Ride> {
        return Ride.create(data);
    }
    
    /**
     * Updates an existing ride record.
     * @param ride - The ride instance to update
     * @param data - The data to update
     * @returns The updated ride
     */
    static async update(ride: Ride, data: any): Promise<Ride> {
        await ride.update(data);
        return ride;
    }
    
    /**
     * Checks if a shift has an active ride.
     * @param shiftId - The shift ID to check
     * @returns True if an active ride exists
     */
    static async hasActiveRideForShift(shiftId: string): Promise<boolean> {
        const activeRide = await this.findActiveByShift(shiftId);
        return !!activeRide;
    }
    
    /**
     * Finds rides within a specific date range for a driver.
     * @param driverId - The driver ID to search for
     * @param startDate - Beginning of the date range
     * @param endDate - End of the date range
     * @returns Array of rides ordered by start time
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
    

    // Sources: 
    //      https://www.grouparoo.com/blog/sql-dialect-differences
    //      https://sequelize.org/docs/v6/other-topics/dialect-specific-things/
    // Need to handle different SQL dialects to differentiate testing and production environments

    
    /**
     * Finds rides that occurred on a specific day of the week.
     * @param driverId - The driver ID to search for
     * @param dayOfWeek - Day of week (0=Sunday, 6=Saturday)
     * @returns Array of rides for the specified day
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
     * Aggregates earnings by date for a driver.
     * @param driverId - The driver ID to aggregate for
     * @param startDate - Beginning of the date range
     * @param endDate - End of the date range
     * @returns Array of dates with total earnings in cents
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