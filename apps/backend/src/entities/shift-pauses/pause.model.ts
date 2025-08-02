import { sequelize, Model, DataTypes } from '../../shared/config/db';

/**
 * Represents a pause period within a driver's shift.
 * 
 * Each pause tracks when a driver temporarily stopped working,
 * Pauses are always associated with a specific shift.
 */
export class Pause extends Model {

    public id!: string;
    
    /** Reference to the shift this pause belongs to */
    public shift_id!: string;
    
    /** The exact time when this pause started */
    public pause_start!: Date;
    
    /** The exact time when this pause ended */
    public pause_end!: Date;
    
    /** Total duration of the pause in milliseconds */
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