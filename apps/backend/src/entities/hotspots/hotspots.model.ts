import { sequelize, Model, DataTypes } from '../../shared/config/db';

export class Hotspots extends Model {
    public id!: string;
    public data!: any; 
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}


Hotspots.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        data: {
            type: DataTypes.JSONB,
            allowNull: false,
        }
    },
    {
        sequelize,
        modelName: 'hotspots',
        tableName: 'hotspots',
        timestamps: true,
        underscored: true
        // No need for soft deletes as its cached data
    }
);

export default Hotspots;