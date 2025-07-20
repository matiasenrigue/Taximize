import User from '../../../entities/users/user.model';
import Ride from '../../../entities/rides/ride.model';
import Shift from '../../../entities/shifts/shift.model';
import ShiftSignal from '../../../entities/shifts/shiftSignal.model';
import { generateAccessToken } from '../../../entities/auth/utils/generateTokens';
import { sequelize } from '../../config/db';

interface RideCustomData {
    address?: string;
    distance_km?: number;
    earning_cents?: number;
    predicted_score?: number;
    start_time?: Date;
    end_time?: Date;
}

interface AuthenticatedUser {
    user: User;
    token: string;
    driver: User;
}

export class TestHelpers {
    static setupEnvironment(): void {
        process.env.NODE_ENV = 'test';
        process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
        process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';
    }

    static async createAuthenticatedUser(
        email: string = 'driver@test.com', 
        username: string = 'testdriver'
    ): Promise<AuthenticatedUser> {
        const user = await User.create({
            email,
            username,
            password: 'password123'
        });
        const token = generateAccessToken(user.id);
        return { user, token, driver: user };
    }

    static async createActiveShift(driverId: string): Promise<Shift> {
        return await Shift.create({
            driver_id: driverId,
            shift_start: new Date(),
            shift_end: null,
            shift_start_location_latitude: 53.349805,
            shift_start_location_longitude: -6.260310
        });
    }

    static async createCompletedRide(
        shiftId: string, 
        driverId: string, 
        customData: RideCustomData = {}
    ): Promise<Ride> {
        return await Ride.create({
            shift_id: shiftId,
            driver_id: driverId,
            start_time: customData.start_time || new Date(Date.now() - 3600000), // 1 hour ago
            end_time: customData.end_time || new Date(Date.now() - 1800000), // 30 minutes ago
            start_latitude: 53.349805,
            start_longitude: -6.260310,
            destination_latitude: 53.343792,
            destination_longitude: -6.254572,
            address: customData.address || "Test Completed Ride Address",
            distance_km: customData.distance_km || 5.2,
            earning_cents: customData.earning_cents || 1250,
            predicted_score: customData.predicted_score || 0.75
        });
    }

    static async createActiveRide(
        shiftId: string, 
        driverId: string,
        customData: Partial<RideCustomData> = {}
    ): Promise<Ride> {
        return await Ride.create({
            shift_id: shiftId,
            driver_id: driverId,
            start_time: customData.start_time || new Date(Date.now() - 900000), // 15 minutes ago
            end_time: null,
            start_latitude: 53.349805,
            start_longitude: -6.260310,
            destination_latitude: 53.343792,
            destination_longitude: -6.254572,
            address: customData.address || "Test Active Ride Address",
            distance_km: customData.distance_km || 5.2,
            earning_cents: customData.earning_cents || 1250,
            predicted_score: customData.predicted_score || 0.75
        });
    }

    static async cleanupDatabase(): Promise<void> {
        await Ride.destroy({ where: {}, force: true });
        await ShiftSignal.destroy({ where: {}, force: true });
        await Shift.destroy({ where: {}, force: true });
        await User.destroy({ where: {}, force: true });
    }

    static async setupDatabase(): Promise<void> {
        await sequelize.sync({ force: true });
    }

    static async closeDatabase(): Promise<void> {
        await sequelize.close();
    }
}