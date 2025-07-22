import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { ResponseHandler } from '../../shared/utils/responseHandler';

// Services
import ShiftSignalService from './shiftSignal.service';




/**
 * Abstract base class for handling shift signal operations.
 * Provides a template for processing different types of shift signals
 * (start, pause, continue, stop) with consistent error handling and response formatting.
 */
abstract class ShiftSignalHandler {

    /**
     * Returns the type of signal this handler processes.
     * @returns The signal type: 'start', 'pause', 'continue', or 'stop'
     */
    protected abstract getSignalType(): 'start' | 'pause' | 'continue' | 'stop';

    /**
     * Extracts additional parameters from the request body specific to each signal type.
     * @param body - The request body containing signal-specific parameters
     * @returns Array of extra parameters to pass to the signal handler
     */
    protected abstract getExtraParams(body: any): any[];

    /**
     * Returns a human-friendly success message for this signal type.
     * @returns Success message to send in the response
     */
    protected abstract getSuccessMessage(): string;

    /**
     * Returns a human-friendly error message for invalid signal transitions.
     * @returns Error message to send when signal transition is invalid
     */
    protected abstract getErrorMessage(): string;

    /**
     * Executes the actual signal processing logic by calling the appropriate service method.
     * @param driverId - The ID of the driver sending the signal
     * @param timestamp - Unix timestamp when the signal was sent
     * @param extraParams - Additional parameters specific to the signal type
     * @returns Promise resolving to the signal processing result
     */
    protected abstract SignalHandler(driverId: string, timestamp: number, ...extraParams: any[]): Promise<any>;

    /**
     * Processes and sends a successful response to the client.
     * @param result - The result data from the signal processing
     * @param res - Express response object
     */
    protected async processSuccessResponse(result: any, res: Response): Promise<void> {
        ResponseHandler.success(res, result || {}, this.getSuccessMessage());
    }

    /**
     * Main request handler that processes shift signals.
     * Extracts parameters, calls the signal handler, and manages responses.
     * @param req - Express request object with driverId and optional timestamp
     * @param res - Express response object
     */
    public handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { timestamp } = req.body || {};
        const driverId = req.driverId!;
        const signalTimestamp = timestamp || Date.now();

        try {
            const extraParams = this.getExtraParams(req.body);

            const result = await this.SignalHandler(driverId, signalTimestamp, ...extraParams);

            await this.processSuccessResponse(result, res);
        } catch (error: any) {
            if (error.message.includes('Invalid signal transition')) {
                error.message = this.getErrorMessage();
            }
            ResponseHandler.error(error, res, `Failed to ${this.getSignalType()} shift`);
        }
    });
}



/**
 * Handler for starting a driver's shift.
 * Processes start shift signals and optionally accepts a planned duration for the shift.
 */
class StartShiftHandler extends ShiftSignalHandler {
    protected getSignalType() { return 'start' as const; }
    protected getExtraParams(body: any) { return body.duration ? [body.duration] : []; }
    protected getSuccessMessage() { return 'Shift started successfully, Ready to Go'; }
    protected getErrorMessage() { return 'There is already an active Shift started'; }

    protected async SignalHandler(driverId: string, timestamp: number, ...extraParams: any[]): Promise<any> {

        return await ShiftSignalService.handleStartSignal(
            driverId,
            timestamp,
            ...extraParams
        );
    }
}



/**
 * Handler for pausing an active shift.
 * Allows drivers to temporarily pause their shift with an optional planned pause duration.
 */
class PauseShiftHandler extends ShiftSignalHandler {
    protected getSignalType() { return 'pause' as const; }
    protected getExtraParams(body: any) { return body.pauseDuration ? [body.pauseDuration] : []; }
    protected getSuccessMessage() { return 'Shift paused successfully'; }
    protected getErrorMessage() { return 'No active shift to pause or shift already paused, or driver has an active ride'; }

    protected async SignalHandler(driverId: string, timestamp: number, ...extraParams: any[]): Promise<any> {

        return await ShiftSignalService.handlePauseSignal(
            driverId,
            timestamp,
            ...extraParams
        );
    }
}


/**
 * Handler for resuming a paused shift.
 * Allows drivers to continue working after a pause period.
 */
class ContinueShiftHandler extends ShiftSignalHandler {
    protected getSignalType() { return 'continue' as const; }
    protected getExtraParams(body: any) { return []; }
    protected getSuccessMessage() { return 'Shift continued successfully'; }
    protected getErrorMessage() { return 'No paused shift to continue'; }

