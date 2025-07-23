import request from 'supertest';
import { initializeAssociations } from '../../../../shared/config/associations';
import app from '../../../../app';
import Ride from '../../ride.model';
import Shift from '../../../shifts/shift.model';
import ShiftSignal from '../../../shift-signals/shiftSignal.model';
import { TestHelpers } from '../../../../shared/tests/utils/testHelpers';

TestHelpers.setupEnvironment();

// Standard Dublin ride coords
const DEFAULT_RIDE_REQUEST = {
    startLatitude: 53.349805,
    startLongitude: -6.260310,
    destinationLatitude: 53.359805,
    destinationLongitude: -6.270310,
    predictedScore: 0.85
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


describe('Ride State Transitions', () => {

    describe('shift state changes', () => {

        it('cant start ride after clocking out', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Clock out
            await shift.update({ shift_end: new Date() });

            const res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...DEFAULT_RIDE_REQUEST,
                    address: "Temple Bar"
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('No active shift'); // need to clock in first
        });


    });


    describe('pause/continue effects', () => {
        it('paused drivers cant take rides', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Take a break
            await ShiftSignal.create({
                shift_id: shift.id,
                signal: 'pause',
                timestamp: new Date()
            });

            const res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...DEFAULT_RIDE_REQUEST,
                    address: "Break time test"
                });

            expect(res.status).toBe(500);
            expect(res.body.error).toContain('Cannot start ride while on break'); // coffee first!
        });


        it('back from break = ready to ride', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Pause
            await ShiftSignal.create({
                shift_id: shift.id,
                signal: 'pause',
                timestamp: new Date(Date.now() - 60000)
            });

            // Back to work
            await ShiftSignal.create({
                shift_id: shift.id,
                signal: 'continue',
                timestamp: new Date()
            });

            const res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...DEFAULT_RIDE_REQUEST,
                    address: "Airport run"
                });

            expect(res.status).toBe(200);
            expect(res.body.data.rideId).toBeDefined(); // good to go
        });
    });




    describe('db state tracking', () => {
        it('ride lifecycle updates properly', async () => {
            const { user, token } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Start
            const startRes = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    ...DEFAULT_RIDE_REQUEST,
                    address: "Lifecycle test"
                });

            const rideId = startRes.body.data.rideId;

            // Check initial state
            let ride = await Ride.findByPk(rideId);
            expect(ride!.shift_id).toBe(shift.id);
            expect(ride!.end_time).toBeNull(); // still active
            expect(ride!.earning_cents).toBeNull(); // no money yet

            // Complete it
            await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fareCents: 1500,
                    actualDistanceKm: 5.0
                });

            // Final check
            ride = await Ride.findByPk(rideId);
            expect(ride!.end_time).not.toBeNull(); // done
            expect(ride!.earning_cents).toBe(1500); // paid
            expect(ride!.distance_km).toBe(5.0);
        });

    });
});
