import { sequelize, Model, DataTypes } from '../../shared/config/db';

/**
 * Shift signals track state transitions during a driver's shift,
 * including when they start, pause, continue, or stop working.
 * 
 * Each signal is timestamped and linked to a specific shift.
 */
export class ShiftSignal extends Model {

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
    
    public created_at!: Date;    
    public updated_at!: Date;
}


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