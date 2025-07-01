// Placeholder file for TDD Red phase - full implementation in Green phase
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../../shared/config/db';

export class ShiftSignal extends Model {
  public id!: string;
  public timestamp!: Date;
  public shift_id!: string;
  public signal!: 'start' | 'stop' | 'pause' | 'continue';
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
  },
  {
    sequelize,
    tableName: 'shift_signals',
    timestamps: true,
    underscored: true,
  }
);

export default ShiftSignal; 