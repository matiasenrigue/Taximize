import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { StatsService } from './stats.service';
import { ResponseHandler } from '../../shared/utils/responseHandler';
import { isValidDayOfWeek } from '../../utils/dateHelpers';

export class StatsController {

    // @desc    Get shifts for the last N days
    // @route   GET /api/stats/shifts-by-days
    // @access  Protected
    static getShiftsForLastNDays = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.driverId!;
        const days = parseInt(req.query.days as string) || 7;

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);

        try {
            const shifts = await StatsService.getShiftsForDateRange(driverId, startDate, endDate);
            ResponseHandler.success(res, shifts);
        } catch (error: any) {
            ResponseHandler.error(error, res, 'Failed to get shifts for date range');
        }
    });

    // @desc    Get rides by day of week
    // @route   GET /api/stats/rides-by-weekday
    // @access  Protected
    static getRidesByDayOfWeek = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.driverId!;
        const day = req.query.day as string;

        if (!day || !isValidDayOfWeek(day)) {
            res.status(400);
            throw new Error('Invalid day of week. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday');
        }

        try {
            const rides = await StatsService.getRidesByDayOfWeek(driverId, day);
            ResponseHandler.success(res, rides);
        } catch (error: any) {
            ResponseHandler.error(error, res, 'Failed to get rides by day of week');
        }
    });

    // @desc    Get earnings statistics
    // @route   GET /api/stats/earnings
    // @access  Protected
    static getEarningsStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.driverId!;
        const { view, startDate, endDate } = req.query;

        // Validate view parameter
        if (!view || (view !== 'weekly' && view !== 'monthly')) {
            res.status(400);
            throw new Error("The 'view' parameter is required and must be one of [weekly, monthly].");
        }

        // Validate date parameters
        if (!startDate || !endDate) {
            res.status(400);
            throw new Error('Both startDate and endDate parameters are required');
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            res.status(400);
            throw new Error('Invalid date format. Use YYYY-MM-DD');
        }

        if (start > end) {
            res.status(400);
            throw new Error('startDate must be before or equal to endDate');
        }

        try {
            const statistics = await StatsService.getEarningsStatistics(
                driverId,
                view as 'weekly' | 'monthly',
                start,
                end
            );
            ResponseHandler.success(res, statistics);
        } catch (error: any) {
            ResponseHandler.error(error, res, 'Failed to get earnings statistics');
        }
    });

    
    // @desc    Get work time statistics
    // @route   GET /api/stats/worktime
    // @access  Protected
    static getWorkTimeStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.driverId!;
        const { view, startDate, endDate } = req.query;

        // Validate view parameter
        if (!view || (view !== 'weekly' && view !== 'monthly')) {
            res.status(400);
            throw new Error("The 'view' parameter is required and must be one of [weekly, monthly].");
        }

        // Validate date parameters
        if (!startDate || !endDate) {
            res.status(400);
            throw new Error('Both startDate and endDate parameters are required');
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            res.status(400);
            throw new Error('Invalid date format. Use YYYY-MM-DD');
        }

        if (start > end) {
            res.status(400);
            throw new Error('startDate must be before or equal to endDate');
        }

        try {
            const statistics = await StatsService.getWorkTimeStatistics(
                driverId,
                view as 'weekly' | 'monthly',
                start,
                end
            );
            ResponseHandler.success(res, statistics);
        } catch (error: any) {
            ResponseHandler.error(error, res, 'Failed to get work time statistics');
        }
    });
}