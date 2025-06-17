import { SignalValidation, Signal } from '../../../utils/signalValidation';

describe('SignalValidation Unit Tests', () => {
  beforeEach(() => {
    // Reset driver states before each test
    SignalValidation.resetDriverState('test-driver-1');
    SignalValidation.resetDriverState('test-driver-2');
  });

  describe('isValidTransition', () => {
    it('should return true for valid initial "start" signal', () => {
      // Test that isValidTransition returns true for valid initial "start" signal
      const result = SignalValidation.isValidTransition(null, 'start');
      expect(result).toBe(true);
    });

    it('should return false for invalid initial signals that are not "start"', () => {
      // Test that isValidTransition returns false for invalid initial signals that are not "start"
      expect(SignalValidation.isValidTransition(null, 'pause')).toBe(false);
      expect(SignalValidation.isValidTransition(null, 'continue')).toBe(false);
      expect(SignalValidation.isValidTransition(null, 'stop')).toBe(false);
    });

    it('should return true for "start" -> "pause" transition', () => {
      // Test that isValidTransition returns true for "start" -> "pause" transition
      const result = SignalValidation.isValidTransition('start', 'pause');
      expect(result).toBe(true);
    });

    it('should return true for "start" -> "stop" transition', () => {
      // Test that isValidTransition returns true for "start" -> "stop" transition
      const result = SignalValidation.isValidTransition('start', 'stop');
      expect(result).toBe(true);
    });

    it('should return false for "start" -> "start" transition', () => {
      // Test that isValidTransition returns false for "start" -> "start" transition
      const result = SignalValidation.isValidTransition('start', 'start');
      expect(result).toBe(false);
    });

    it('should return false for "start" -> "continue" transition', () => {
      // Test that isValidTransition returns false for "start" -> "continue" transition
      const result = SignalValidation.isValidTransition('start', 'continue');
      expect(result).toBe(false);
    });

    it('should return true for "pause" -> "continue" transition', () => {
      // Test that isValidTransition returns true for "pause" -> "continue" transition
      const result = SignalValidation.isValidTransition('pause', 'continue');
      expect(result).toBe(true);
    });

    it('should return true for "pause" -> "stop" transition', () => {
      // Test that isValidTransition returns true for "pause" -> "stop" transition
      const result = SignalValidation.isValidTransition('pause', 'stop');
      expect(result).toBe(true);
    });

    it('should return false for "pause" -> "start" transition', () => {
      // Test that isValidTransition returns false for "pause" -> "start" transition
      const result = SignalValidation.isValidTransition('pause', 'start');
      expect(result).toBe(false);
    });

    it('should return false for "pause" -> "pause" transition', () => {
      // Test that isValidTransition returns false for "pause" -> "pause" transition
      const result = SignalValidation.isValidTransition('pause', 'pause');
      expect(result).toBe(false);
    });

    it('should return true for "continue" -> "pause" transition', () => {
      // Test that isValidTransition returns true for "continue" -> "pause" transition
      const result = SignalValidation.isValidTransition('continue', 'pause');
      expect(result).toBe(true);
    });

    it('should return true for "continue" -> "stop" transition', () => {
      // Test that isValidTransition returns true for "continue" -> "stop" transition
      const result = SignalValidation.isValidTransition('continue', 'stop');
      expect(result).toBe(true);
    });

    it('should return false for "continue" -> "start" transition', () => {
      // Test that isValidTransition returns false for "continue" -> "start" transition
      const result = SignalValidation.isValidTransition('continue', 'start');
      expect(result).toBe(false);
    });

    it('should return false for "continue" -> "continue" transition', () => {
      // Test that isValidTransition returns false for "continue" -> "continue" transition
      const result = SignalValidation.isValidTransition('continue', 'continue');
      expect(result).toBe(false);
    });

    it('should return false for any transition from "stop"', () => {
      // Test that isValidTransition returns false for any transition from "stop"
      expect(SignalValidation.isValidTransition('stop', 'start')).toBe(false);
      expect(SignalValidation.isValidTransition('stop', 'pause')).toBe(false);
      expect(SignalValidation.isValidTransition('stop', 'continue')).toBe(false);
      expect(SignalValidation.isValidTransition('stop', 'stop')).toBe(false);
    });
  });

  describe('canReceiveSignal', () => {
    it('should return true when driver can receive the signal based on current state', () => {
      // Test that canReceiveSignal returns true when driver can receive the signal based on current state
      const driverId = 'test-driver-1';
      const newSignal: Signal = 'start';
      
      const result = SignalValidation.canReceiveSignal(driverId, newSignal);
      expect(result).toBe(true);
    });

    it('should return false when driver cannot receive the signal based on current state', () => {
      // Test that canReceiveSignal returns false when driver cannot receive the signal based on current state
      const driverId = 'test-driver-2';
      const newSignal: Signal = 'continue';
      
      const result = SignalValidation.canReceiveSignal(driverId, newSignal);
      expect(result).toBe(false);
    });
  });
}); 