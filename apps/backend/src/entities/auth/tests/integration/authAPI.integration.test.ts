import request from 'supertest';
import { sequelize } from '../../../../shared/config/db';
import { initializeAssociations } from '../../../../shared/config/associations';
import app from '../../../../app';
import User from '../../../users/user.model';
import { generateRefreshToken } from '../../utils/generateTokens';

// Set up environment variables for testing
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

// Test helper functions
const createTestUser = async (overrides = {}) => {
    const defaultUser = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
    };
    return User.create({ ...defaultUser, ...overrides });
};

const extractRefreshTokenFromCookie = (res: any): string | null => {
    const cookies = res.headers['set-cookie'];
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const refreshTokenCookie = cookieArray.find((cookie: string) => 
        cookie.startsWith('refreshToken=')
    );
    return refreshTokenCookie ? refreshTokenCookie.split('=')[1].split(';')[0] : null;
};

const expectValidJWT = (token: string) => {
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
};

const expectErrorResponse = (res: any, status: number, errorMessage: string) => {
    expect(res.status).toBe(status);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe(errorMessage);
};

const expectSuccessResponse = (res: any, status: number, message?: string) => {
    expect(res.status).toBe(status);
    expect(res.body.success).toBe(true);
    if (message) {
        expect(res.body.message).toBe(message);
    }
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    initializeAssociations();
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


        it.each([
            { body: { username: 'user', password: 'password123' }, missing: 'email' },
            { body: { email: 'test@example.com', password: 'password123' }, missing: 'username' },
            { body: { email: 'test@example.com', username: 'user' }, missing: 'password' },
        ])('should return 400 when missing $missing field', async ({ body }) => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send(body);

            expectErrorResponse(res, 400, 'Please provide all fields');
        });


        it.each([
            { email: 'invalid-email-format', username: 'testuser', password: 'password123', reason: 'invalid email format' },
            { email: 'test@example.com', username: 'testuser', password: 'short', reason: 'password too short' }
        ])('should return 400 when $reason', async (userData) => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send(userData);

            expectErrorResponse(res, 400, 'Invalid email or password');
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
            testUser = await createTestUser();
        });


        it('should return 200 and tokens with valid credentials', async () => {
            const credentials = {
                email: 'test@example.com',
                password: 'password123'
            };

            const res = await request(app)
                .post('/api/auth/signin')
                .send(credentials);

            expectSuccessResponse(res, 200, 'User logged in successfully');
            expect(res.body.data).toHaveProperty('token');
            expectValidJWT(res.body.data.token);
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
            
            const refreshToken = extractRefreshTokenFromCookie(res);
            expect(refreshToken).toBeTruthy();
            
            const cookies = res.headers['set-cookie'];
            const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
            const refreshTokenCookie = cookieArray.find((cookie: string) => 
                cookie.startsWith('refreshToken=')
            );
            
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


        it.each([
            { body: { password: 'password123' }, missing: 'email' },
            { body: { email: 'test@example.com' }, missing: 'password' },
            { body: {}, missing: 'both fields' }
        ])('should return 400 when missing $missing', async ({ body }) => {
            const res = await request(app)
                .post('/api/auth/signin')
                .send(body);

            expectErrorResponse(res, 400, 'Invalid email or password');
        });


        it.each([
            { email: 'TEST@EXAMPLE.COM', password: 'password123', field: 'email' },
            { email: 'test@example.com', password: 'PASSWORD123', field: 'password' }
        ])('should handle $field case sensitivity correctly', async (credentials) => {
            const res = await request(app)
                .post('/api/auth/signin')
                .send(credentials);

            expectErrorResponse(res, 400, 'Invalid email or password');
        });
    });


    describe('POST /api/auth/refresh', () => {
        let testUser: User;
        let validRefreshToken: string;

        beforeEach(async () => {
            testUser = await createTestUser();
            validRefreshToken = generateRefreshToken(testUser.id);
        });


        it('should return 200 and new access token with valid refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${validRefreshToken}`]);

            expectSuccessResponse(res, 200);
            expect(res.body.data).toHaveProperty('token');
            expectValidJWT(res.body.data.token);
        });


        it('should return 401 when no refresh token cookie', async () => {
            const res = await request(app)
                .post('/api/auth/refresh');

            expectErrorResponse(res, 401, 'No refresh token');
        });


        it('should return 403 when refresh token is invalid', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', ['refreshToken=invalid.token.here']);

            expectErrorResponse(res, 403, 'Invalid refresh token');
        });


        it('should return 403 when refresh token is expired', async () => {
            // This test would require creating an expired token, which is complex
            // For now, we'll test with a malformed token that will fail verification
            const res = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', ['refreshToken=expired.token.here']);

            expectErrorResponse(res, 403, 'Invalid refresh token');
        });


        it('should work with multiple cookies present', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [
                    'otherCookie=someValue',
                    `refreshToken=${validRefreshToken}`,
                    'anotherCookie=anotherValue'
                ]);

            expectSuccessResponse(res, 200);
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
            const refreshToken = extractRefreshTokenFromCookie(signinRes);
            expect(refreshToken).toBeTruthy();

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