import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';

/**
 * Middleware to ensure the authenticated user is a driver
 * Must be used after the protect middleware
 * Allows us to homogeneize the logic to check for a driver ID
 */
export const requireDriver = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        
        // Check if user is authenticated (protect middleware should have run first)
        if (!req.user) {
            res.status(401);
            throw new Error('Authentication required');
        }

        // Get driver ID from authenticated user
        const driverId = req.user.id;
        
        if (!driverId) {
            res.status(401);
            throw new Error('Driver authentication required');
        }

        // Attach driver ID to request for easy access in controllers
        req.driverId = driverId;
        
        next();
    }
);

export default requireDriver;