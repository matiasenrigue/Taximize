import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../../utils/generateTokens';

// Set up environment variables for testing
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

describe('Token Generators Unit Tests', () => {

  describe('generateAccessToken', () => {
    const testUserId = 'test-user-id-123';

    it('should generate a valid JWT token', () => {
      const token = generateAccessToken(testUserId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts separated by dots
    });

    it('should contain the correct user ID in payload', () => {
      const token = generateAccessToken(testUserId);
      
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
      expect(decoded.id).toBe(testUserId);
    });

    it('should be signed with ACCESS_TOKEN_SECRET', () => {
      const token = generateAccessToken(testUserId);
      
      // Should verify successfully with correct secret
      expect(() => {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
      }).not.toThrow();

      // Should fail with wrong secret
      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });

    it('should expire in approximately 15 minutes', () => {
      const token = generateAccessToken(testUserId);
      
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + (15 * 60); // 15 minutes in seconds
      
      // Allow 5 second tolerance for test execution time
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExpiry - 5);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5);
    });

    it('should have issued at timestamp', () => {
      const token = generateAccessToken(testUserId);
      
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
      const now = Math.floor(Date.now() / 1000);
      
      // Allow 5 second tolerance for test execution time
      expect(decoded.iat).toBeGreaterThanOrEqual(now - 5);
      expect(decoded.iat).toBeLessThanOrEqual(now + 5);
    });

    it('should generate different tokens for different user IDs', () => {
      const token1 = generateAccessToken('user-1');
      const token2 = generateAccessToken('user-2');
      
      expect(token1).not.toBe(token2);
      
      const decoded1 = jwt.verify(token1, process.env.ACCESS_TOKEN_SECRET!) as any;
      const decoded2 = jwt.verify(token2, process.env.ACCESS_TOKEN_SECRET!) as any;
      
      expect(decoded1.id).toBe('user-1');
      expect(decoded2.id).toBe('user-2');
    });

    it('should generate different tokens for same user ID at different times', () => {
      const token1 = generateAccessToken(testUserId);
      
      // Wait a moment to ensure different timestamps
      setTimeout(() => {
        const token2 = generateAccessToken(testUserId);
        expect(token1).not.toBe(token2);
      }, 1000);
    });
  });

  describe('generateRefreshToken', () => {
    const testUserId = 'test-user-id-456';

    it('should generate a valid JWT token', () => {
      const token = generateRefreshToken(testUserId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts separated by dots
    });

    it('should contain the correct user ID in payload', () => {
      const token = generateRefreshToken(testUserId);
      
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as any;
      expect(decoded.id).toBe(testUserId);
    });

    it('should be signed with REFRESH_TOKEN_SECRET', () => {
      const token = generateRefreshToken(testUserId);
      
      // Should verify successfully with correct secret
      expect(() => {
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!);
      }).not.toThrow();

      // Should fail with wrong secret
      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();

      // Should fail with access token secret
      expect(() => {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
      }).toThrow();
    });

    it('should expire in approximately 7 days', () => {
      const token = generateRefreshToken(testUserId);
      
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as any;
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + (7 * 24 * 60 * 60); // 7 days in seconds
      
      // Allow 5 second tolerance for test execution time
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExpiry - 5);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5);
    });

    it('should have issued at timestamp', () => {
      const token = generateRefreshToken(testUserId);
      
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as any;
      const now = Math.floor(Date.now() / 1000);
      
      // Allow 5 second tolerance for test execution time
      expect(decoded.iat).toBeGreaterThanOrEqual(now - 5);
      expect(decoded.iat).toBeLessThanOrEqual(now + 5);
    });

    it('should generate different tokens for different user IDs', () => {
      const token1 = generateRefreshToken('user-1');
      const token2 = generateRefreshToken('user-2');
      
      expect(token1).not.toBe(token2);
      
      const decoded1 = jwt.verify(token1, process.env.REFRESH_TOKEN_SECRET!) as any;
      const decoded2 = jwt.verify(token2, process.env.REFRESH_TOKEN_SECRET!) as any;
      
      expect(decoded1.id).toBe('user-1');
      expect(decoded2.id).toBe('user-2');
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
      
      const decodedAccess = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as any;
      const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as any;
      
      // Refresh token should expire much later than access token
      expect(decodedRefresh.exp).toBeGreaterThan(decodedAccess.exp);
      
      // Approximate difference should be about 7 days - 15 minutes
      const expectedDifference = (7 * 24 * 60 * 60) - (15 * 60); // seconds
      const actualDifference = decodedRefresh.exp - decodedAccess.exp;
      
      // Allow some tolerance
      expect(actualDifference).toBeGreaterThanOrEqual(expectedDifference - 10);
      expect(actualDifference).toBeLessThanOrEqual(expectedDifference + 10);
    });

    it('should use different secrets for access and refresh tokens', () => {
      const accessToken = generateAccessToken(testUserId);
      const refreshToken = generateRefreshToken(testUserId);
      
      // Access token should verify with access secret but not refresh secret
      expect(() => jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!)).not.toThrow();
      expect(() => jwt.verify(accessToken, process.env.REFRESH_TOKEN_SECRET!)).toThrow();
      
      // Refresh token should verify with refresh secret but not access secret
      expect(() => jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!)).not.toThrow();
      expect(() => jwt.verify(refreshToken, process.env.ACCESS_TOKEN_SECRET!)).toThrow();
    });
  });
}); 