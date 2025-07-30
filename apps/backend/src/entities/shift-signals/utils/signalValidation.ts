/**
 * Represents the possible shift signal types
 * 
 * - start: Beginning a new shift
 * - pause: Taking a break during shift
 * - continue: Resuming work after a pause
 * - stop: Ending the shift
 */
export type Signal = 'start' | 'pause' | 'continue' | 'stop';


/**
 * Utility class for validating shift signal transitions
 * 
 * Logic to ensure signals follow valid sequences (e.g., can't pause without starting first)
 */
export class SignalValidation {

    
    /**
     * Validates if a signal transition is allowed
     * 
     * @param lastSignal - The most recent signal (null if no previous signal)
     * @param newSignal - The signal attempting to be registered
     * @returns True if the transition is valid, false otherwise
     */
    static isValidTransition(lastSignal: Signal | null, newSignal: Signal): boolean {

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