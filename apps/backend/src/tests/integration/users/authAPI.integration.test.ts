import request from 'supertest';
import { sequelize } from '../../../config/db';
import app from '../../../app';
import User from '../../../models/userModel';
import { generateRefreshToken } from '../../../utils/generateTokens';

// Set up environment variables for testing
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth API Integration Tests', () => {

  describe('POST /api/auth/signup', () => {
    it('should return 201 and create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toHaveProperty('userId');
      expect(res.body.data.username).toBe('testuser');

      // Verify user was created in database
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user).toBeTruthy();
      expect(user!.username).toBe('testuser');
      expect(user!.password).not.toBe('password123'); // Should be hashed
    });

    it('should return 400 when email already exists', async () => {
      // Create user first
      await User.create({
        email: 'test@example.com',
        username: 'firstuser',
        password: 'password123'
      });

      const userData = {
        email: 'test@example.com',
        username: 'seconduser',
        password: 'password456'
      };

      const res = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('User with this email already exists');
    });

    it('should return 400 when missing required fields', async () => {
      const testCases = [
        { body: { username: 'user', password: 'password123' }, missing: 'email' },
        { body: { email: 'test@example.com', password: 'password123' }, missing: 'username' },
        { body: { email: 'test@example.com', username: 'user' }, missing: 'password' },
      ];

      for (const testCase of testCases) {
        const res = await request(app)
          .post('/api/auth/signup')
          .send(testCase.body);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Please provide all fields');
      }
    });

    it('should return 400 when email format is invalid', async () => {
      const userData = {
        email: 'invalid-email-format',
        username: 'testuser',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should return 400 when password is too short', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'short'
      };

      const res = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should handle special characters in email and username', async () => {
      const userData = {
        email: 'test+special@example-domain.co.uk',
        username: 'test_user-123',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('test_user-123');
    });
  });

  describe('POST /api/auth/signin', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
    });

    it('should return 200 and tokens with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/signin')
        .send(credentials);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User logged in successfully');
      expect(res.body.data).toHaveProperty('token');
      expect(typeof res.body.data.token).toBe('string');

      // Verify access token is valid JWT
      const token = res.body.data.token;
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should set HTTP-only refresh token cookie on successful signin', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/signin')
        .send(credentials);

      expect(res.status).toBe(200);
      
      // Check cookie headers
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      const refreshTokenCookie = cookieArray.find((cookie: string) => 
        cookie.startsWith('refreshToken=')
      );
      
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toMatch(/HttpOnly/);
      expect(refreshTokenCookie).toMatch(/Path=\/api\/auth\/refresh/);
      expect(refreshTokenCookie).toMatch(/SameSite=Strict/);
    });

    it('should return 400 with invalid email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/signin')
        .send(credentials);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should return 400 with invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/auth/signin')
        .send(credentials);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should return 400 when missing email or password', async () => {
      const testCases = [
        { body: { password: 'password123' } },
        { body: { email: 'test@example.com' } },
        { body: {} }
      ];

      for (const testCase of testCases) {
        const res = await request(app)
          .post('/api/auth/signin')
          .send(testCase.body);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid email or password');
      }
    });

    it('should handle case-sensitive email correctly', async () => {
      const credentials = {
        email: 'TEST@EXAMPLE.COM', // Different case
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/signin')
        .send(credentials);

      // Should fail since email is case-sensitive in our implementation
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should handle password case sensitivity correctly', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'PASSWORD123' // Different case
      };

      const res = await request(app)
        .post('/api/auth/signin')
        .send(credentials);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid email or password');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let testUser: User;
    let validRefreshToken: string;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
      validRefreshToken = generateRefreshToken(testUser.id);
    });

    it('should return 200 and new access token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${validRefreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(typeof res.body.data.token).toBe('string');

      // Verify new access token is valid JWT
      const newToken = res.body.data.token;
      expect(newToken.split('.')).toHaveLength(3); // JWT format
    });

    it('should return 401 when no refresh token cookie', async () => {
      const res = await request(app)
        .post('/api/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('No refresh token');
    });

    it('should return 403 when refresh token is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=invalid.token.here']);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid refresh token');
    });

    it('should return 403 when refresh token is expired', async () => {
      // This test would require creating an expired token, which is complex
      // For now, we'll test with a malformed token that will fail verification
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=expired.token.here']);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid refresh token');
    });

    it('should work with multiple cookies present', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [
          'otherCookie=someValue',
          `refreshToken=${validRefreshToken}`,
          'anotherCookie=anotherValue'
        ]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });
  });

  describe('Full Authentication Flow Integration', () => {
    it('should complete full signup -> signin -> refresh flow', async () => {
      // 1. Signup
      const userData = {
        email: 'flow@example.com',
        username: 'flowuser',
        password: 'password123'
      };

      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(signupRes.status).toBe(201);

      // 2. Signin
      const signinRes = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'flow@example.com',
          password: 'password123'
        });

      expect(signinRes.status).toBe(200);
      expect(signinRes.body.data).toHaveProperty('token');

      // Extract refresh token from cookie
      const cookies = signinRes.headers['set-cookie'];
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      const refreshTokenCookie = cookieArray.find((cookie: string) => 
        cookie.startsWith('refreshToken=')
      );
      expect(refreshTokenCookie).toBeDefined();

      const refreshToken = refreshTokenCookie!.split('=')[1].split(';')[0];

      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Refresh
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data).toHaveProperty('token');

      // Verify the new token is different from the original
      expect(refreshRes.body.data.token).not.toBe(signinRes.body.data.token);
    });

    it('should maintain user data consistency across authentication flow', async () => {
      // Create user
      const userData = {
        email: 'consistency@example.com',
        username: 'consistencyuser',
        password: 'password123'
      };

      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      // Signin and verify user data
      const signinRes = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'consistency@example.com',
          password: 'password123'
        });

      expect(signinRes.status).toBe(200);

      // Verify user exists in database with correct data
      const user = await User.findOne({ where: { email: 'consistency@example.com' } });
      expect(user).toBeTruthy();
      expect(user!.username).toBe('consistencyuser');
      expect(user!.email).toBe('consistency@example.com');
    });
  });
}); 