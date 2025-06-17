// Placeholder file for TDD Red phase - full implementation in Green phase
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/db';

export class Ride extends Model {
  public id!: string;
  public shift_id!: string;
  public driver_id!: string;
  public start_latitude!: number;
  public start_longitude!: number;
  public destination_latitude!: number;
  public destination_longitude!: number;
  public start_time!: Date;
  public predicted_score!: number;
  public end_time!: Date | null;
  public earning_cents!: number | null;
  public earning_per_min!: number | null;
  public distance_km!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
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