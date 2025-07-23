import request from 'supertest';
import { sequelize } from '../../../../shared/config/db';
import { QueryTypes } from 'sequelize';
import { initializeAssociations } from '../../../../shared/config/associations';
import app from '../../../../app';
import User from '../../../users/user.model';
import { Hotspots } from '../../hotspots.model';
import { generateAccessToken } from '../../../auth/utils/generateTokens';

process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

async function createAuthenticatedUser(email: string = 'user@test.com', username: string = 'testuser') {
    const user = await User.create({
        email,
        username,
        password: 'password123'
    });
    const token = generateAccessToken(user.id);
    return { user, token };
}

async function createHotspotData(data: any = null, createdAt: Date = new Date()) {
    const defaultData = data || {
        timestamp: new Date().toISOString(),
        zones: [
            { name: "Zone1", count: 10 },
            { name: "Zone2", count: 15 }
        ]
    };
    
    const hotspot = await Hotspots.create({
        data: defaultData,
        createdAt: createdAt,
        updatedAt: createdAt
    });
    
    // hack to test old data - sequelize doesn't let us set createdAt directly sometimes
    if (createdAt !== hotspot.createdAt) {
        await sequelize.query(
            `UPDATE hotspots SET created_at = :createdAt WHERE id = :id`,
            {
                replacements: { createdAt, id: hotspot.id },
                type: QueryTypes.UPDATE
            }
        );
    }
    
    return hotspot;
}

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    initializeAssociations();
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    // clean up - order matters because of FKs
    await Hotspots.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
});

afterAll(async () => {
    await sequelize.close();
});


describe('Hotspots API', () => {

    describe('GET /api/hotspots', () => {
        it('blocks unauthenticated requests', async () => {
            const response = await request(app)
                .get('/api/hotspots')
                .expect(401);

            expect(response.body).toEqual({
                success: false,
                error: 'Not authorized, no token'
            });
        });


        it('rejects bad tokens', async () => {
            const response = await request(app)
                .get('/api/hotspots')
                .set('Authorization', 'Bearer totally.fake.token')
                .expect(401);

            expect(response.body.success).toBe(false); // nope
            expect(response.body.error).toContain('token failed');
        });


        it('returns hotspots for logged in users', async () => {
            const { token } = await createAuthenticatedUser();
            const testData = {
                timestamp: new Date().toISOString(),
                zones: [
                    { name: "Zone1", count: 10 },
                    { name: "Zone2", count: 15 }
                ]
            };
            await createHotspotData(testData);

            const response = await request(app)
                .get('/api/hotspots')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true); 
            expect(response.body.data).toEqual(testData);
        });


        it('uses cache when data is stale', async () => {
            const { token } = await createAuthenticatedUser();
            
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const staleData = {
                timestamp: twoHoursAgo.toISOString(),
                zones: [{ name: "Zone1", count: 5 }]
            };
            await createHotspotData(staleData, twoHoursAgo);

            // api mock returns null so it'll use the cache
            const response = await request(app)
                .get('/api/hotspots')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.data).toEqual(staleData); // old but gold
        });


        // this is the worst case
        it('errors when totally empty', async () => {
            const { token } = await createAuthenticatedUser();
            
            const response = await request(app)
                .get('/api/hotspots')
                .set('Authorization', `Bearer ${token}`)
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('No hotspots data');
        });


        it('handles concurrent requests', async () => {
            const { token } = await createAuthenticatedUser();
            const data = {
                timestamp: new Date().toISOString(),
                zones: [{ name: "Zone1", count: 10 }]
            };
            await createHotspotData(data);

            // spam the endpoint
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(
                    request(app)
                        .get('/api/hotspots')
                        .set('Authorization', `Bearer ${token}`)
                );
            }

            const results = await Promise.all(promises);
            
            results.forEach(res => {
                expect(res.status).toBe(200); // all good
                expect(res.body.data).toEqual(data);
            });
        });


        it('picks newest data', async () => {
            const { token } = await createAuthenticatedUser();
            
            // old data
            await createHotspotData(
                { timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), zones: [{ name: "Zone1", count: 5 }] },
                new Date(Date.now() - 30 * 60 * 1000)
            );

            // fresh data  
            const fresh = {
                timestamp: new Date().toISOString(),
                zones: [{ name: "Zone1", count: 20 }]
            };
            await createHotspotData(fresh);

            const response = await request(app)
                .get('/api/hotspots')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.data).toEqual(fresh); // newer wins
        });


    });
});