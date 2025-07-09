export interface LatLng {
    lat: number;
    lng: number;
}

export type GoogleMapsRouteStatus = "OK" | "NOT_FOUND" | "ZERO_RESULTS" | "MAX_ROUTE_LENGTH_EXCEEDED";