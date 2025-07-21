// Placeholder file for TDD Red phase - full implementation in Green phase
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../shared/config/db';

export class Shift extends Model {
    public id!: string;
    public driver_id!: string;
    public shift_start!: Date;
    public shift_end!: Date | null;
    public shift_start_location_latitude!: number | null;
    public shift_start_location_longitude!: number | null;
    public shift_end_location_latitude!: number | null;
    public shift_end_location_longitude!: number | null;
    public total_duration_ms!: number | null;
    public planned_duration_ms!: number | null;

    // From Pause Data
    public work_time_ms!: number | null;
    public break_time_ms!: number | null;
    public num_breaks!: number | null;
    public avg_break_ms!: number | null;

    // From Ride Data
    public total_earnings_cents!: number | null;
    public total_distance_km!: number | null;
    public number_of_rides!: number | null;

    public created_at!: Date;
    public updated_at!: Date;
    public deleted_at!: Date | null;

    // Paranoid model methods
    public restore!: () => Promise<void>;
}

Shift.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        driver_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        shift_start: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        shift_end: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        total_duration_ms: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        work_time_ms: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        break_time_ms: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        num_breaks: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        avg_break_ms: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        planned_duration_ms: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        shift_start_location_latitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        shift_start_location_longitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        shift_end_location_latitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        shift_end_location_longitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        total_earnings_cents: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        total_distance_km: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        number_of_rides: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'shifts',
        timestamps: true,
        underscored: true,
        paranoid: true,
        indexes: [
            {
                name: 'one_active_shift_per_driver',
                unique: true,
                fields: ['driver_id'],
                where: {
                    shift_end: null
                }
            }
        ]
    }
);

export default Shift; 