    protected async SignalHandler(driverId: string, timestamp: number, ...extraParams: any[]): Promise<any> {

        return await ShiftSignalService.handleContinueSignal(
            driverId,
            timestamp
        );
    }

}

/**
 * Handler for ending a driver's shift.
 * Finalizes the shift and marks it as completed.
 */
class EndShiftHandler extends ShiftSignalHandler {
    protected getSignalType() { return 'stop' as const; }
    protected getExtraParams(body: any) { return []; }
    protected getSuccessMessage() { return 'Shift ended successfully'; }
    protected getErrorMessage() { return 'No active shift to end'; }

    protected async SignalHandler(driverId: string, timestamp: number, ...extraParams: any[]): Promise<any> {

        return await ShiftSignalService.handleStopSignal(
            driverId,
            timestamp
        );
    }

}


/**
 * Handler for skipping a pause (registering a zero-minute pause).
 * This creates both pause and continue signals with the same timestamp.
 * Useful because FrontEnd prompts users every 3 hours to take a break,
 * but some drivers may not actually pause. So by doing this we allow them to register a pause without actually pausing.
 * Registering the 'fake-pause' allows us to not prompt the user to take a break again for another 3 hours
 */
class SkipPauseHandler extends ShiftSignalHandler {
    protected getSignalType() { return 'pause' as const; }
    protected getExtraParams(body: any) { return []; }
    protected getSuccessMessage() { return 'Pause skipped successfully'; }
    protected getErrorMessage() { return 'No active shift to skip pause'; }

    protected async SignalHandler(driverId: string, timestamp: number, ...extraParams: any[]): Promise<any> {
        
        await ShiftSignalService.handlePauseSignal(
            driverId,
            timestamp
        );
        
        return await ShiftSignalService.handleContinueSignal(
            driverId,
            timestamp
        );
    }
}



/**
 * Controller for managing driver shift signals.
 * Provides endpoints for starting, pausing, continuing, and ending shifts.
 * All methods are static and use the handler pattern for consistent processing.
 */
export class ShiftSignalController {
    private static startHandler = new StartShiftHandler();
    private static pauseHandler = new PauseShiftHandler();
    private static continueHandler = new ContinueShiftHandler();
    private static endHandler = new EndShiftHandler();
    private static skipPauseHandler = new SkipPauseHandler();

    /**
     * Starts a new shift for the authenticated driver.
     * @route POST /api/shifts/start-shift
     * @access Protected (requires authentication)
     * @param req.body.timestamp - Optional Unix timestamp (defaults to current time)
     * @param req.body.duration - Optional planned shift duration in milliseconds
     * @returns Success response with shift details or error if shift already active
     */
    static startShift = ShiftSignalController.startHandler.handle;
    
    /**
     * Pauses the driver's active shift.
     * @route POST /api/shifts/pause-shift
     * @access Protected (requires authentication)
     * @param req.body.timestamp - Optional Unix timestamp (defaults to current time)
     * @param req.body.pauseDuration - Optional planned pause duration in milliseconds
     * @returns Success response or error if no active shift or driver has active ride
     */
    static pauseShift = ShiftSignalController.pauseHandler.handle;
    
    /**
     * Resumes a paused shift.
     * @route POST /api/shifts/continue-shift
     * @access Protected (requires authentication)
     * @param req.body.timestamp - Optional Unix timestamp (defaults to current time)
     * @returns Success response or error if no paused shift to continue
     */
    static continueShift = ShiftSignalController.continueHandler.handle;

    /**
     * Ends the driver's active shift.
     * @route POST /api/shifts/end-shift
     * @access Protected (requires authentication)
     * @param req.body.timestamp - Optional Unix timestamp (defaults to current time)
     * @returns Success response with shift summary or error if no active shift
     */
    static endShift = ShiftSignalController.endHandler.handle;

    /**
     * Registers a zero-duration pause (pause and immediate continue).
     * Useful for drivers who need to record a pause event but don't actually pause.
     * @route POST /api/shifts/skip-pause
     * @access Protected (requires authentication)
     * @param req.body.timestamp - Optional Unix timestamp (defaults to current time)
     * @returns Success response indicating pause was skipped
     */
    static skipPause = ShiftSignalController.skipPauseHandler.handle;
}