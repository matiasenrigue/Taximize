import request from 'supertest';
import { sequelize } from '../../../../shared/config/db';
import { QueryTypes } from 'sequelize';
import { initializeAssociations } from '../../../../shared/config/associations';
import app from '../../../../app';
import User from '../../../users/user.model';
import { Hotspots } from '../../hotspots.model';
import { generateAccessToken } from '../../../auth/utils/generateTokens';

// Set up environment variables for testing
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

// Helper function to create authenticated user and get token
async function createAuthenticatedUser(email: string = 'user@test.com', username: string = 'testuser') {
  const user = await User.create({
    email,
    username,
    password: 'password123'
  });
  const token = generateAccessToken(user.id);
  return { user, token };
}

// Helper function to create hotspot data
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
  
  // Manually update created_at if needed (for testing old data)
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
  // Clean up in correct order due to foreign key constraints
  await Hotspots.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Hotspots API Integration Tests', () => {
  describe('GET /api/hotspots', () => {
    it('should return 401 when no authentication token provided', async () => {
      const response = await request(app)
        .get('/api/hotspots')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Not authorized, no token'
      });
    });

    it('should return 401 when invalid token provided', async () => {
      const response = await request(app)
        .get('/api/hotspots')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Not authorized, token failed'
      });
    });

    it('should return recent hotspots data when authenticated', async () => {
      const { token } = await createAuthenticatedUser();
      const hotspotsData = {
        timestamp: new Date().toISOString(),
        zones: [
          { name: "Zone1", count: 10 },
          { name: "Zone2", count: 15 }
        ]
      };
      await createHotspotData(hotspotsData);

      const response = await request(app)
        .get('/api/hotspots')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: hotspotsData
      });
    });

    it('should return cached data when recent data is older than 1 hour', async () => {
      const { token } = await createAuthenticatedUser();
      
      // Create old data (2 hours ago)
      const oldData = {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        zones: [{ name: "Zone1", count: 5 }]
      };
      await createHotspotData(oldData, new Date(Date.now() - 2 * 60 * 60 * 1000));

      // Since fetchNewHotspotsData will return false (API returns null),
      // it should return the cached data
      const response = await request(app)
        .get('/api/hotspots')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: oldData
      });
    });

    it('should return 500 error when no data is available', async () => {
      const { token } = await createAuthenticatedUser();
      
      // No hotspots data exists, and API returns null
      const response = await request(app)
        .get('/api/hotspots')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'No hotspots data available',
        data: null
      });
    });

    it('should handle multiple concurrent requests efficiently', async () => {
      const { token } = await createAuthenticatedUser();
      const hotspotsData = {
        timestamp: new Date().toISOString(),
        zones: [{ name: "Zone1", count: 10 }]
      };
      await createHotspotData(hotspotsData);

      // Make multiple concurrent requests
      const requests = Array(5).fill(null).map(() => 
        request(app)
          .get('/api/hotspots')
          .set('Authorization', `Bearer ${token}`)
      );

      const responses = await Promise.all(requests);
      
      // All should succeed with the same data
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: hotspotsData
        });
      });
    });

    it('should return most recent data when multiple entries exist', async () => {
      const { token } = await createAuthenticatedUser();
      
      // Create older data
      const oldData = {
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        zones: [{ name: "Zone1", count: 5 }]
      };
      await createHotspotData(oldData, new Date(Date.now() - 30 * 60 * 1000));

      // Create newer data
      const newData = {
        timestamp: new Date().toISOString(),
        zones: [{ name: "Zone1", count: 20 }]
      };
      await createHotspotData(newData);

      const response = await request(app)
        .get('/api/hotspots')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: newData
      });
    });

    it('should work correctly with user having non-standard ID format', async () => {
      // Create user with specific ID
      const user = await User.create({
        id: '12345678-1234-1234-1234-123456789012',
        email: 'special@test.com',
        username: 'specialuser',
        password: 'password123'
      });
      const token = generateAccessToken(user.id);

      const hotspotsData = {
        timestamp: new Date().toISOString(),
        zones: [{ name: "Zone1", count: 10 }]
      };
      await createHotspotData(hotspotsData);

      const response = await request(app)
        .get('/api/hotspots')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: hotspotsData
      });
    });
  });
});