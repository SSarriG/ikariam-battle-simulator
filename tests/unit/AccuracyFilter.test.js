"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AccuracyFilter_1 = require("../../src/domain/AccuracyFilter");
const UnitFactory_1 = require("../../src/domain/UnitFactory");
describe('AccuracyFilter', () => {
    describe('getEffectiveAttackers', () => {
        test('should return all units for 100% accuracy', () => {
            const units = Array.from({ length: 10 }, (_, i) => UnitFactory_1.UnitFactory.createUnit('hoplita', `unit-${i}`));
            const effective = AccuracyFilter_1.AccuracyFilter.getEffectiveAttackers(units);
            expect(effective.length).toBe(10);
        });
        test('should filter units with 70% accuracy (Spearmen)', () => {
            const units = Array.from({ length: 12 }, (_, i) => UnitFactory_1.UnitFactory.createUnit('lancero', `unit-${i}`));
            // Lancero has 70% accuracy
            const effective = AccuracyFilter_1.AccuracyFilter.getEffectiveAttackers(units);
            // floor(12 * 0.7) = floor(8.4) = 8
            expect(effective.length).toBe(8);
        });
        test('should handle edge case with 1 unit at 70% accuracy', () => {
            const units = [UnitFactory_1.UnitFactory.createUnit('lancero', 'unit-1')];
            const effective = AccuracyFilter_1.AccuracyFilter.getEffectiveAttackers(units);
            // floor(1 * 0.7) = 0
            expect(effective.length).toBe(0);
        });
        test('should handle edge case with 2 units at 70% accuracy', () => {
            const units = [
                UnitFactory_1.UnitFactory.createUnit('lancero', 'unit-1'),
                UnitFactory_1.UnitFactory.createUnit('lancero', 'unit-2'),
            ];
            const effective = AccuracyFilter_1.AccuracyFilter.getEffectiveAttackers(units);
            // floor(2 * 0.7) = floor(1.4) = 1
            expect(effective.length).toBe(1);
        });
        test('should return empty array for empty input', () => {
            const effective = AccuracyFilter_1.AccuracyFilter.getEffectiveAttackers([]);
            expect(effective.length).toBe(0);
        });
    });
    describe('shouldUnitAttack', () => {
        test('should allow first 8 of 12 Spearmen to attack', () => {
            const unit = UnitFactory_1.UnitFactory.createUnit('lancero', 'unit-1');
            // First 8 should attack (70% of 12)
            for (let i = 0; i < 8; i++) {
                expect(AccuracyFilter_1.AccuracyFilter.shouldUnitAttack(unit, i, 12)).toBe(true);
            }
            // Last 4 should not attack
            for (let i = 8; i < 12; i++) {
                expect(AccuracyFilter_1.AccuracyFilter.shouldUnitAttack(unit, i, 12)).toBe(false);
            }
        });
        test('should allow all units with 100% accuracy to attack', () => {
            const unit = UnitFactory_1.UnitFactory.createUnit('hoplita', 'unit-1');
            for (let i = 0; i < 10; i++) {
                expect(AccuracyFilter_1.AccuracyFilter.shouldUnitAttack(unit, i, 10)).toBe(true);
            }
        });
    });
});
