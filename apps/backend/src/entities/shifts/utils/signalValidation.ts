export type Signal = 'start' | 'pause' | 'continue' | 'stop';

export class SignalValidation {
  // Mock driver states for testing purposes
  private static driverStates: Map<string, Signal | null> = new Map();

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

  static canReceiveSignal(driverId: string, newSignal: Signal): boolean {
    // Get current state for the driver (or null if no previous state)
    const currentState = this.driverStates.get(driverId) || null;
    
    // Check if the transition is valid
    const canTransition = this.isValidTransition(currentState, newSignal);
    
    // Update driver state if transition is valid (for testing purposes)
    if (canTransition) {
      this.driverStates.set(driverId, newSignal);
    }
    
    return canTransition;
  }

  // Helper method to reset driver state (useful for testing)
  static resetDriverState(driverId: string): void {
    this.driverStates.delete(driverId);
  }

  // Helper method to set driver state (useful for testing)
  static setDriverState(driverId: string, state: Signal | null): void {
    if (state === null) {
      this.driverStates.delete(driverId);
    } else {
      this.driverStates.set(driverId, state);
    }
  }
} 