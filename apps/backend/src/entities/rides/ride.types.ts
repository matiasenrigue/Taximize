export interface RideCoordinates {
    startLat: number;
    startLng: number;
    destLat: number;
    destLng: number;
    address?: string;
    timestamp?: number;
    predictedScore: number;
}

export interface RideEvaluation {
    rating: number;
    zones: {
        originZone: string | null;
        destinationZone: string | null;
    };
}

export interface RideStatus {
    rideId: string;
    startLatitude: number;
    startLongitude: number;
    currentDestinationLatitude: number;
    currentDestinationLongitude: number;
    startTime: number;
    address: string;
    elapsedTimeMs: number;
}

export interface RideUpdateData {
    destination_latitude?: number;
    destination_longitude?: number;
    address?: string;
    end_time?: Date | string;
    earning_cents?: number;
    distance_km?: number;
}

export interface RideMetrics {
    rideId: string;
    totalTimeMs: number;
    distanceKm: number;
    earningCents: number;
    earningPerMin: number;
}

export interface StartRideResult {
    rideId: string;
    startTime: number;
    predicted_score: number;
}

export interface CanStartRideResult {
    canStart: boolean;
    reason?: string;
}