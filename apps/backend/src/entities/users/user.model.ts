import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import { sequelize } from '../../shared/config/db';

export class User extends Model {
    public id!: string;
    public email!: string;
    public username!: string;
    public password!: string;

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
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: true,   // so createdAt → created_at in Postgres 
    }
);

User.beforeSave(async (user) => {
    if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        // @ts-ignore
        user.password = await bcrypt.hash(user.password, salt);
    }
});

User.prototype.matchPassword = function (entered: string) {
    // @ts-ignore
    return bcrypt.compare(entered, this.password);
};

export default User;
