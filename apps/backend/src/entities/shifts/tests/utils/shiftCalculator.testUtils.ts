export class ShiftCalculatorTestUtils {
    private static pauseData: Map<string, Array<{ start: Date; end: Date }>> = new Map();

    static addPauseData(driverId: string, pauses: Array<{ start: Date; end: Date }>): void {
        this.pauseData.set(driverId, pauses);
    }

    static clearPauseData(driverId?: string): void {
        if (driverId) {
            this.pauseData.delete(driverId);
        } else {
            this.pauseData.clear();
        }
    }

    static getPauseData(driverId: string): Array<{ start: Date; end: Date }> {
        return this.pauseData.get(driverId) || [];
    }
}