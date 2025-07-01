// Placeholder file for TDD Red phase - full implementation in Green phase
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../shared/config/db';

export class ShiftPause extends Model {
  public id!: string;
  public shift_id!: string;
  public pause_start!: Date;
  public pause_end!: Date;
  public duration_ms!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

ShiftPause.init(
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

export default ShiftPause; 