// Placeholder file for TDD Red phase - full implementation in Green phase
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../shared/config/db';

export class Shift extends Model {
  public id!: string;
  public driver_id!: string;
  public shift_start!: Date;
  public shift_end!: Date | null;
  public total_duration_ms!: number | null;
  public work_time_ms!: number | null;
  public break_time_ms!: number | null;
  public num_breaks!: number | null;
  public avg_break_ms!: number | null;
  public created_at!: Date;
  public updated_at!: Date;
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
  },
  {
    sequelize,
    tableName: 'shifts',
    timestamps: true,
    underscored: true
  }
);

export default Shift; 