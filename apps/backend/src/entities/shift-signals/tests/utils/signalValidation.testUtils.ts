import { Signal } from '../../utils/signalValidation';

export class SignalValidationTestUtils {
    private static driverStates: Map<string, Signal | null> = new Map();

    static resetDriverState(driverId: string): void {
        this.driverStates.delete(driverId);
    }

    static setDriverState(driverId: string, state: Signal | null): void {
        if (state === null) {
            this.driverStates.delete(driverId);
        } else {
            this.driverStates.set(driverId, state);
        }
    }

    static getDriverState(driverId: string): Signal | null {
        return this.driverStates.get(driverId) || null;
    }

    static clearAllDriverStates(): void {
        this.driverStates.clear();
    }
}