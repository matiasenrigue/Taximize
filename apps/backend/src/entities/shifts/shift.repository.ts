import { Shift } from './shift.model';
import { Op } from 'sequelize';
import { Ride } from '../rides/ride.model';

/**
 * Database operations for shifts.
 */
/**
 * Database operations for shifts.
 */
export class ShiftRepository {


    /**
     * Find driver's active shift (shift_end is null).
     * Find driver's active shift (shift_end is null).
     */
    static async findActiveByDriverId(driverId: string): Promise<Shift | null> {
        return await Shift.findOne({
            where: { 
                driver_id: driverId,
                shift_end: null
            }
        });
    }


    /**
     * Get shift by ID.
     */
    static async findById(shiftId: string): Promise<Shift | null> {
        return await Shift.findByPk(shiftId);
    }

    
    /**
     * Get driver's shifts in date range.
     * @param includeRides Whether to include associated rides
     * @returns Shifts sorted by start time (newest first)
     */
    static async findShiftsInDateRange(
        driverId: string, 
        startDate: Date, 
        endDate: Date,
        includeRides: boolean = false
    ): Promise<Shift[]> {
        return await Shift.findAll({
            where: {
                driver_id: driverId,
                shift_start: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate
                }
            },
            include: includeRides ? [{
                model: Ride,
                as: 'rides',
                required: false
            }] : [],
            order: [['shift_start', 'DESC']]
        });
    }


}