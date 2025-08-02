import { sequelize, Model, DataTypes } from '../../shared/config/db';

/**
 * Represents a pause period within a driver's shift.
 */
export class Pause extends Model {

    public id!: string;
    
    public shift_id!: string;
    
    public pause_start!: Date;    
    public pause_end!: Date;
    
    public duration_ms!: number;
    
    public created_at!: Date;    
    public updated_at!: Date;
}



Pause.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        shift_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        pause_start: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        pause_end: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        duration_ms: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'shift_pauses',
        timestamps: true,
        underscored: true,
    }
);



export default Pause; 