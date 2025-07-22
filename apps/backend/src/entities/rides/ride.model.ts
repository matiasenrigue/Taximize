import { sequelize, Model, DataTypes } from '../../shared/config/db';
import { RIDE_CONSTANTS } from './ride.constants';

/**
 * Represents a ride in the system.
 * 
 * A ride tracks when a driver picks up and transports a passenger,
 * including location data, timing, earnings, and predicted scoring.
 * Each ride is associated with a specific shift and driver.
 */
export class Ride extends Model {
    /** Unique identifier for the ride (UUID v4) */
    public id!: string;
    
    /** Reference to the shift this ride belongs to */
    public shift_id!: string;
    
    /** Reference to the driver performing this ride */
    public driver_id!: string;
    
    /** Starting latitude coordinate for the ride */
    public start_latitude!: number;
    
    /** Starting longitude coordinate for the ride */
    public start_longitude!: number;
    
    /** Destination latitude coordinate */
    public destination_latitude!: number;
    
    /** Destination longitude coordinate */
    public destination_longitude!: number;
    
    /** Human-readable address for the destination */
    public address!: string;
    
    /** The exact time when this ride started */
    public start_time!: Date;
    
    /** The exact time when this ride ended (null if still active) */
    public end_time!: Date | null;
    
    /** ML-predicted score for this ride (1-5 scale, null if ML service unavailable) */
    public predicted_score!: number | null;
    
    /** Total earnings for this ride in cents (populated on completion) */
    public earning_cents!: number | null;
    
    /** Earnings rate per minute in cents (populated on completion) */
    public earning_per_min!: number | null;
    
    /** Total distance traveled in kilometers (populated on completion) */
    public distance_km!: number | null;
    
    /** Timestamp when this record was created in the database */
    public created_at!: Date;
    
    /** Timestamp when this record was last updated */
    public updated_at!: Date;
    
    /** Soft delete timestamp (null if not deleted) */
    public deleted_at!: Date | null;
    
    /** Method to restore a soft-deleted ride */
    public restore!: () => Promise<void>;
    
    /**
     * Checks if the ride is currently active.
     * @returns True if the ride has not ended yet
     */
    public isActive(): boolean {
        return this.end_time === null;
    }
    
    /**
     * Calculates the duration of a completed ride.
     * @returns Duration in milliseconds, or null if ride is still active
     */
    public getDurationMs(): number | null {
        if (!this.end_time) return null;
        return this.end_time.getTime() - this.start_time.getTime();
    }

}

/**
 * Initialize the Ride model with its schema definition.
 * 
 * This model uses UUID v4 for primary keys and includes soft delete
 * functionality (paranoid mode). It enforces a unique constraint to
 * ensure only one active ride per shift at any time.
 */
Ride.init(
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
        driver_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        start_latitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        start_longitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        destination_latitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        destination_longitude: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        predicted_score: {
            type: DataTypes.SMALLINT,
            allowNull: true,
            defaultValue: null,
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        earning_cents: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        earning_per_min: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        distance_km: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'rides',
        timestamps: true,
        underscored: true,
        paranoid: true,
        indexes: [
            {
                name: 'one_active_ride_per_shift',
                unique: true,
                fields: ['shift_id'],
                where: {
                    end_time: null
                }
            }
        ]
    }
);

export default Ride; 