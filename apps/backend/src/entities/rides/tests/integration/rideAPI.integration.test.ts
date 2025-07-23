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

    // Some common test data
    const DUBLIN_COORDS = {
        start: { lat: 53.349805, lng: -6.260310 },
        end: { lat: 53.359805, lng: -6.270310 }
    };

    describe('POST /api/rides/evaluate-ride', () => {
        it('should return 401 when no authentication provided', async () => {
            const requestBody = {
                startLatitude: DUBLIN_COORDS.start.lat,
                startLongitude: DUBLIN_COORDS.start.lng,
                destinationLatitude: DUBLIN_COORDS.end.lat,
                destinationLongitude: DUBLIN_COORDS.end.lng
            };

            const res = await request(app)
                .post('/api/rides/evaluate-ride')
                .send(requestBody);
                
            expect(res.status).toBe(401);
        });


        // FIXME: broken after zone refactor
        it.skip('returns predicted score when authenticated', async () => {
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


        it('validates coordinate types', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const res = await request(app)
                .post('/api/rides/evaluate-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    startLatitude: 'not a number',
                    startLongitude: -6.260310,
                    destinationLatitude: 53.359805,
                    destinationLongitude: -6.270310
                });
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('Invalid coordinates'); // should validate input
        });

        
        it('requires all coordinates', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const requestBody = {
                startLatitude: 53.349805,
                startLongitude: -6.260310
                // oops forgot destination
            };

            const res = await request(app)
                .post('/api/rides/evaluate-ride')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Missing required coordinates');
        });
    });


    
    
    
    describe('starting rides', () => {

        it('needs auth', async () => {
            const res = await request(app)
                .post('/api/rides/start-ride')
                .send({
                    startLatitude: 53.349805,
                    startLongitude: -6.260310,
                    destinationLatitude: 53.359805,
                    destinationLongitude: -6.270310,
                    address: "O'Connell Street",
                    predictedScore: 0.75
                });
                
            expect(res.status).toBe(401);
        });


        it('driver needs active shift to start ride', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    startLatitude: DUBLIN_COORDS.start.lat,
                    startLongitude: DUBLIN_COORDS.start.lng,
                    destinationLatitude: DUBLIN_COORDS.end.lat,
                    destinationLongitude: DUBLIN_COORDS.end.lng,
                    address: "Temple Bar, Dublin",
                    predictedScore: 0.8
                });
                
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('No active shift'); // no shift = no ride
        });


        it('bad coordinates', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    startLatitude: 'abc', // not a number!
                    startLongitude: -6.260310,
                    destinationLatitude: 53.359805,
                    destinationLongitude: -6.270310,
                    address: "Invalid coords test",
                    predictedScore: 0.7
                });
                
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Invalid coordinates');
        });

        it('predicted score must be 0-1', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const requestBody = {
                startLatitude: 53.349805,
                startLongitude: -6.260310,
                destinationLatitude: 53.359805,
                destinationLongitude: -6.270310,
                address: "Score validation test",
                predictedScore: 2.5 // way too high
            };

            const res = await request(app)
                .post('/api/rides/start-ride')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Invalid prediction score'); // must be 0-1
        });
    });


    describe('current ride status', () => {
        it('401 without auth', async () => {
            const res = await request(app).get('/api/rides/current');
            expect(res.status).toBe(401);
        });

        it('no shift = no ride status', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();

            const res = await request(app)
                .get('/api/rides/current')
                .set('Authorization', `Bearer ${token}`);
                
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('No active shift found'); // gotta clock in first
        });

        
        // This test catches a common scenario
        it('handles when shift exists but no ride started', async () => {
            const { token, driver } = await TestHelpers.createAuthenticatedUser();
            await TestHelpers.createActiveShift(driver.id);

            const res = await request(app)
                .get('/api/rides/current')
                .set('Authorization', `Bearer ${token}`);
                
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('No active ride found');
        });
    });


    describe('ending rides', () => {
        it('needs auth', async () => {
            const res = await request(app)
                .post('/api/rides/end-ride')
                .send({ fareCents: 1450, actualDistanceKm: 4.2 });
                
            expect(res.status).toBe(401);
        });

        
        it('cant end ride without having one', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const res = await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fareCents: 1450,
                    actualDistanceKm: 4.2
                });
                
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('No active shift'); // need shift first
        });


        it('validates required fields', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const res = await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({ fareCents: 1450 }); // forgot distance
                
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Missing required fields');
        });

        
        
        it('fare must be a number', async () => {
            const { token } = await TestHelpers.createAuthenticatedUser();
            
            const res = await request(app)
                .post('/api/rides/end-ride')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fareCents: 'fourteen fifty',
                    actualDistanceKm: 4.2
                });
                
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Invalid fare or distance');
        });
    });




});
