import { Shift } from './shift.model';
import { Op } from 'sequelize';

export class ShiftRepository {
    /**
     * Find active shift for a driver
     * @returns The active shift if found, null otherwise
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
     * Find shift by ID
     * @returns The shift if found, null otherwise
     */
    static async findById(shiftId: string): Promise<Shift | null> {
        return await Shift.findByPk(shiftId);
    }


    
    /**
     * Find shifts by driver within date range
     * @returns Array of shifts (empty array if none found)
     */
    static async findShiftsInDateRange(
        driverId: string, 
        startDate: Date, 
        endDate: Date
    ): Promise<Shift[]> {
        return await Shift.findAll({
            where: {
                driver_id: driverId,
                shift_start: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate
                }
            },
            order: [['shift_start', 'DESC']]
        });
    }


}