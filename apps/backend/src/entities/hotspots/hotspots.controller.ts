import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { HotspotsService } from './hotspots.service';

export class HotspotsController {
        
    // @desc   Get the Hotspots data
    // @route  GET /api/hotspots/
    // @access Protected
    static getHotspots = asyncHandler(async (req: Request, res: Response) => {
        try {
            // Get hotspots data - service handles whether to fetch new or return cached
            const hotspotsData = await HotspotsService.getHotspotsData();

            res.status(200).json({
                success: true,
                data: hotspotsData,
            });
        } catch (error) {
            // Return error response if no data is available
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to retrieve hotspots data',
                data: null,
            });
        }
    });
    
}