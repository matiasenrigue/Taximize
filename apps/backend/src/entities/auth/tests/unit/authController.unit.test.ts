import { Request, Response, NextFunction } from 'express';
import { signup, signin, refresh } from '../../auth.controller';
import { sequelize } from '../../../../shared/config/db';
import User from '../../../users/user.model';
import { generateRefreshToken } from '../../utils/generateTokens';
import jwt from 'jsonwebtoken';

// Mock express-async-handler to pass errors to our test handler
jest.mock('express-async-handler', () => {
    return (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
        return Promise.resolve(fn(req, res, next)).catch((err) => {
            // In tests, we want to handle errors as JSON responses
            res.status(res.statusCode || 500);
            res.json({
                success: false,
                error: err.message
            });
        });
    };
});

// Set up environment variables for testing
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

// Mock response object
const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
};

// Mock next function
const mockNext = jest.fn() as NextFunction;

// Test helper functions
const createTestUser = async (overrides = {}) => {
    const defaultUser = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
    };
    return User.create({ ...defaultUser, ...overrides });
};

const createRequest = (body: any, cookies?: any): Request => {
    return {
        body,
        cookies: cookies || {}
    } as Request;
};

const expectSuccessResponse = (res: Response, status: number | null, data: any) => {
    if (status !== null) {
        expect(res.status).toHaveBeenCalledWith(status);
    }
    expect(res.json).toHaveBeenCalledWith({
        success: true,
        ...data
    });
};

const expectErrorResponse = (res: Response, status: number, error: string) => {
    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        error
    });
};

const expectValidJWT = (token: string, userId: string) => {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
    expect(decoded.id).toBe(userId);
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
};

// Set up test database before running tests
beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    await User.destroy({ where: {} });
    jest.clearAllMocks();
});

afterAll(async () => {
    await sequelize.close();
});


