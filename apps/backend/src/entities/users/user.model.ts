import { Model, DataTypes } from '../../shared/config/db';
import bcrypt from 'bcrypt';
import { sequelize } from '../../shared/config/db';

/**
 * Represents a user in the system.
 * 
 * Users are the primary authentication entity, storing credentials
 * and basic profile information. Passwords are automatically hashed
 * before storage for security.
 */
export class User extends Model {
    /** Unique identifier for the user (UUID v4) */
    public id!: string;
    
    /** User's email address (must be unique) */
    public email!: string;
    
    /** Display name for the user */
    public username!: string;
    
    /** Hashed password (never stored in plain text) */
    public password!: string;

    /**
     * Instance method to verify passwords.
     * Compares a plain text password with the stored hash.
     * @param entered - Plain text password to verify
     * @returns Promise<boolean> - True if password matches
     */
    public matchPassword!: (entered: string) => Promise<boolean>;
}

/**
 * Initialize the User model with its schema definition.
 * 
 * This model uses UUID v4 for primary keys and includes
 * email validation and password length requirements.
 * Timestamps are automatically managed by Sequelize.
 */
User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true },
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { len: [8, 100] }
        },
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: true,   // so createdAt → created_at in Postgres 
    }
);

/**
 * Hook that runs before saving a user.
 * Automatically hashes the password if it has been changed,
 * ensuring passwords are never stored in plain text.
 */
User.beforeSave(async (user) => {
    if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        // @ts-ignore
        user.password = await bcrypt.hash(user.password, salt);
    }
});

/**
 * Adds password verification method to User instances.
 * Uses bcrypt to securely compare entered password with stored hash.
 */
User.prototype.matchPassword = function (entered: string) {
    // @ts-ignore
    return bcrypt.compare(entered, this.password);
};

export default User;
