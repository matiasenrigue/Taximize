export type Signal = 'start' | 'pause' | 'continue' | 'stop';

export class SignalValidation {
    static isValidTransition(lastSignal: Signal | null, newSignal: Signal): boolean {
        // Define valid transitions
        const validTransitions: { [key: string]: Signal[] } = {
            null: ['start'], // Initial state can only start
            'start': ['pause', 'stop'], // From start can pause or stop
            'pause': ['continue', 'stop'], // From pause can continue or stop
            'continue': ['pause', 'stop'], // From continue can pause or stop
            'stop': [] // From stop, no transitions allowed
        };

        const key = lastSignal === null ? 'null' : lastSignal;
        return validTransitions[key]?.includes(newSignal) || false;
    }

} 