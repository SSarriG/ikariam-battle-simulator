import { ReserveRedistributionService } from '../../src/domain/ReserveRedistributionService';
import { SlotRedistributionService } from '../../src/domain/SlotRedistributionService';
import { ImmediateRedistributionService } from '../../src/domain/ImmediateRedistributionService';
import { BattlefieldFactory } from '../../src/domain/BattlefieldFactory';
import { UnitFactory } from '../../src/domain/UnitFactory';
import { BattleType, UnitType, RedistributionType } from '../../src/domain/enums';

describe('Damage Redistribution', () => {
    describe('Reserve-Redistribution (RR)', () => {
        test('should redistribute damage evenly across all alive units', () => {
            const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);
            const line = battlefield.getLine('attacker', UnitType.FirstLine);

            // Add 3 hoplitas to first slot
            const units = [
                UnitFactory.createUnit('hoplita', 'unit-1'),
                UnitFactory.createUnit('hoplita', 'unit-2'),
                UnitFactory.createUnit('hoplita', 'unit-3'),
            ];

            units.forEach(u => line.slots[0].addUnit(u));

            // Damage units differently
            units[0].takeDamage(20); // HP: 56 - 20 = 36
            units[1].takeDamage(10); // HP: 56 - 10 = 46
            units[2].takeDamage(0);  // HP: 56

            // Total damage: 20 + 10 + 0 = 30
            // Damage per unit after RR: 30 / 3 = 10

            const result = ReserveRedistributionService.applyRR(line);

            expect(result.type).toBe(RedistributionType.Reserve);
            expect(result.damagePool.totalDamage).toBe(30);
            expect(result.damagePool.affectedUnits).toBe(3);
            expect(result.damagePool.damagePerUnit).toBe(10);

            // All units should now have 56 - 10 = 46 HP
            expect(units[0].currentHP).toBe(46);
            expect(units[1].currentHP).toBe(46);
            expect(units[2].currentHP).toBe(46);
        });

        test('should handle empty line', () => {
            const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);
            const line = battlefield.getLine('attacker', UnitType.FirstLine);

            const result = ReserveRedistributionService.applyRR(line);

            expect(result.damagePool.totalDamage).toBe(0);
            expect(result.damagePool.affectedUnits).toBe(0);
        });
    });

    describe('Slot-Redistribution (SR)', () => {
        test('should redistribute damage within each slot', () => {
            const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);
            const line = battlefield.getLine('defender', UnitType.FirstLine);

            // Slot 0: 2 units
            const slot0Units = [
                UnitFactory.createUnit('hoplita', 'slot0-1'),
                UnitFactory.createUnit('hoplita', 'slot0-2'),
            ];
            slot0Units.forEach(u => line.slots[0].addUnit(u));

            // Slot 1: 2 units
            const slot1Units = [
                UnitFactory.createUnit('hoplita', 'slot1-1'),
                UnitFactory.createUnit('hoplita', 'slot1-2'),
            ];
            slot1Units.forEach(u => line.slots[1].addUnit(u));

            // Damage slot 0 units
            slot0Units[0].takeDamage(30); // HP: 26
            slot0Units[1].takeDamage(10); // HP: 46
            // Total slot 0 damage: 40, per unit: 20

            // Damage slot 1 units
            slot1Units[0].takeDamage(20); // HP: 36
            slot1Units[1].takeDamage(20); // HP: 36
            // Total slot 1 damage: 40, per unit: 20

            const result = SlotRedistributionService.applySR(line);

            expect(result.type).toBe(RedistributionType.Slot);

            // Slot 0: both should have 56 - 20 = 36 HP
            expect(slot0Units[0].currentHP).toBe(36);
            expect(slot0Units[1].currentHP).toBe(36);

            // Slot 1: both should have 56 - 20 = 36 HP
            expect(slot1Units[0].currentHP).toBe(36);
            expect(slot1Units[1].currentHP).toBe(36);
        });
    });

    describe('Immediate-Redistribution (IR)', () => {
        test('should apply IR for Portaglobos with ≥30 units', () => {
            const shouldApply = ImmediateRedistributionService.shouldApplyIR('barco-portaglobos', 30);
            expect(shouldApply).toBe(true);

            const shouldNotApply = ImmediateRedistributionService.shouldApplyIR('barco-portaglobos', 29);
            expect(shouldNotApply).toBe(false);
        });

        test('should apply IR for Steam Rams with ≥80 units', () => {
            const shouldApply = ImmediateRedistributionService.shouldApplyIR('barco-espolon-vapor', 80);
            expect(shouldApply).toBe(true);

            const shouldNotApply = ImmediateRedistributionService.shouldApplyIR('barco-espolon-vapor', 79);
            expect(shouldNotApply).toBe(false);
        });

        test('should divide damage among group when IR is active', () => {
            const units = Array.from({ length: 5 }, (_, i) =>
                UnitFactory.createUnit('barco-portaglobos', `unit-${i}`)
            );

            const incomingDamage = 500;
            const result = ImmediateRedistributionService.applyIR(units, incomingDamage);

            expect(result.type).toBe(RedistributionType.Immediate);
            expect(result.damagePool.totalDamage).toBe(500);
            expect(result.damagePool.affectedUnits).toBe(5);
            expect(result.damagePool.damagePerUnit).toBe(100);

            // Each unit should have taken 100 damage
            // Portaglobos HP: 140
            units.forEach(unit => {
                expect(unit.currentHP).toBe(40); // 140 - 100
            });
        });

        test('should not apply IR for non-IR units', () => {
            const shouldApply = ImmediateRedistributionService.shouldApplyIR('hoplita', 100);
            expect(shouldApply).toBe(false);
        });
    });
});
