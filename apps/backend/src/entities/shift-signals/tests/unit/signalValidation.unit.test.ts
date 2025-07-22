import { SignalValidation, Signal } from '../../utils/signalValidation';
import { SignalValidationTestUtils } from '../utils/signalValidation.testUtils';


describe('SignalValidation', () => {
    beforeEach(() => {
        SignalValidationTestUtils.clearAllDriverStates();
    });


    describe('isValidTransition', () => {
        it('allows start as initial signal', () => {
            const result = SignalValidation.isValidTransition(null, 'start');
            expect(result).toBe(true);
        });


        it('rejects other signals when no current state', () => {
            expect(SignalValidation.isValidTransition(null, 'pause')).toBe(false); // can't pause nothing
            expect(SignalValidation.isValidTransition(null, 'continue')).toBeFalsy(); // continue nothing
            expect(SignalValidation.isValidTransition(null, 'stop')).toBe(false);
        });


        it('should handle basic start transitions', () => {
            expect(SignalValidation.isValidTransition('start', 'pause')).toBeTruthy(); // can pause
            expect(SignalValidation.isValidTransition('start', 'stop')).toBe(true); // or stop
            
            // these make no sense
            expect(SignalValidation.isValidTransition('start', 'start')).toBe(false); // already started!
            expect(SignalValidation.isValidTransition('start', 'continue')).toBeFalsy();
        });


        describe('pause state transitions', () => {
            it('can continue or stop from pause', () => {

                expect(SignalValidation.isValidTransition('pause', 'continue')).toBe(true);
                expect(SignalValidation.isValidTransition('pause', 'stop')).toBeTruthy(); // can always stop
            });

            it('prevents invalid pause transitions', () => {
                expect(SignalValidation.isValidTransition('pause', 'start')).toBe(false); // can't restart
                expect(SignalValidation.isValidTransition('pause', 'pause')).toEqual(false); // double pause??
            });
        });


        // had a bug with this before
        it('handles continue -> pause/stop', () => {
            expect(SignalValidation.isValidTransition('continue', 'pause')).toBe(true); // pause again
            expect(SignalValidation.isValidTransition('continue', 'stop')).toBeTruthy();
        });


        it('blocks nonsense continue transitions', () => {
            expect(SignalValidation.isValidTransition('continue', 'start')).toBeFalsy(); 
            expect(SignalValidation.isValidTransition('continue', 'continue')).toBe(false); 
        });


        it('stop is final', () => {
            // once stopped, can't do anything
            expect(SignalValidation.isValidTransition('stop', 'start')).toBe(false);
            expect(SignalValidation.isValidTransition('stop', 'pause')).toBeFalsy();
            expect(SignalValidation.isValidTransition('stop', 'continue')).toBe(false);
            expect(SignalValidation.isValidTransition('stop', 'stop')).toEqual(false); // even stop again
        });
    });


    describe('canReceiveSignal', () => {
        it('checks if driver can receive signal', () => {
            const driverId = 'driver-123';
            
            // driver starts with null state
            const currentState = SignalValidationTestUtils.getDriverState(driverId);
            const canStart = SignalValidation.isValidTransition(currentState, 'start');
            expect(canStart).toBeTruthy(); // should be able to start
        });


        it('blocks invalid signals based on state', () => {
            const driver = 'test-driver';
            const badSignal: Signal = 'continue';
            
            // fresh driver can't continue
            const state = SignalValidationTestUtils.getDriverState(driver);
            expect(SignalValidation.isValidTransition(state, badSignal)).toBe(false); // nope
        });

        // TODO: add more complex scenarios with actual state changes
    });
});