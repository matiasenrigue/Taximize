import { sequelize, Model, DataTypes } from '../../shared/config/db';
import { RIDE_CONSTANTS } from './ride.constants';

export class Ride extends Model {
    // Identity
    public id!: string;
    public shift_id!: string;
    public driver_id!: string;
    
    // Location data
    public start_latitude!: number;
    public start_longitude!: number;
    public destination_latitude!: number;
    public destination_longitude!: number;
    public address!: string;
    
    // Time data
    public start_time!: Date;
    public end_time!: Date | null;
    
    // Scoring
    public predicted_score!: number;
    
    // Metrics (populated on ride end)
    public earning_cents!: number | null;
    public earning_per_min!: number | null;
    public distance_km!: number | null;
    
    // Timestamps
    public created_at!: Date;
    public updated_at!: Date;
    public deleted_at!: Date | null;
    
    // Instance methods
    public restore!: () => Promise<void>;
    
    // Custom instance methods
    public isActive(): boolean {
        return this.end_time === null;
    }
    
    public getDurationMs(): number | null {
        if (!this.end_time) return null;
        return this.end_time.getTime() - this.start_time.getTime();
    }

}

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
            allowNull: false,
            defaultValue: 3,
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