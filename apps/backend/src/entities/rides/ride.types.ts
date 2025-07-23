/**
 * Represents the coordinate data required to start a ride.
 * 
 * Contains both pickup and destination locations along with
 * additional metadata like address and ML prediction score.
 */
export interface RideCoordinates {
    /** Starting latitude coordinate */
    startLat: number;
    
    /** Starting longitude coordinate */
    startLng: number;
    
    /** Destination latitude coordinate */
    destLat: number;
    
    /** Destination longitude coordinate */
    destLng: number;
    
    /** Human-readable destination address */
    address?: string;
    
    /** Optional timestamp for ride start (defaults to current time) */
    timestamp?: number;
    
    /** ML-predicted score for ride quality/profitability (1-5 scale, null if ML unavailable) */
    predictedScore: number | null;
}