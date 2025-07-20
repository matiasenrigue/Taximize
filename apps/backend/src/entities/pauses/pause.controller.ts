import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PauseService } from './pause.service';
import { ShiftService } from '../shifts/shift.service';

export class PauseController {
    /**
     * @desc    Skip pause (register a 0-minute pause)
     * @route   POST /api/pauses/skip
     * @access  Protected
     */
    static skipPause = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { timestamp } = req.body || {};
        const driverId = req.driverId!; 

        // Use provided timestamp or current time
        const signalTimestamp = timestamp || Date.now();

        try {
            // Check if driver has an active shift
            const shiftStatus = await ShiftService.getCurrentShiftStatus(driverId);
            if (!shiftStatus || !shiftStatus.isOnShift) {
                res.status(400);
                throw new Error('No active shift to skip pause');
            }

            // Register a fake pause of 0 minutes by emitting pause and continue signals
            await ShiftService.handleSignal(driverId, signalTimestamp, 'pause');
            await ShiftService.handleSignal(driverId, signalTimestamp, 'continue');
            
            res.status(200).json({
                success: true,
                message: 'Pause skipped successfully'
            });
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message || 'Failed to skip pause');
        }
    });

    /**
     * @desc    Get pause statistics for current shift
     * @route   GET /api/pauses/stats
     * @access  Protected
     */
    static getPauseStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.driverId!;

        try {
            // Get active shift
            const activeShift = await ShiftService.getActiveShiftForDriver(driverId);
            if (!activeShift) {
                res.status(200).json({
                    success: true,
                    data: {
                        totalPauseTime: 0,
                        numPauses: 0,
                        averagePauseDuration: 0,
                        message: 'No active shift'
                    }
                });
                return;
            }

            // Get pause statistics
            const stats = await PauseService.calculatePauseStats(activeShift.id);
            
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message || 'Failed to get pause statistics');
        }
    });

    /**
     * @desc    Get current pause status
     * @route   GET /api/pauses/status
     * @access  Protected
     */
    static getPauseStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const driverId = req.driverId!;

        try {
            const pauseInfo = await PauseService.getPauseInfo(driverId);
            
            res.status(200).json({
                success: true,
                data: pauseInfo
            });
        } catch (error: any) {
            res.status(400);
            throw new Error(error.message || 'Failed to get pause status');
        }
    });
}