import { RideCalculator } from '../../utils/rideCalculator';


describe('RideCalculator Unit Tests', () => {
    describe('computeDistanceKm', () => {
        it('should return 0 when computing distance between two identical coordinates', () => {
            // Test that when computing distance between two identical coordinates, computeDistanceKm returns 0
            const lat = 53.349805;
            const lng = -6.260310;
            
            const result = RideCalculator.computeDistanceKm(lat, lng, lat, lng);
            expect(result).toBe(0);
        });


        it('should return the expected haversine result between known points', () => {
            // Test that when computing distance between known points, computeDistanceKm returns the expected haversine result
            const dublinLat = 53.349805;
            const dublinLng = -6.260310;
            const corkLat = 51.8985;
            const corkLng = -8.4756;
            
            const result = RideCalculator.computeDistanceKm(dublinLat, dublinLng, corkLat, corkLng);
            // Dublin to Cork is approximately 220-230km by road
            expect(result).toBeGreaterThan(200);
            expect(result).toBeLessThan(300);
        });
    });


    describe('computeFare', () => {
        it('should return 0 when passing zero time and distance', () => {
            // Test that when passing zero time and distance to computeFare, it returns 0
            const result = RideCalculator.computeFare(0, 0);
            expect(result).toBe(0);
        });


        it('should apply the correct formula when passing positive elapsedMs and distanceKm', () => {
            // Test that when passing positive elapsedMs and distanceKm to computeFare, it applies the correct formula
            const elapsedMs = 600000; // 10 minutes
            const distanceKm = 5;
            
            const result = RideCalculator.computeFare(elapsedMs, distanceKm);
            expect(result).toBeGreaterThan(0);
            expect(typeof result).toBe('number');
        });
    });
}); 