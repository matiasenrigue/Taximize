// Placeholder file for TDD Red phase - methods will be implemented in Green phase

export type Signal = 'start' | 'pause' | 'continue' | 'stop';

export class SignalValidation {
  static isValidTransition(lastSignal: Signal | null, newSignal: Signal): boolean {
    throw new Error('Method not implemented');
  }

  static canReceiveSignal(driverId: string, newSignal: Signal): boolean {
    throw new Error('Method not implemented');
  }
} 