describe('Auth Controller Unit Tests', () => {

    describe('signup', () => {
        it('should create user and return success response when valid data provided', async () => {
            const req = createRequest({
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123'
            });
            const res = mockResponse();

            await signup(req, res, mockNext);

            expectSuccessResponse(res, 201, {
                message: 'User registered successfully',
                data: {
                    userId: expect.any(String),
                    username: 'testuser'
                }
            });
        });


        it.each([
            { body: { username: 'testuser', password: 'password123' }, missing: 'email' },
            { body: { email: 'test@example.com', password: 'password123' }, missing: 'username' },
            { body: { email: 'test@example.com', username: 'testuser' }, missing: 'password' }
        ])('should throw error when missing $missing', async ({ body }) => {
            const req = createRequest(body);
            const res = mockResponse();

            await signup(req, res, mockNext);

            expectErrorResponse(res, 400, 'Please provide all fields');
        });


        it.each([
            { email: 'invalid-email', username: 'testuser', password: 'password123', reason: 'email is invalid' },
            { email: 'test@example.com', username: 'testuser', password: 'short', reason: 'password is too short' }
        ])('should throw error when $reason', async (body) => {
            const req = createRequest(body);
            const res = mockResponse();

            await signup(req, res, mockNext);

            expectErrorResponse(res, 400, 'Invalid email or password');
        });


        it('should return 400 error when user already exists', async () => {
            // Create user first
            await createTestUser();

            const req = createRequest({
                email: 'test@example.com',
                username: 'testuser2',
                password: 'password123'
            });
            const res = mockResponse();

            await signup(req, res, mockNext);

            expectErrorResponse(res, 400, 'User with this email already exists');
        });


        it('should hash password before saving', async () => {
            const req = createRequest({
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123'
            });
            const res = mockResponse();

            await signup(req, res, mockNext);

            const user = await User.findOne({ where: { email: 'test@example.com' } });
            expect(user).toBeTruthy();
            expect(user!.password).not.toBe('password123'); // Should be hashed
            expect(user!.password.length).toBeGreaterThan(50); // Hashed passwords are longer
        });


        it('should create user with correct data', async () => {
            const req = createRequest({
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123'
            });
            const res = mockResponse();

            await signup(req, res, mockNext);

            const callArgs = (res.json as jest.Mock).mock.calls[0][0];
            const userId = callArgs.data.userId;

            // Verify user was created correctly
            const user = await User.findByPk(userId);
            expect(user).toBeTruthy();
            expect(user!.email).toBe('test@example.com');
            expect(user!.username).toBe('testuser');
        });
    });


    describe('signin', () => {
        let testUser: User;

        beforeEach(async () => {
            testUser = await createTestUser();
        });


        it('should sign in user and return token when valid credentials provided', async () => {
            const req = createRequest({
                email: 'test@example.com',
                password: 'password123'
            });
            const res = mockResponse();

            await signin(req, res, mockNext);

            expectSuccessResponse(res, 200, {
                message: 'User logged in successfully',
                data: {
                    token: expect.any(String)
                }
            });
            expect(res.cookie).toHaveBeenCalledWith(
                'refreshToken',
                expect.any(String),
                expect.objectContaining({
                    httpOnly: true,
                    secure: false,
                    sameSite: 'strict',
                    path: '/api/auth/refresh',
                    maxAge: 7 * 24 * 60 * 60 * 1000
                })
            );
        });


        it('should return 400 error when user does not exist', async () => {
            const req = createRequest({
                email: 'nonexistent@example.com',
                password: 'password123'
            });
            const res = mockResponse();

            await signin(req, res, mockNext);

            expectErrorResponse(res, 400, 'Invalid email or password');
        });


        it('should return 400 error when password is incorrect', async () => {
            const req = createRequest({
                email: 'test@example.com',
                password: 'wrongpassword'
            });
            const res = mockResponse();

            await signin(req, res, mockNext);

            expectErrorResponse(res, 400, 'Invalid email or password');
        });


        it.each([
            { body: { password: 'password123' }, missing: 'email' },
            { body: { email: 'test@example.com' }, missing: 'password' }
        ])('should throw error when missing $missing', async ({ body }) => {
            const req = createRequest(body);
            const res = mockResponse();

            try {
                await signin(req, res, mockNext);
            } catch (error) {
                expect(error).toEqual(new Error('Invalid email or password'));
            }

            expect(res.status).toHaveBeenCalledWith(400);
        });


        it('should generate valid access token on signin', async () => {
            const req = createRequest({
                email: 'test@example.com',
                password: 'password123'
            });
            const res = mockResponse();

            await signin(req, res, mockNext);

            const callArgs = (res.json as jest.Mock).mock.calls[0][0];
            const token = callArgs.data.token;

            expectValidJWT(token, testUser.id);
        });
    });


    describe('refresh', () => {
        let testUser: User;
        let validRefreshToken: string;

        beforeEach(async () => {
            testUser = await createTestUser();
            validRefreshToken = generateRefreshToken(testUser.id);
        });


        it('should generate new access token when valid refresh token provided', async () => {
            const req = createRequest({}, { refreshToken: validRefreshToken });
            const res = mockResponse();

            await refresh(req, res, mockNext);

            expectSuccessResponse(res, null, {
                data: {
                    token: expect.any(String)
                }
            });
        });


        it('should return 401 error when no refresh token provided', async () => {
            const req = createRequest({});
            const res = mockResponse();

            await refresh(req, res, mockNext);

            expectErrorResponse(res, 401, 'No refresh token');
        });


        it('should return 403 error when refresh token is invalid', async () => {
            const req = createRequest({}, { refreshToken: 'invalid.token.here' });
            const res = mockResponse();

            await refresh(req, res, mockNext);

            expectErrorResponse(res, 403, 'Invalid refresh token');
        });


        it('should return 403 error when refresh token is signed with wrong secret', async () => {
            const invalidToken = jwt.sign({ id: testUser.id }, 'wrong-secret', { expiresIn: '7d' });
            
            const req = createRequest({}, { refreshToken: invalidToken });
            const res = mockResponse();

            await refresh(req, res, mockNext);

            expectErrorResponse(res, 403, 'Invalid refresh token');
        });


    });
}); 