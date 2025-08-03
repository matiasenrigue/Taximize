import zoneData from '../zone_coordinates_processed.json';

/**
 * Represents a geographic zone in NYC.
 */
interface Zone {
    id: number;
    
    name: string;
    
    borough: string;
    
    /** Central point of the zone */
    centroid: {
        lat: number;
        lon: number;
    };
    
    /** Array of polygons defining the zone boundaries */
    polygons: Array<{
        /** Outer boundary coordinates [longitude, latitude] */
        exterior: Array<[number, number]>;
        /** Optional inner boundaries (holes) within the polygon */
        holes?: Array<Array<[number, number]>>;
    }>;
}



/**
 * Checks if a point (latitude, longitude) is inside a polygon using the ray-casting algorithm
 * Based on: https://dev.to/boobo94/how-to-verify-if-point-of-coordinates-is-inside-polygon-javascript-10n6
 * 
 * @param polygon - Array of coordinate pairs [lon, lat] forming the polygon
 * @returns boolean indicating if the point is inside the polygon
 */
function isPointInPolygon(lat: number, lon: number, polygon: Array<[number, number]>): boolean {
    const x = lon;
    const y = lat;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0];
        const yi = polygon[i][1];
        const xj = polygon[j][0];
        const yj = polygon[j][1];

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}


/**
 * Checks if a point is inside a polygon with holes
 * A point is inside if it's inside the exterior ring AND not inside any holes
 * 
 * @param polygonData - Polygon data with exterior and optional holes
 * @returns boolean indicating if the point is inside the polygon
 */
function isPointInPolygonWithHoles(
    lat: number, 
    lon: number, 
    polygonData: { exterior: Array<[number, number]>; holes?: Array<Array<[number, number]>> }
): boolean {
    // Check if point is inside the exterior ring
    if (!isPointInPolygon(lat, lon, polygonData.exterior)) {
        return false;
    }

    // If there are holes, check if point is inside any hole
    if (polygonData.holes) {
        for (const hole of polygonData.holes) {
            if (isPointInPolygon(lat, lon, hole)) {
                return false; // Point is in a hole
            }
        }
    }

    return true;
}


/**
 * Finds which NYC zone/area a coordinate point belongs to
 * Uses pre-processed lat/lng polygons for efficient lookup
 * 
 * @returns The zone information if found, null otherwise
 */
export function findZoneForCoordinate(latitude: number, longitude: number): Zone | null {
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
        throw new Error(`Invalid latitude: ${latitude}. Must be between -90 and 90`);
    }
    if (longitude < -180 || longitude > 180) {
        throw new Error(`Invalid longitude: ${longitude}. Must be between -180 and 180`);
    }

    const zones = zoneData as Zone[];
    
    for (const zone of zones) {
        // Check each polygon in the zone (some zones have multiple polygons)
        for (const polygonData of zone.polygons) {
            if (isPointInPolygonWithHoles(latitude, longitude, polygonData)) {
                return zone;
            }
        }
    }
    
    return null;
}


/**
 * Gets the zone names for origin and destination coordinates
 * @returns Object containing origin and destination zone names
 */
export function getZonesForRide(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
): { originZone: string | null; destinationZone: string | null } {
    const originZoneData = findZoneForCoordinate(originLat, originLng);
    const destZoneData = findZoneForCoordinate(destLat, destLng);
    
    return {
        originZone: originZoneData?.name || null,
        destinationZone: destZoneData?.name || null
    };
}