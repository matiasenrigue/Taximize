import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../../utils/generateTokens';

// Set up environment variables for testing
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

// Test helper functions
const verifyToken = (token: string, secret: string): any => {
    return jwt.verify(token, secret);
};

const expectValidJWT = (token: string) => {
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
};

const expectTokenToExpireIn = (token: string, secret: string, expectedSeconds: number, tolerance = 5) => {
    const decoded = verifyToken(token, secret);
    const now = Math.floor(Date.now() / 1000);
    const expectedExpiry = now + expectedSeconds;
    
    expect(decoded.exp).toBeGreaterThanOrEqual(expectedExpiry - tolerance);
    expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + tolerance);
};

const expectValidTimestamp = (token: string, secret: string, tolerance = 5) => {
    const decoded = verifyToken(token, secret);
    const now = Math.floor(Date.now() / 1000);
    
    expect(decoded.iat).toBeGreaterThanOrEqual(now - tolerance);
    expect(decoded.iat).toBeLessThanOrEqual(now + tolerance);
};

const expectTokenVerification = (token: string, correctSecret: string, wrongSecrets: string[]) => {
    // Should verify successfully with correct secret
    expect(() => verifyToken(token, correctSecret)).not.toThrow();
    
    // Should fail with wrong secrets
    wrongSecrets.forEach(wrongSecret => {
        expect(() => verifyToken(token, wrongSecret)).toThrow();
    });
};


describe('Token Generators Unit Tests', () => {

    describe('generateAccessToken', () => {
        const testUserId = 'test-user-id-123';


        it('should generate a valid JWT token', () => {
            const token = generateAccessToken(testUserId);
            expectValidJWT(token);
        });


        it('should contain the correct user ID in payload', () => {
            const token = generateAccessToken(testUserId);
            const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET!);
            expect(decoded.id).toBe(testUserId);
        });


        it('should be signed with ACCESS_TOKEN_SECRET', () => {
            const token = generateAccessToken(testUserId);
            expectTokenVerification(
                token,
                process.env.ACCESS_TOKEN_SECRET!,
                ['wrong-secret', process.env.REFRESH_TOKEN_SECRET!]
            );
        });


        it('should expire in approximately 15 minutes', () => {
            const token = generateAccessToken(testUserId);
            expectTokenToExpireIn(token, process.env.ACCESS_TOKEN_SECRET!, 15 * 60);
        });


        it('should have issued at timestamp', () => {
            const token = generateAccessToken(testUserId);
            expectValidTimestamp(token, process.env.ACCESS_TOKEN_SECRET!);
        });


        it.each([
            ['user-1', 'user-2'],
            ['user-3', 'user-4']
        ])('should generate different tokens for different user IDs (%s, %s)', (userId1, userId2) => {
            const token1 = generateAccessToken(userId1);
            const token2 = generateAccessToken(userId2);
            
            expect(token1).not.toBe(token2);
            
            const decoded1 = verifyToken(token1, process.env.ACCESS_TOKEN_SECRET!);
            const decoded2 = verifyToken(token2, process.env.ACCESS_TOKEN_SECRET!);
            
            expect(decoded1.id).toBe(userId1);
            expect(decoded2.id).toBe(userId2);
        });


    });


    describe('generateRefreshToken', () => {
        const testUserId = 'test-user-id-456';


        it('should generate a valid JWT token', () => {
            const token = generateRefreshToken(testUserId);
            expectValidJWT(token);
        });


        it('should contain the correct user ID in payload', () => {
            const token = generateRefreshToken(testUserId);
            const decoded = verifyToken(token, process.env.REFRESH_TOKEN_SECRET!);
            expect(decoded.id).toBe(testUserId);
        });


        it('should be signed with REFRESH_TOKEN_SECRET', () => {
            const token = generateRefreshToken(testUserId);
            expectTokenVerification(
                token,
                process.env.REFRESH_TOKEN_SECRET!,
                ['wrong-secret', process.env.ACCESS_TOKEN_SECRET!]
            );
        });


        it('should expire in approximately 7 days', () => {
            const token = generateRefreshToken(testUserId);
            expectTokenToExpireIn(token, process.env.REFRESH_TOKEN_SECRET!, 7 * 24 * 60 * 60);
        });


        it('should have issued at timestamp', () => {
            const token = generateRefreshToken(testUserId);
            expectValidTimestamp(token, process.env.REFRESH_TOKEN_SECRET!);
        });


        it.each([
            ['user-1', 'user-2'],
            ['user-3', 'user-4']
        ])('should generate different tokens for different user IDs (%s, %s)', (userId1, userId2) => {
            const token1 = generateRefreshToken(userId1);
            const token2 = generateRefreshToken(userId2);
            
            expect(token1).not.toBe(token2);
            
            const decoded1 = verifyToken(token1, process.env.REFRESH_TOKEN_SECRET!);
            const decoded2 = verifyToken(token2, process.env.REFRESH_TOKEN_SECRET!);
            
            expect(decoded1.id).toBe(userId1);
            expect(decoded2.id).toBe(userId2);
        });
    });


    describe('Token Differences', () => {
        const testUserId = 'test-user-comparison';


        it('should generate different tokens between access and refresh for same user', () => {
            const accessToken = generateAccessToken(testUserId);
            const refreshToken = generateRefreshToken(testUserId);
            
            expect(accessToken).not.toBe(refreshToken);
        });


        it('should have different expiry times between access and refresh tokens', () => {
            const accessToken = generateAccessToken(testUserId);
            const refreshToken = generateRefreshToken(testUserId);
            
            const decodedAccess = verifyToken(accessToken, process.env.ACCESS_TOKEN_SECRET!);
            const decodedRefresh = verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET!);
            
            // Refresh token should expire much later than access token
            expect(decodedRefresh.exp).toBeGreaterThan(decodedAccess.exp);
        });


        it('should use different secrets for access and refresh tokens', () => {
            const accessToken = generateAccessToken(testUserId);
            const refreshToken = generateRefreshToken(testUserId);
            
            // Access token should verify with access secret but not refresh secret
            expectTokenVerification(
                accessToken,
                process.env.ACCESS_TOKEN_SECRET!,
                [process.env.REFRESH_TOKEN_SECRET!]
            );
            
            // Refresh token should verify with refresh secret but not access secret
            expectTokenVerification(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET!,
                [process.env.ACCESS_TOKEN_SECRET!]
            );
        });
    });
}); 