import { sequelize, Model, DataTypes } from '../../shared/config/db';

/**
 * Represents a pause period within a driver's shift.
 * 
 * Each pause tracks when a driver temporarily stopped working,
 * storing both the start and end times along with the total duration.
 * Pauses are always associated with a specific shift.
 */
export class Pause extends Model {
    /** Unique identifier for the pause (UUID v4) */
    public id!: string;
    
    /** Reference to the shift this pause belongs to */
    public shift_id!: string;
    
    /** The exact time when this pause started */
    public pause_start!: Date;
    
    /** The exact time when this pause ended */
    public pause_end!: Date;
    
    /** Total duration of the pause in milliseconds */
    public duration_ms!: number;
    
    /** Timestamp when this record was created in the database */
    public created_at!: Date;
    
    /** Timestamp when this record was last updated */
    public updated_at!: Date;
}

/**
 * Initialize the Pause model with its schema definition.
 * 
 * This model uses UUID v4 for primary keys and captures completed pause periods.
 * Pauses are created only after a driver resumes work (when the pause ends),
 * ensuring we have complete duration information.
 */
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

/**
 * Export alias for backward compatibility.
 * Some older code references this model as ShiftPause.
 */
export { Pause as ShiftPause };

export default Pause; 