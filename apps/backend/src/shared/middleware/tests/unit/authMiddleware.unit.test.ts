import { Request, Response, NextFunction } from 'express';
import { protect } from '../../auth.middleware';
import { sequelize } from '../../../config/db';
import User from '../../../../entities/users/user.model';
import { generateAccessToken } from '../../../../entities/auth/utils/generateTokens';
import jwt from 'jsonwebtoken';

// Set up environment variables for testing
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

// Mock response object
const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// Mock next function
const mockNext = jest.fn() as NextFunction;

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

describe('Auth Middleware Unit Tests', () => {

    describe('protect middleware', () => {
        let testUser: User;
        let validToken: string;

        beforeEach(async () => {
            testUser = await User.create({
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123'
            });
            validToken = generateAccessToken(testUser.id);
        });

        it('should call next() and attach user to req when valid token provided', async () => {
            const req = {
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            } as Request;
            const res = mockResponse();

            await protect(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            expect(req.user).toBeDefined();
            expect(req.user?.id).toBe(testUser.id);
            expect(req.user?.email).toBe(testUser.email);
            expect(req.user?.username).toBe(testUser.username);
        });

        it('should call next with error when no Authorization header', async () => {
            const req = {
                headers: {}
            } as Request;
            const res = mockResponse();

            await protect(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Not authorized, no token'
                })
            );
        });

        it('should call next with error when Authorization header does not start with Bearer', async () => {
            const req = {
                headers: {
                    authorization: `Token ${validToken}`
                }
            } as Request;
            const res = mockResponse();

            await protect(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Not authorized, no token'
                })
            );
        });

        it('should call next with error when Authorization header is malformed', async () => {
            const req = {
                headers: {
                    authorization: 'Bearer'
                }
            } as Request;
            const res = mockResponse();

            await protect(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Not authorized, no token'
                })
            );
        });

        it('should call next with error when token is invalid', async () => {
            const req = {
                headers: {
                    authorization: 'Bearer invalid.token.here'
                }
            } as Request;
            const res = mockResponse();

            await protect(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Not authorized, token failed'
                })
            );
        });

        it('should call next with error when token is signed with wrong secret', async () => {
            const invalidToken = jwt.sign({ id: testUser.id }, 'wrong-secret', { expiresIn: '15m' });
            
            const req = {
                headers: {
                    authorization: `Bearer ${invalidToken}`
                }
            } as Request;
            const res = mockResponse();

            await protect(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Not authorized, token failed'
                })
            );
        });

        it('should call next with error when token is expired', async () => {
            const expiredToken = jwt.sign(
                { id: testUser.id },
                process.env.ACCESS_TOKEN_SECRET!,
                { expiresIn: '-1s' } // Expired 1 second ago
            );
            
            const req = {
                headers: {
                    authorization: `Bearer ${expiredToken}`
                }
            } as Request;
            const res = mockResponse();

            await protect(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Not authorized, token failed'
                })
            );
        });

        it('should call next with error when user ID in token does not exist in database', async () => {
            const nonExistentUserId = 'non-existent-user-id';
            const tokenWithInvalidUserId = generateAccessToken(nonExistentUserId);
            
            const req = {
                headers: {
                    authorization: `Bearer ${tokenWithInvalidUserId}`
                }
            } as Request;
            const res = mockResponse();

            await protect(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Not authorized, token failed'
                })
            );
        });

        it('should call next with error when token has missing id field', async () => {
            const tokenWithoutId = jwt.sign(
                { username: 'testuser' }, // Missing id field
                process.env.ACCESS_TOKEN_SECRET!,
                { expiresIn: '15m' }
            );
            
            const req = {
                headers: {
                    authorization: `Bearer ${tokenWithoutId}`
                }
            } as Request;
            const res = mockResponse();

            await protect(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Not authorized, token failed'
                })
            );
        });

        it('should work with different valid token formats', async () => {
            // Test the actual expected format
            const req = {
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            } as Request;
            const res = mockResponse();

            await protect(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
            expect(req.user?.id).toBe(testUser.id);
        });

        it('should call next with error for case-sensitive Bearer keyword', async () => {
            const req = {
                headers: {
                    authorization: `bearer ${validToken}` // lowercase
                }
            } as Request;
            const res = mockResponse();

            await protect(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Not authorized, no token'
                })
            );
        });

        it('should overwrite existing user when valid token provided', async () => {
            const existingUser = { id: 'existing-id', email: 'existing@test.com' };
            const req = {
                headers: {
                    authorization: `Bearer ${validToken}`
                },
                user: existingUser
            } as any;
            const res = mockResponse();

            await protect(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            // Should overwrite the existing user
            expect(req.user.id).toBe(testUser.id);
            expect(req.user.id).not.toBe(existingUser.id);
        });

        it('should work correctly after user data is updated', async () => {
            // Update user data
            await testUser.update({ username: 'updateduser' });
            
            const req = {
                headers: {
                    authorization: `Bearer ${validToken}`
                }
            } as Request;
            const res = mockResponse();

            await protect(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            expect(req.user?.username).toBe('updateduser'); // Should reflect updated data
        });
    });
}); 