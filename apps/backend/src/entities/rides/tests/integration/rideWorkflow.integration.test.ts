import request from 'supertest';
import { initializeAssociations } from '../../../../shared/config/associations';
import app from '../../../../app';
import Ride from '../../ride.model';
import { TestHelpers } from '../../../../shared/tests/utils/testHelpers';

TestHelpers.setupEnvironment();

// Common ride request bodies
const RIDE_COORDS = {
    first: {
        startLatitude: 53.349805,
        startLongitude: -6.260310,
        destinationLatitude: 53.359805,
        destinationLongitude: -6.270310
    },
    second: {
        startLatitude: 53.359805,
        startLongitude: -6.270310,
        destinationLatitude: 53.369805,
        destinationLongitude: -6.280310
    },
    third: {
        startLatitude: 53.369805,
        startLongitude: -6.280310,
        destinationLatitude: 53.379805,
        destinationLongitude: -6.290310
    }
};

beforeAll(async () => {
    initializeAssociations();
    await TestHelpers.setupDatabase();
});

afterEach(async () => {
    await TestHelpers.cleanupDatabase();
});

afterAll(async () => {
    await TestHelpers.closeDatabase();
});


describe('Ride Workflow Integration Tests', () => {

    describe('Complete Ride Lifecycle', () => {
        it('should handle full ride lifecycle: start → status → end', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // 1. Start ride
            const startRideRes = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.first,
                    address: "123 Test Street, Dublin",
                    predictedScore: 0.75
                });

            expect(startRideRes.status).toBe(200);
            const rideId = startRideRes.body.data.rideId;

            // 2. Get ride status
            const statusRes = await request(app)
                .get('/api/rides/current')
                .set('Authorization', `Bearer ${token}`);

            expect(statusRes.status).toBe(200);
            expect(statusRes.body.data.rideId).toBe(rideId);
            expect(statusRes.body.data.elapsedTimeMs).toBeGreaterThan(0);
            // Verify new fields are returned
            expect(statusRes.body.data.startTime).toBeDefined();
            expect(typeof statusRes.body.data.startTime).toBe('number');
            expect(statusRes.body.data.address).toBe("123 Test Street, Dublin");

            // 3. End ride
            const endRideRes = await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fareCents: 1500,
                    actualDistanceKm: 5.2
                });

            expect(endRideRes.status).toBe(200);
            expect(endRideRes.body.data.rideId).toBe(rideId);
            expect(endRideRes.body.data.earningCents).toBe(1500);

            // 4. Verify ride is ended in database
            const finalRide = await Ride.findByPk(rideId);
            expect(finalRide!.end_time).not.toBeNull();
            expect(finalRide!.earning_cents).toBe(1500);
        });


        it('should handle multiple sequential rides on same shift', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // First ride
            const ride1Res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.first,
                    address: "123 Test Street, Dublin",
                    predictedScore: 0.8
                });

            expect(ride1Res.status).toBe(200);
            const ride1Id = ride1Res.body.data.rideId;

            // End first ride
            await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fareCents: 1000,
                    actualDistanceKm: 3.0
                });

            // Second ride should succeed
            const ride2Res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.second,
                    address: "456 Second Street, Dublin",
                    predictedScore: 0.7
                });

            expect(ride2Res.status).toBe(200);
            const ride2Id = ride2Res.body.data.rideId;
            expect(ride2Id).not.toBe(ride1Id);

            // Verify both rides exist in database with same shift
            const rides = await Ride.findAll({ where: { shift_id: shift.id } });
            expect(rides).toHaveLength(2);
            expect(rides[0].shift_id).toBe(shift.id);
            expect(rides[1].shift_id).toBe(shift.id);
        });


        it('should handle ride with override destination in status check', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            await TestHelpers.createActiveShift(user.id);

            // Start ride
            await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.first,
                    address: "789 Third Street, Dublin",
                    predictedScore: 0.85
                });

            // Get status (override destination feature was removed)
            const statusRes = await request(app)
                .get('/api/rides/current')
                .set('Authorization', `Bearer ${token}`);

            expect(statusRes.status).toBe(200);
            expect(statusRes.body.data.currentDestinationLatitude).toBe(53.359805);
            expect(statusRes.body.data.currentDestinationLongitude).toBe(-6.270310);
        });
    });


    describe('Multiple Shifts and Rides', () => {
        it('should handle rides across different shifts', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            
            // First shift and ride
            const shift1 = await TestHelpers.createActiveShift(user.id);
            const ride1Res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.first,
                    address: "Cross-shift Ride 1 Address",
                    predictedScore: 0.65
                });

            expect(ride1Res.status).toBe(200);
            const ride1Id = ride1Res.body.data.rideId;

            // End first ride and shift
            await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fareCents: 1000,
                    actualDistanceKm: 3.0
                });

            await shift1.update({ shift_end: new Date() });

            // Second shift and ride
            const shift2 = await TestHelpers.createActiveShift(user.id);
            const ride2Res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.third,
                    address: "Cross-shift Ride 2 Address",
                    predictedScore: 0.9
                });

            expect(ride2Res.status).toBe(200);
            const ride2Id = ride2Res.body.data.rideId;

            // Verify rides belong to different shifts
            const finalRide1 = await Ride.findByPk(ride1Id);
            const finalRide2 = await Ride.findByPk(ride2Id);
            
            expect(finalRide1!.shift_id).toBe(shift1.id);
            expect(finalRide2!.shift_id).toBe(shift2.id);
            expect(finalRide1!.shift_id).not.toBe(finalRide2!.shift_id);
        });
    });


    describe('Error Recovery Scenarios', () => {
        it('should prevent second ride start while first is active', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            await TestHelpers.createActiveShift(user.id);

            // Start first ride
            const ride1Res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.first,
                    address: "Error Recovery First Ride",
                    predictedScore: 0.72
                });

            expect(ride1Res.status).toBe(200);

            // Attempt second ride should fail
            const ride2Res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.second,
                    address: "Error Recovery Second Ride (Should Fail)",
                    predictedScore: 0.68
                });

            expect(ride2Res.status).toBe(500);
            expect(ride2Res.body.error).toContain('Another ride is already in progress. Please end the current ride first.');
        });


        it('should handle ride start immediately after ending previous ride', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            await TestHelpers.createActiveShift(user.id);

            // Start and end first ride
            const ride1Res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.first,
                    address: "Sequential First Ride",
                    predictedScore: 0.78
                });

            expect(ride1Res.status).toBe(200);

            await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fareCents: 1000,
                    actualDistanceKm: 3.0
                });

            // Immediate second ride should succeed
            const ride2Res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.second,
                    address: "Sequential Second Ride",
                    predictedScore: 0.82
                });

            expect(ride2Res.status).toBe(200);
            expect(ride2Res.body.data.rideId).not.toBe(ride1Res.body.data.rideId);
        });
    });
});