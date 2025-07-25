import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('users', 'preferences', {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('users', 'preferences');
  }
};