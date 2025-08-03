/**
 * Represents the coordinate data required to start a ride.
 */
export interface RideCoordinates {

    startLat: number;
    startLng: number;
    
    destLat: number;
    destLng: number;
    
    address?: string;
    
    timestamp?: number;
    
    predictedScore: number | null;
}