interface BreakStatistics {
    totalBreakTimeMs: number;
    numberOfBreaks: number;
    averageBreakDurationMs: number;
}

export class ShiftCalculator {
    static computeBreaks(shiftStart: Date, shiftEnd: Date, pauses: Array<{ start: Date; end: Date }>): BreakStatistics {
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
} 