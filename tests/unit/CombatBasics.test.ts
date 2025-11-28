import { UnitFactory } from '../../src/domain/UnitFactory';
import { DamageCalculator } from '../../src/domain/DamageCalculator';
import { AmmunitionManager } from '../../src/domain/AmmunitionManager';
import { TargetSelector } from '../../src/domain/TargetSelector';
import { BattlefieldFactory } from '../../src/domain/BattlefieldFactory';
import { BattleType, UnitType } from '../../src/domain/enums';
import { Unit } from '../../src/domain/Unit';

describe('Combat Basics', () => {
    describe('Damage Calculation', () => {
        test('should calculate damage correctly for Hoplite vs Hoplite', () => {
            const attacker = UnitFactory.createUnit('hoplita', 'att-1');
            const defender = UnitFactory.createUnit('hoplita', 'def-1');

            // Hoplite: Damage 18, Armor 1
            // Damage = 18 - 1 = 17
            const damage = DamageCalculator.calculateDamage(attacker, defender);
            expect(damage).toBe(17);
        });

        test('should calculate damage correctly for Steam Giant vs Hoplite', () => {
            const attacker = UnitFactory.createUnit('gigante-vapor', 'att-1');
            const defender = UnitFactory.createUnit('hoplita', 'def-1');

            // Giant: Damage 42
            // Hoplite: Armor 1
            // Damage = 42 - 1 = 41
            const damage = DamageCalculator.calculateDamage(attacker, defender);
            expect(damage).toBe(41);
        });

        test('should return 0 damage if armor > damage', () => {
            const attacker = UnitFactory.createUnit('hondero', 'att-1'); // Damage 3
            const defender = UnitFactory.createUnit('gigante-vapor', 'def-1'); // Armor 3

            // Damage = 3 - 3 = 0
            const damage = DamageCalculator.calculateDamage(attacker, defender);
            expect(damage).toBe(0);
        });
    });

    describe('Ammunition Management', () => {
        test('should consume ammo correctly', () => {
            const archer = UnitFactory.createUnit('arquero', 'att-1');
            expect(AmmunitionManager.canAttack(archer)).toBe(true);

            AmmunitionManager.consumeAmmunition(archer);
            expect(archer.currentAmmunition).toBe(2);
        });
    });

    describe('Target Selection', () => {
        test('should select First Line as target for First Line attacker', () => {
            const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);
            const defenderUnit = UnitFactory.createUnit('hoplita', 'def-1');

            // Add defender to First Line
            const defenderLine = battlefield.getLine('defender', UnitType.FirstLine);
            defenderLine.slots[0].addUnit(defenderUnit);

            const attackerLine = battlefield.getLine('attacker', UnitType.FirstLine);
            const attacker = UnitFactory.createUnit('hoplita', 'att-1');
            attackerLine.slots[0].addUnit(attacker);

            const target = TargetSelector.selectTarget(attacker, attackerLine, battlefield, 'defender');
            expect(target).toBeDefined();
            expect(target?.name).toBe('hoplita');
        });

        test('should select Flanks if First Line is empty (for First Line attacker)', () => {
            // Note: According to lineas.json, First Line priority is: First Line -> Ranged -> Artillery -> Flanks
            // Let's test this priority chain

            const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);
            const defenderUnit = UnitFactory.createUnit('arquero', 'def-1');

            // Add defender to Ranged Line (2nd priority for First Line)
            const defenderLine = battlefield.getLine('defender', UnitType.Ranged);
            defenderLine.slots[0].addUnit(defenderUnit);

            const attackerLine = battlefield.getLine('attacker', UnitType.FirstLine);
            const attacker = UnitFactory.createUnit('hoplita', 'att-1');
            attackerLine.slots[0].addUnit(attacker);

            const target = TargetSelector.selectTarget(attacker, attackerLine, battlefield, 'defender');
            expect(target).toBeDefined();
            expect(target?.name).toBe('arquero');
        });
    });
});
