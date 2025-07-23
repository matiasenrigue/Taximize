import { sequelize, Model, DataTypes } from '../../shared/config/db';

/**
 * Represents a shift signal event in the system.
 * 
 * Shift signals track state transitions during a driver's shift,
 * including when they start, pause, continue, or stop working.
 * Each signal is timestamped and linked to a specific shift.
 */
export class ShiftSignal extends Model {
    /** Unique identifier for the shift signal (UUID v4) */
    public id!: string;
    
    /** The exact time when this signal was created */
    public timestamp!: Date;
    
    /** Reference to the shift this signal belongs to */
    public shift_id!: string;
    
    /** The type of signal indicating the shift state change */
    public signal!: 'start' | 'stop' | 'pause' | 'continue';
    
    /** 
     * Optional planned duration in milliseconds.
     * Used for 'pause' signals to indicate planned pause duration.
     */
    public planned_duration_ms!: number | null;
    
    /** Timestamp when this record was created in the database */
    public created_at!: Date;
    
    /** Timestamp when this record was last updated */
    public updated_at!: Date;
}

/**
 * Initialize the ShiftSignal model with its schema definition.
 * 
 * This model uses UUID v4 for primary keys and tracks all shift state
 * transitions with timestamps. The signal enum ensures only valid
 * state transitions are recorded.
 */
ShiftSignal.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        shift_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        signal: {
            type: DataTypes.ENUM('start', 'stop', 'pause', 'continue'),
            allowNull: false,
        },
        planned_duration_ms: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'shift_signals',
        timestamps: true,
        underscored: true,
    }
);

export default ShiftSignal; 