import { AccuracyFilter } from '../../src/domain/AccuracyFilter';
import { UnitFactory } from '../../src/domain/UnitFactory';

describe('AccuracyFilter', () => {
    describe('getEffectiveAttackers - PASS-THROUGH MODE', () => {
        test('should return all units (pass-through)', () => {
            const units = Array.from({ length: 10 }, (_, i) =>
                UnitFactory.createUnit('hoplita', `unit-${i}`)
            );

            const effective = AccuracyFilter.getEffectiveAttackers(units);

            // Pass-through: all 10 units should attack
            expect(effective.length).toBe(10);
        });

        test('should return all Spearmen units (no filtering by accuracy)', () => {
            const units = Array.from({ length: 12 }, (_, i) =>
                UnitFactory.createUnit('lancero', `unit-${i}`)
            );

            const effective = AccuracyFilter.getEffectiveAttackers(units);

            // Pass-through: all 12 units should attack (accuracy doesn't filter)
            expect(effective.length).toBe(12);
        });

        test('should return empty array for empty input', () => {
            const effective = AccuracyFilter.getEffectiveAttackers([]);
            expect(effective.length).toBe(0);
        });
    });

    describe('shouldUnitAttack - PASS-THROUGH MODE', () => {
        test('should always return true for any unit', () => {
            const unit1 = UnitFactory.createUnit('lancero', 'unit-1'); // 70% accuracy
            const unit2 = UnitFactory.createUnit('hoplita', 'unit-2'); // 100% accuracy

            // Both should attack regardless of accuracy
            expect(AccuracyFilter.shouldUnitAttack(unit1)).toBe(true);
            expect(AccuracyFilter.shouldUnitAttack(unit2)).toBe(true);
        });
    });
});
