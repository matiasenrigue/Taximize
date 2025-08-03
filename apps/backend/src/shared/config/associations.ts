// Initialize all Sequelize associations
export const initializeAssociations = () => {
    
    // Use dynamic imports to avoid circular dependencies
    const { Shift } = require('../../entities/shifts/shift.model');
    const { ShiftSignal } = require('../../entities/shift-signals/shiftSignal.model');
    const { Pause } = require('../../entities/shift-pauses/pause.model');
    const { Ride } = require('../../entities/rides/ride.model');
    const User = require('../../entities/users/user.model').default;
    const Hotspots = require('../../entities/hotspots/hotspots.model').default;

    // Define associations directly here to avoid circular dependencies
    
    // Shift has many signals
    Shift.hasMany(ShiftSignal, { 
        foreignKey: 'shift_id',
        as: 'signals'
    });

    // Shift has many pauses
    Shift.hasMany(Pause, { 
        foreignKey: 'shift_id',
        as: 'pauses'
    });

    // Shift belongs to user (driver)
    Shift.belongsTo(User, { 
        foreignKey: 'driver_id',
        as: 'driver'
    });

    // ShiftSignal belongs to shift
    ShiftSignal.belongsTo(Shift, { 
        foreignKey: 'shift_id',
        as: 'shift'
    });

    // Pause belongs to shift
    Pause.belongsTo(Shift, { 
        foreignKey: 'shift_id',
        as: 'shift'
    });

    // Shift has many rides
    Shift.hasMany(Ride, { 
        foreignKey: 'shift_id',
        as: 'rides'
    });

    // Ride belongs to shift
    Ride.belongsTo(Shift, { 
        foreignKey: 'shift_id',
        as: 'shift'
    });

    // Ride belongs to user (driver)
    Ride.belongsTo(User, { 
        foreignKey: 'driver_id',
        as: 'driver'
    });

    // User has many rides
    User.hasMany(Ride, { 
        foreignKey: 'driver_id',
        as: 'rides'
    });

    // User has many shifts
    User.hasMany(Shift, { 
        foreignKey: 'driver_id',
        as: 'shifts'
    });
    
    console.log('✅ Model associations initialized');
};