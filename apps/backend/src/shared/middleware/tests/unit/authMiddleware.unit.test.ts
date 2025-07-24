import { Request, Response, NextFunction } from 'express';
import { protect } from '../../auth.middleware';
import { sequelize } from '../../../config/db';
import User from '../../../../entities/users/user.model';
import { generateAccessToken } from '../../../../entities/auth/utils/generateTokens';
import jwt from 'jsonwebtoken';

process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn() as NextFunction;

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


describe('Auth Middleware', () => {
    let user: User;
    let token: string;

    beforeEach(async () => {
        // basic test user
        user = await User.create({
            email: 'john@test.com',
            username: 'johndoe',
            password: 'Test123!'
        });
        token = generateAccessToken(user.id);
    });


    it('attaches user to request with valid token', async () => {
        const req = {
            headers: {
                authorization: `Bearer ${token}`
            }
        } as Request;
        const res = mockResponse();

        await protect(req, res, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(req.user?.id).toBe(user.id); // should have the user
    });
    

    it('fails without auth header', async () => {
        const req = {
            headers: {}
        } as Request;
        const res = mockResponse();

        await protect(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockNext).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Not authorized, no token'
            })
        );
    });


    it('rejects non-Bearer tokens', async () => {
        const req = {
            headers: {
                authorization: `Token ${token}`
            }
        } as Request;
        const res = mockResponse();

        await protect(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
    });


    it('handles invalid JWT format', async () => {
        const req = {
            headers: {
                authorization: 'Bearer notarealjwt'
            }
        } as Request;
        const res = mockResponse();

        await protect(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('blocks expired tokens', async () => {
        // Generate already expired token
        const expiredToken = jwt.sign(
            { id: user.id },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: '-10s' }
        );
        
        const req = {
            headers: {
                authorization: `Bearer ${expiredToken}`
            }
        } as Request;
        const res = mockResponse();

        await protect(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
    });


    it('bearer is case sensitive', async () => {
        // lowercase bearer shouldn't work
        const req = {
            headers: {
                authorization: `bearer ${token}`
            }
        } as Request;
        const res = mockResponse();

        await protect(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401); // should fail
    });


    it('handles updated user data', async () => {
        await user.update({ username: 'newname' });
        
        const req = {
            headers: {
                authorization: `Bearer ${token}`
            }
        } as Request;
        const res = mockResponse();

        await protect(req, res, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(req.user?.username).toBe('newname'); // gets fresh data
    });


    it('overwrites any existing req.user', async () => {
        const fakeUser = { id: 'fake-123', email: 'fake@test.com' };
        const req = {
            headers: {
                authorization: `Bearer ${token}`
            },
            user: fakeUser  // somehow already has a user
        } as any;
        const res = mockResponse();

        await protect(req, res, mockNext);

        expect(req.user.id).toBe(user.id); // real user wins
        expect(req.user.id).not.toBe(fakeUser.id);
    });

}); 