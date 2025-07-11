import { MlStub } from '../../utils/mlStub';

describe('MlStub Unit Tests', () => {
    describe('getRandomScore', () => {
        it('should always return an integer between 1 and 5, inclusive', () => {
            // Test that getRandomScore() always returns an integer between 1 and 5, inclusive
            for (let i = 0; i < 100; i++) {
                const score = MlStub.getRandomScore();
                expect(Number.isInteger(score)).toBe(true);
                expect(score).toBeGreaterThanOrEqual(1);
                expect(score).toBeLessThanOrEqual(5);
            }
        });
    });
}); 