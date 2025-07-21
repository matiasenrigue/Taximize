import request from 'supertest';
import { initializeAssociations } from '../../../../shared/config/associations';
import app from '../../../../app';
import User from '../../../users/user.model';
import Ride from '../../ride.model';
import Shift from '../../../shifts/shift.model';
import { TestHelpers } from '../../../../shared/tests/utils/testHelpers';

TestHelpers.setupEnvironment();

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


describe('Ride API Integration Tests', () => {

    describe('POST /api/rides/evaluate-ride', () => {
        it('should return 401 when no authentication provided', async () => {
            const requestBody = {
                startLatitude: 53.349805,
                startLongitude: -6.260310,
                destinationLatitude: 53.359805,
                destinationLongitude: -6.270310
            };

            const res = await request(app)
                .post('/api/rides/evaluate-ride')
                .send(requestBody);
                
            expect(res.status).toBe(401);
        });


        it.skip('should return 200 and predicted score when authenticated with valid coordinates - skipped due to zone setup', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const requestBody = {
                startLatitude: 53.349805,
                startLongitude: -6.260310,
                destinationLatitude: 53.359805,
                destinationLongitude: -6.270310
            };

            const res = await request(app)
                .post('/api/rides/evaluate-ride')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.rating).toBeGreaterThanOrEqual(1);
            expect(res.body.rating).toBeLessThanOrEqual(5);
        });


        it('should return 400 when authenticated but invalid coordinates provided', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const requestBody = {
                startLatitude: 'invalid',
                startLongitude: -6.260310,
                destinationLatitude: 53.359805,
                destinationLongitude: -6.270310
            };

            const res = await request(app)
                .post('/api/rides/evaluate-ride')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Invalid coordinates');
        });


        it('should return 400 when authenticated but missing required coordinates', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const requestBody = {
                startLatitude: 53.349805,
                startLongitude: -6.260310
                // Missing destination coordinates
            };

            const res = await request(app)
                .post('/api/rides/evaluate-ride')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Missing required coordinates');
        });
    });


    describe('POST /api/rides/start-ride', () => {
        it('should return 401 when no authentication provided', async () => {
            const requestBody = {
                startLatitude: 53.349805,
                startLongitude: -6.260310,
                destinationLatitude: 53.359805,
                destinationLongitude: -6.270310,
                address: "Test Address",
                predictedScore: 0.75
            };

            const res = await request(app)
                .post('/api/rides/start-ride')
                .send(requestBody);
                
            expect(res.status).toBe(401);
        });


        it('should return 400 when authenticated driver has no active shift', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const requestBody = {
                startLatitude: 53.349805,
                startLongitude: -6.260310,
                destinationLatitude: 53.359805,
                destinationLongitude: -6.270310,
                address: "Test Address, Dublin",
                predictedScore: 0.8
            };

            const res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('No active shift found');
        });


        it('should return 400 when authenticated but invalid coordinates provided', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const requestBody = {
                startLatitude: 'invalid',
                startLongitude: -6.260310,
                destinationLatitude: 53.359805,
                destinationLongitude: -6.270310,
                address: "Test Address for Invalid Coordinates",
                predictedScore: 0.7
            };

            const res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Invalid coordinates');
        });


        it('should return 400 when authenticated but invalid predicted score provided', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const requestBody = {
                startLatitude: 53.349805,
                startLongitude: -6.260310,
                destinationLatitude: 53.359805,
                destinationLongitude: -6.270310,
                address: "Test Address for Invalid Score",
                predictedScore: 1.5 // Invalid: > 1
            };

            const res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Invalid prediction score. Must be between 0 and 1');
        });
    });


    describe('GET /api/rides/current', () => {
        it('should return 401 when no authentication provided', async () => {
            const res = await request(app)
                .get('/api/rides/current');
                
            expect(res.status).toBe(401);
        });


        it('should return 400 when authenticated driver has no active shift', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();

            const res = await request(app)
                .get('/api/rides/current')
                .set('Authorization', `Bearer ${token}`);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('No active shift found. Please start a shift before checking ride status.');
        });


        it('should return 400 when authenticated but no active ride exists', async () => {
            const { token, driver } = await TestHelpers.createAuthenticatedUser();
            await TestHelpers.createActiveShift(driver.id);

            const res = await request(app)
                .get('/api/rides/current')
                .set('Authorization', `Bearer ${token}`);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('No active ride found. Please start a ride first.');
        });
    });


    describe('POST /api/rides/end-ride', () => {
        it('should return 401 when no authentication provided', async () => {
            const requestBody = {
                fareCents: 1450,
                actualDistanceKm: 4.2
            };

            const res = await request(app)
                .post('/api/rides/end-ride')
                .send(requestBody);
                
            expect(res.status).toBe(401);
        });


        it('should return 400 when authenticated driver has no active ride', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const requestBody = {
                fareCents: 1450,
                actualDistanceKm: 4.2
            };

            const res = await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('No active shift found. Please start a shift before checking ride status.');
        });


        it('should return 400 when authenticated but missing required fields', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const requestBody = {
                fareCents: 1450
                // Missing actualDistanceKm
            };

            const res = await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Missing required fields');
        });


        it('should return 400 when authenticated but invalid field types provided', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const requestBody = {
                fareCents: 'invalid',
                actualDistanceKm: 4.2
            };

            const res = await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Invalid fare or distance');
        });
    });


    describe('Database Constraints', () => {
        it('should violate unique constraint when creating second active ride for same shift', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            const shift = await Shift.create({
                driver_id: user.id,
                shift_start: new Date(),
                shift_end: null
            });

            // Create first active ride
            await Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                address: "First Active Ride Test Address",
                start_time: new Date(),
                predicted_score: 3,
                end_time: null // Active ride
            });

            // Attempt to create second active ride for same shift - should fail
            await expect(Ride.create({
                shift_id: shift.id, // Same shift
                driver_id: user.id,
                start_latitude: 53.359805,
                start_longitude: -6.270310,
                destination_latitude: 53.369805,
                destination_longitude: -6.280310,
                address: "Second Active Ride Test Address (Should Fail)",
                start_time: new Date(),
                predicted_score: 4,
                end_time: null // Active ride - should violate constraint
            })).rejects.toThrow(); // Expecting constraint violation
        });
    });

}); 