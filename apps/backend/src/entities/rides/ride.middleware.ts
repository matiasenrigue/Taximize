import { Request, Response, NextFunction } from 'express';
import { RideValidators } from './ride.validators';
import { RIDE_CONSTANTS } from './ride.constants';

/**
 * Middleware to validate ride coordinates in request body.
 * 
 * Ensures all coordinate fields are present, numeric, and within
 * valid geographic bounds before allowing the request to proceed.
 * 
 * @param req - Express request containing coordinates in body
 * @param res - Express response
 * @param next - Next middleware function
 * @returns 400 error if validation fails, calls next() if successful
 */
export const validateRideCoordinates = (req: Request, res: Response, next: NextFunction): void => {
    const { startLatitude, startLongitude, destinationLatitude, destinationLongitude } = req.body;
    
    // Check required fields
    if (!startLatitude || !startLongitude || !destinationLatitude || !destinationLongitude) {
        res.status(400).json({ 
            success: false,
            error: 'Missing required coordinates' 
        });
        return;
    }
    
    // Check types
    if (typeof startLatitude !== 'number' || typeof startLongitude !== 'number' || 
        typeof destinationLatitude !== 'number' || typeof destinationLongitude !== 'number') {
        res.status(400).json({ 
            success: false,
            error: 'Invalid coordinates provided' 
        });
        return;
    }
    
    try {
        RideValidators.validateCoordinates({
            startLat: startLatitude,
            startLng: startLongitude,
            destLat: destinationLatitude,
            destLng: destinationLongitude
        });
        next();
    } catch (error: any) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
        return;
    }
};

/**
 * Middleware to validate start ride request data.
 * 
 * Validates all required fields for starting a ride including
 * address, predicted score, and optional timestamp. Ensures data
 * types and values are correct before processing.
 * 
 * @param req - Express request containing ride start data
 * @param res - Express response
 * @param next - Next middleware function
 * @returns 400 error if validation fails, calls next() if successful
 */
export const validateStartRideRequest = (req: Request, res: Response, next: NextFunction): void => {
    const { address, predictedScore, timestamp } = req.body;
    
    // Validate address
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
        res.status(400).json({ 
            success: false,
            error: 'Invalid address provided' 
        });
        return;
    }
    
    // Validate predicted score - allow null or number
    if (predictedScore !== null && predictedScore !== undefined) {
        if (typeof predictedScore !== 'number') {
            res.status(400).json({ 
                success: false,
                error: 'Invalid predicted score provided' 
            });
            return;
        }
        
        try {
            RideValidators.validatePredictionScore(predictedScore);
        } catch (error: any) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
            return;
        }
    }
    
    // Validate timestamp if provided
    if (timestamp !== undefined && typeof timestamp !== 'number') {
        res.status(400).json({ 
            success: false,
            error: 'Invalid timestamp provided' 
        });
        return;
    }
    
    next();
};

/**
 * Middleware to validate end ride request data.
 * 
 * Validates required fields for ending a ride including fare,
 * distance, and optional timestamp. Ensures values are positive
 * numbers before allowing ride completion.
 * 
 * @param req - Express request containing ride end data
 * @param res - Express response
 * @param next - Next middleware function
 * @returns 400 error if validation fails, calls next() if successful
 */
export const validateEndRideRequest = (req: Request, res: Response, next: NextFunction): void => {
    const { fareCents, actualDistanceKm, timestamp } = req.body;
    
    // Validate required fields
    if (fareCents === undefined || actualDistanceKm === undefined) {
        res.status(400).json({ 
            success: false,
            error: 'Missing required fields: fareCents and actualDistanceKm' 
        });
        return;
    }
    
    // Validate field types
    if (typeof fareCents !== 'number' || typeof actualDistanceKm !== 'number') {
        res.status(400).json({ 
            success: false,
            error: 'Invalid fare or distance values' 
        });
        return;
    }
    
    // Validate positive values
    if (fareCents < 0 || actualDistanceKm < 0) {
        res.status(400).json({ 
            success: false,
            error: 'Fare and distance must be positive values' 
        });
        return;
    }
    
    // Validate timestamp if provided
    if (timestamp !== undefined && typeof timestamp !== 'number') {
        res.status(400).json({ 
            success: false,
            error: 'Invalid timestamp provided' 
        });
        return;
    }
    
    next();
};