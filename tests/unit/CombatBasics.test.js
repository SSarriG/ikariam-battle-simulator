"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UnitFactory_1 = require("../../src/domain/UnitFactory");
const DamageCalculator_1 = require("../../src/domain/DamageCalculator");
const AmmunitionManager_1 = require("../../src/domain/AmmunitionManager");
const TargetSelector_1 = require("../../src/domain/TargetSelector");
const BattlefieldFactory_1 = require("../../src/domain/BattlefieldFactory");
const enums_1 = require("../../src/domain/enums");
describe('Combat Basics', () => {
    describe('Damage Calculation', () => {
        test('should calculate damage correctly for Hoplite vs Hoplite', () => {
            const attacker = UnitFactory_1.UnitFactory.createUnit('hoplita', 'att-1');
            const defender = UnitFactory_1.UnitFactory.createUnit('hoplita', 'def-1');
            // Hoplite: Damage 18, Armor 1
            // Damage = 18 - 1 = 17
            const damage = DamageCalculator_1.DamageCalculator.calculateDamage(attacker, defender);
            expect(damage).toBe(17);
        });
        test('should calculate damage correctly for Steam Giant vs Hoplite', () => {
            const attacker = UnitFactory_1.UnitFactory.createUnit('gigante-vapor', 'att-1');
            const defender = UnitFactory_1.UnitFactory.createUnit('hoplita', 'def-1');
            // Giant: Damage 42
            // Hoplite: Armor 1
            // Damage = 42 - 1 = 41
            const damage = DamageCalculator_1.DamageCalculator.calculateDamage(attacker, defender);
            expect(damage).toBe(41);
        });
        test('should return 0 damage if armor > damage', () => {
            const attacker = UnitFactory_1.UnitFactory.createUnit('hondero', 'att-1'); // Damage 3
            const defender = UnitFactory_1.UnitFactory.createUnit('gigante-vapor', 'def-1'); // Armor 3
            // Damage = 3 - 3 = 0
            const damage = DamageCalculator_1.DamageCalculator.calculateDamage(attacker, defender);
            expect(damage).toBe(0);
        });
    });
    describe('Ammunition Management', () => {
        test('should consume ammo correctly', () => {
            const archer = UnitFactory_1.UnitFactory.createUnit('arquero', 'att-1');
            expect(AmmunitionManager_1.AmmunitionManager.canAttack(archer)).toBe(true);
            AmmunitionManager_1.AmmunitionManager.consumeAmmunition(archer);
            expect(archer.currentAmmunition).toBe(2);
        });
    });
    describe('Target Selection', () => {
        test('should select First Line as target for First Line attacker', () => {
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 10);
            const defenderUnit = UnitFactory_1.UnitFactory.createUnit('hoplita', 'def-1');
            // Add defender to First Line
            const defenderLine = battlefield.getLine('defender', enums_1.UnitType.FirstLine);
            defenderLine.slots[0].addUnit(defenderUnit);
            const attackerLine = battlefield.getLine('attacker', enums_1.UnitType.FirstLine);
            const target = TargetSelector_1.TargetSelector.selectTarget(attackerLine, battlefield, 'defender');
            expect(target).toBeDefined();
            expect(target?.name).toBe('hoplita');
        });
        test('should select Flanks if First Line is empty (for First Line attacker)', () => {
            // Note: According to lineas.json, First Line priority is: First Line -> Ranged -> Artillery -> Flanks
            // Let's test this priority chain
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 10);
            const defenderUnit = UnitFactory_1.UnitFactory.createUnit('arquero', 'def-1');
            // Add defender to Ranged Line (2nd priority for First Line)
            const defenderLine = battlefield.getLine('defender', enums_1.UnitType.Ranged);
            defenderLine.slots[0].addUnit(defenderUnit);
            const attackerLine = battlefield.getLine('attacker', enums_1.UnitType.FirstLine);
            const target = TargetSelector_1.TargetSelector.selectTarget(attackerLine, battlefield, 'defender');
            expect(target).toBeDefined();
            expect(target?.name).toBe('arquero');
        });
    });
});
