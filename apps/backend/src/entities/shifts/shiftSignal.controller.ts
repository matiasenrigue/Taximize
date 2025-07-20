import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

// Services
import ShiftSignalService from './shiftSignal.service';





abstract class ShiftSignalHandler {

    protected abstract getSignalType(): 'start' | 'pause' | 'continue' | 'stop';
    protected abstract getExtraParams(body: any): any[];
    protected abstract getSuccessMessage(): string;
    protected abstract getErrorMessage(): string;
    protected abstract SignalHandler(driverId: string, timestamp: number, ...extraParams: any[]): Promise<any>;

    protected async processSuccessResponse(result: any, res: Response): Promise<void> {
        res.status(200).json({
            success: true,
            message: this.getSuccessMessage(),
            data: result ? result : {}
        });
    }

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
                res.status(400);
                throw new Error(this.getErrorMessage());
            }
            res.status(400);
            throw new Error(error.message || `Failed to ${this.getSignalType()} shift`);
        }
    });
}



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



export class ShiftSignalController {
    private static startHandler = new StartShiftHandler();
    private static pauseHandler = new PauseShiftHandler();
    private static continueHandler = new ContinueShiftHandler();
    private static endHandler = new EndShiftHandler();
    private static skipPauseHandler = new SkipPauseHandler();

    // @desc    Start shift
    // @route   POST /api/shifts/start-shift
    // @access  Protected
    static startShift = ShiftSignalController.startHandler.handle;
    
    // @desc    Pause shift
    // @route   POST /api/shifts/pause-shift
    // @access  Protected
    static pauseShift = ShiftSignalController.pauseHandler.handle;
    
    // @desc    Continue shift
    // @route   POST /api/shifts/continue-shift
    // @access  Protected
    static continueShift = ShiftSignalController.continueHandler.handle;

    // @desc    End shift
    // @route   POST /api/shifts/end-shift
    // @access  Protected
    static endShift = ShiftSignalController.endHandler.handle;

    // @desc    Skip pause (register a 0-minute pause), in case the driver wants to skip a pause
    // @route   POST /api/shifts/skip-pause
    // @access  Protected
    static skipPause = ShiftSignalController.skipPauseHandler.handle;
}