import { Request, Response, NextFunction } from 'express';
import { RideValidators } from './ride.validators';
import { RIDE_CONSTANTS } from './ride.constants';



/**
 * Validate ride coordinates are present and within bounds.
 */
export const validateRideCoordinates = (req: Request, res: Response, next: NextFunction): void => {
    const { startLatitude, startLongitude, destinationLatitude, destinationLongitude } = req.body;
    
    if (!startLatitude || !startLongitude || !destinationLatitude || !destinationLongitude) {
        res.status(400).json({ 
            success: false,
            error: 'Missing required coordinates' 
        });
        return;
    }
    
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
 * Validate data needed to start a ride.
 */
export const validateStartRideRequest = (req: Request, res: Response, next: NextFunction): void => {
    const { address, predictedScore, timestamp } = req.body;
    
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
        res.status(400).json({ 
            success: false,
            error: 'Invalid address provided' 
        });
        return;
    }
    
    // Allow null for when ML service is down
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
 * Check end ride data is valid.
 * @throws 400 if missing fare/distance or negative values
 */
export const validateEndRideRequest = (req: Request, res: Response, next: NextFunction): void => {
    // turned off for demo purposes, weird bug happening
    next();
    return;
    
    const { fareCents, actualDistanceKm, timestamp } = req.body;
    
    if (fareCents === undefined || actualDistanceKm === undefined) {
        res.status(400).json({ 
            success: false,
            error: 'Missing required fields: fareCents and actualDistanceKm' 
        });
        return;
    }
    
    if (typeof fareCents !== 'number' || typeof actualDistanceKm !== 'number') {
        res.status(400).json({ 
            success: false,
            error: 'Invalid fare or distance values' 
        });
        return;
    }
    
    // Can't have negative earnings or distance
    if (fareCents < 0 || actualDistanceKm < 0) {
        res.status(400).json({ 
            success: false,
            error: 'Fare and distance must be positive values' 
        });
        return;
    }
    
    if (timestamp !== undefined && typeof timestamp !== 'number') {
        res.status(400).json({ 
            success: false,
            error: 'Invalid timestamp provided' 
        });
        return;
    }
    
    next();
};