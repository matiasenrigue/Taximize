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


describe('User Model', () => {

    describe('Password Hashing', () => {
        it('hashes the password on create', async () => {
            const plainPassword = 'password123';
            const user = await User.create({
                email: 'test@example.com',
                username: 'testuser',
                password: plainPassword
            });

            expect(user.password).not.toBe(plainPassword); // should not store plain text
            expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt pattern
        });


        it('should not re-hash when updating other fields', async () => {
            const user = await User.create({
                email: 'john@test.com',
                username: 'johndoe',
                password: 'secret123'
            });

            const originalHash = user.password; // save the hash

            // just changing username
            await user.update({ username: 'johndoe2' });
            await user.reload();

            expect(user.password).toBe(originalHash); // hash shouldn't change
        });


        it('rehashes when password changes', async () => {
            const user = await User.create({
                email: 'test@example.com',
                username: 'testuser',
                password: 'oldpass123'
            });

            const oldHash = user.password;

            await user.update({ password: 'newpass123' });
            
            expect(user.password).not.toEqual(oldHash); // should get new hash
            // should still be bcrypt
            expect(user.password.startsWith('$2')).toBeTruthy(); // bcrypt starts with $2
        });
    });


    describe('matchPassword', () => {
        let testUser: User;

        beforeEach(async () => {
            testUser = await User.create({
                email: 'match@test.com',
                username: 'matcher',
                password: 'myPassword123'
            });
        });


        it('returns true for correct password', async () => {
            const result = await testUser.matchPassword('myPassword123');
            expect(result).toBe(true);
        });


        it('returns false for wrong password', async () => {
            expect(await testUser.matchPassword('wrong')).toBe(false);
            expect(await testUser.matchPassword('mypassword123')).toBe(false);
        });


        it('handles empty string', async () => {
            const isEmpty = await testUser.matchPassword('');
            expect(isEmpty).toBe(false);
        });


        it('should work after password update', async () => {
            await testUser.update({ password: 'brandNewPass!' });
            
            expect(await testUser.matchPassword('myPassword123')).toBe(false); // old password should fail
            expect(await testUser.matchPassword('brandNewPass!')).toBe(true);  // new password should pass
        });

    });


    describe('validation', () => {
        it('needs all required fields', async () => {
            // missing email
            await expect(User.create({
                username: 'bob',
                password: 'password123'
            } as any)).rejects.toThrow();

            try {
                await User.create({
                    email: 'test@test.com',
                    password: 'password123'
                } as any);
                fail('should have thrown'); // shouldn't get here
            } catch (e) {
                expect(e).toBeDefined();
            }
        });


        it('enforces unique emails', async () => {
            const email = 'duplicate@example.com';
            
            await User.create({
                email,
                username: 'first',
                password: 'password123'
            });

            await expect(User.create({
                email, // same email!
                username: 'second',
                password: 'differentpass'
            })).rejects.toThrow();
        });


        it('validates email format', async () => {
            const badEmails = ['notanemail', 'test@', '@test.com'];
            
            for (const badEmail of badEmails) {
                await expect(User.create({
                    email: badEmail,
                    username: 'testuser',
                    password: 'password123'
                })).rejects.toThrow();
            }
        });

        
        it('creates user with valid data', async () => {
            const userData = {
                email: 'newuser@example.com',
                username: 'newuser',
                password: 'validPass123'
            };

            const user = await User.create(userData);

            expect(user.id).toBeDefined(); // got an id
            expect(user.email).toEqual(userData.email); // email saved correctly
            // password should be hashed
            expect(user.password).not.toBe(userData.password); // not storing plain text!
        });

        });

});