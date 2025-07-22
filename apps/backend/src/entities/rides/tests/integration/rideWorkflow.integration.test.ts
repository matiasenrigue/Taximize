import request from 'supertest';
import { initializeAssociations } from '../../../../shared/config/associations';
import app from '../../../../app';
import Ride from '../../ride.model';
import { TestHelpers } from '../../../../shared/tests/utils/testHelpers';

TestHelpers.setupEnvironment();

// Test coords around Dublin
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


describe('Ride Workflows', () => {


    describe('happy path ride flow', () => {


        it('start -> check status -> end ride', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Start
            const startRes = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.first,
                    address: "O'Connell Street",
                    predictedScore: 0.75
                });

            expect(startRes.status).toBe(200);
            const rideId = startRes.body.data.rideId;

            // Check it
            const statusRes = await request(app)
                .get('/api/rides/current')
                .set('Authorization', `Bearer ${token}`);

            expect(statusRes.status).toBe(200);
            expect(statusRes.body.data.rideId).toBe(rideId);
            expect(statusRes.body.data.elapsedTimeMs).toBeGreaterThan(0); // time passed
            expect(statusRes.body.data.startTime).toBeDefined();
            expect(typeof statusRes.body.data.startTime).toBe('number');
            expect(statusRes.body.data.address).toBe("O'Connell Street"); // matches

            // Complete it
            const endRes = await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fareCents: 1500,
                    actualDistanceKm: 5.2
                });

            expect(endRes.status).toBe(200);
            expect(endRes.body.data.rideId).toBe(rideId);
            expect(endRes.body.data.earningCents).toBe(1500); // €15

            // DB check
            const finalRide = await Ride.findByPk(rideId);
            expect(finalRide!.end_time).not.toBeNull(); // completed
            expect(finalRide!.earning_cents).toBe(1500);
        });




        it('multiple rides per shift', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Morning ride
            const res1 = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.first,
                    address: "Temple Bar",
                    predictedScore: 0.8
                });

            const ride1Id = res1.body.data.rideId;

            // Drop off passenger
            await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fareCents: 1000, // €10
                    actualDistanceKm: 3.0
                });

            // Afternoon ride  
            const res2 = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.second,
                    address: "Phoenix Park",
                    predictedScore: 0.7
                });

            expect(res2.status).toBe(200);
            const ride2Id = res2.body.data.rideId;
            expect(ride2Id).not.toBe(ride1Id); // different rides

            // Check DB has both
            const rides = await Ride.findAll({ where: { shift_id: shift.id } });
            expect(rides).toHaveLength(2);
            expect(rides[0].shift_id).toBe(shift.id); // same shift
            expect(rides[1].shift_id).toBe(shift.id);
        });



    });



    describe('shift switching', () => {
        it('new shift = new rides', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            
            // Morning shift
            const shift1 = await TestHelpers.createActiveShift(user.id);
            const res1 = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.first,
                    address: "Morning pickup",
                    predictedScore: 0.65
                });

            const ride1Id = res1.body.data.rideId;

            // End ride and clock out
            await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fareCents: 1000,
                    actualDistanceKm: 3.0
                });

            await shift1.update({ shift_end: new Date() }); // clock out


            // Evening shift - clock back in
            const shift2 = await TestHelpers.createActiveShift(user.id);
            const res2 = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.third,
                    address: "Evening pickup",
                    predictedScore: 0.9
                });

            expect(res2.status).toBe(200);
            const ride2Id = res2.body.data.rideId;

            // Verify separation
            const ride1 = await Ride.findByPk(ride1Id);
            const ride2 = await Ride.findByPk(ride2Id);
            
            expect(ride1!.shift_id).toBe(shift1.id); // morning shift
            expect(ride2!.shift_id).toBe(shift2.id); // evening shift  
            expect(ride1!.shift_id).not.toBe(ride2!.shift_id);
        });
    });



    describe('error cases', () => {
        it('blocks double booking', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            await TestHelpers.createActiveShift(user.id);

            // Start ride
            await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.first,
                    address: "First passenger",
                    predictedScore: 0.72
                });

            // Try to take another
            const res2 = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.second,
                    address: "Second passenger",
                    predictedScore: 0.68
                });

            expect(res2.status).toBe(500);
            expect(res2.body.error).toContain('Another ride is already in progress'); // can't double book!
        });



        it('quick turnaround between rides', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            await TestHelpers.createActiveShift(user.id);

            // Ride 1
            const res1 = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.first,
                    address: "Quick drop",
                    predictedScore: 0.78
                });

            // Drop off
            await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fareCents: 1000,
                    actualDistanceKm: 3.0
                });

            // Immediately pick up next passenger
            const res2 = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...RIDE_COORDS.second,
                    address: "Next pickup",
                    predictedScore: 0.82
                });

            expect(res2.status).toBe(200);
            expect(res2.body.data.rideId).not.toBe(res1.body.data.rideId); // new ride
        });
    });
});