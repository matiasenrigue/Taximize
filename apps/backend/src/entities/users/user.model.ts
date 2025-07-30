import { Model, DataTypes } from '../../shared/config/db';
import bcrypt from 'bcrypt';
import { sequelize } from '../../shared/config/db';


export class User extends Model {
    /** Unique identifier for the user (UUID v4) */
    public id!: string;
    
    /** User's email address (must be unique) */
    public email!: string;
    
    /** Display name for the user */
    public username!: string;
    
    /** Hashed password (never stored in plain text) */
    public password!: string;
    
    /** User preferences (theme, language, break warnings) */
    public preferences!: {
        theme?: string;
        language?: string;
        breakWarnings?: boolean;
    };

    /**
     * Instance method to verify passwords.
     * Compares a plain text password with the stored hash.
     * @param entered - Plain text password to verify
     * @returns Promise<boolean> - True if password matches
     */
    public matchPassword!: (entered: string) => Promise<boolean>;
}



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
        preferences: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
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
