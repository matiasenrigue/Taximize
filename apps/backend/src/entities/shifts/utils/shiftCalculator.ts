interface BreakStatistics {
    totalBreakTimeMs: number;
    numberOfBreaks: number;
    averageBreakDurationMs: number;
}

export class ShiftCalculator {
    // Mock pause data for testing - in real implementation this would come from database
    private static pauseData: Map<string, Array<{ start: Date; end: Date }>> = new Map();

    static computeBreaks(shiftStart: Date, shiftEnd: Date, driverId: string): BreakStatistics {
        // Get pause periods for this driver during the shift
        const pauses = this.pauseData.get(driverId) || [];
        
        // Filter pauses that fall within the shift timeframe
        const shiftsTimezonePauses = pauses.filter(pause => 
            pause.start >= shiftStart && pause.end <= shiftEnd
        );

        if (shiftsTimezonePauses.length === 0) {
            return {
                totalBreakTimeMs: 0,
                numberOfBreaks: 0,
                averageBreakDurationMs: 0
            };
        }

        // Calculate total break time
        const totalBreakTimeMs = shiftsTimezonePauses.reduce((total, pause) => {
            return total + (pause.end.getTime() - pause.start.getTime());
        }, 0);

        const numberOfBreaks = shiftsTimezonePauses.length;
        const averageBreakDurationMs = totalBreakTimeMs / numberOfBreaks;

        return {
            totalBreakTimeMs,
            numberOfBreaks,
            averageBreakDurationMs
        };
    }

    static computeWorkTime(totalDurationMs: number, breakTimeMs: number): number {
        return totalDurationMs - breakTimeMs;
    }

    // Helper method to add pause data for testing
    static addPauseData(driverId: string, pauses: Array<{ start: Date; end: Date }>): void {
        this.pauseData.set(driverId, pauses);
    }

    // Helper method to clear pause data for testing
    static clearPauseData(driverId?: string): void {
        if (driverId) {
            this.pauseData.delete(driverId);
        } else {
            this.pauseData.clear();
        }
    }
} 