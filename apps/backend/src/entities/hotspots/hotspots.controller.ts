import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { HotspotsService } from './hotspots.service';

/**
 * Handles HTTP requests for taxi hotspot predictions.
 * Provides real-time ML-based predictions for high-demand pickup zones.
 */
export class HotspotsController {
        
    /**
     * Get hotspot predictions for current time.
     * Returns cached data if recent (< 1 hour), otherwise fetches new predictions.
     * 
     * @route GET /api/hotspots/
     * @access Protected
     * @returns Zone predictions with location IDs and trip counts
     */
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