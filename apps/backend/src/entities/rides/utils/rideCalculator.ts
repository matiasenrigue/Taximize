export class RideCalculator {
    static computeDistanceKm(startLat: number, startLng: number, destLat: number, destLng: number): number {
        if (startLat === destLat && startLng === destLng) {
            return 0;
        }

        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(destLat - startLat);
        const dLng = this.toRadians(destLng - startLng);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                            Math.cos(this.toRadians(startLat)) * Math.cos(this.toRadians(destLat)) *
                            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    static computeFare(elapsedMs: number, distanceKm: number): number {
        if (elapsedMs === 0 && distanceKm === 0) {
            return 0;
        }
        
        // Basic fare calculation: base fare + time component + distance component
        const baseFare = 2.50;
        const timeRatePerMinute = 0.30;
        const distanceRatePerKm = 1.20;
        
        const elapsedMinutes = elapsedMs / (1000 * 60);
        return baseFare + (elapsedMinutes * timeRatePerMinute) + (distanceKm * distanceRatePerKm);
    }

    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
} 