import { sequelize } from '../../../../shared/config/db';
import User from '../../user.model';

// Set up test database before running tests
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

describe('User Model Unit Tests', () => {

  describe('Password Hashing Hook', () => {
    it('should hash password when creating a new user', async () => {
      const plainPassword = 'password123';
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: plainPassword
      });

      // Password should be hashed, not plain text
      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
      expect(user.password.length).toBeGreaterThan(50); // bcrypt hashes are long
    });

    it('should not re-hash password when updating user without changing password', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      const originalHashedPassword = user.password;

      // Update user without changing password
      await user.update({ username: 'updateduser' });
      await user.reload();

      // Password hash should remain unchanged
      expect(user.password).toBe(originalHashedPassword);
    });

    it('should re-hash password when updating user with new password', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      const originalHashedPassword = user.password;

      // Update user with new password
      await user.update({ password: 'newpassword456' });
      await user.reload();

      // Password should be re-hashed
      expect(user.password).not.toBe(originalHashedPassword);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
      expect(user.password.length).toBeGreaterThan(50);
    });

    it('should hash password even when other fields are updated simultaneously', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      const originalHashedPassword = user.password;

      // Update both username and password
      await user.update({ 
        username: 'updateduser',
        password: 'newpassword456' 
      });
      await user.reload();

      // Password should be re-hashed
      expect(user.password).not.toBe(originalHashedPassword);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/);
      expect(user.username).toBe('updateduser');
    });
  });

  describe('matchPassword Method', () => {
    let user: User;

    beforeEach(async () => {
      user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
    });

    it('should return true when given the correct plain password', async () => {
      const isMatch = await user.matchPassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should return false when given an incorrect password', async () => {
      const isMatch = await user.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    it('should return false when given empty string', async () => {
      const isMatch = await user.matchPassword('');
      expect(isMatch).toBe(false);
    });

    it('should handle null/undefined gracefully', async () => {
      // bcrypt.compare throws error with null/undefined, so we expect the test to throw
      await expect(user.matchPassword(null as any)).rejects.toThrow();
      await expect(user.matchPassword(undefined as any)).rejects.toThrow();
    });

    it('should work correctly after password update', async () => {
      // First verify original password works
      expect(await user.matchPassword('password123')).toBe(true);

      // Update password
      await user.update({ password: 'newpassword456' });
      await user.reload();

      // Old password should not work
      expect(await user.matchPassword('password123')).toBe(false);
      
      // New password should work
      expect(await user.matchPassword('newpassword456')).toBe(true);
    });

    it('should handle special characters in passwords', async () => {
      const specialPassword = 'P@ssw0rd!#$%^&*()';
      
      const userWithSpecialPassword = await User.create({
        email: 'special@example.com',
        username: 'specialuser',
        password: specialPassword
      });

      expect(await userWithSpecialPassword.matchPassword(specialPassword)).toBe(true);
      expect(await userWithSpecialPassword.matchPassword('P@ssw0rd!#$%^&*()')).toBe(true);
      expect(await userWithSpecialPassword.matchPassword('P@ssw0rd!#$%^&*')).toBe(false);
    });

    it('should be case sensitive', async () => {
      expect(await user.matchPassword('Password123')).toBe(false);
      expect(await user.matchPassword('PASSWORD123')).toBe(false);
      expect(await user.matchPassword('password123')).toBe(true);
    });
  });

  describe('User Model Validation', () => {
    it('should require email field', async () => {
      await expect(User.create({
        username: 'testuser',
        password: 'password123'
        // Missing email
      } as any)).rejects.toThrow();
    });

    it('should require username field', async () => {
      await expect(User.create({
        email: 'test@example.com',
        password: 'password123'
        // Missing username
      } as any)).rejects.toThrow();
    });

    it('should require password field', async () => {
      await expect(User.create({
        email: 'test@example.com',
        username: 'testuser'
        // Missing password
      } as any)).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      await User.create({
        email: 'test@example.com',
        username: 'user1',
        password: 'password123'
      });

      await expect(User.create({
        email: 'test@example.com',
        username: 'user2',
        password: 'password456'
      })).rejects.toThrow();
    });

    it('should validate email format', async () => {
      await expect(User.create({
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123'
      })).rejects.toThrow();

      await expect(User.create({
        email: 'test@',
        username: 'testuser',
        password: 'password123'
      })).rejects.toThrow();
    });

    it('should enforce minimum password length', async () => {
      await expect(User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'short'
      })).rejects.toThrow();
    });

    it('should allow valid user creation', async () => {
      const user = await User.create({
        email: 'valid@example.com',
        username: 'validuser',
        password: 'validpassword123'
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('valid@example.com');
      expect(user.username).toBe('validuser');
      expect(user.password).not.toBe('validpassword123'); // Should be hashed
    });
  });
}); 