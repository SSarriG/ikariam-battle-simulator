"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UnitFactory_1 = require("../../src/domain/UnitFactory");
const UnitUpgradeService_1 = require("../../src/domain/UnitUpgradeService");
const enums_1 = require("../../src/domain/enums");
describe('Unit Module', () => {
    describe('Unit Creation', () => {
        test('should create a Hoplite correctly', () => {
            const hoplite = UnitFactory_1.UnitFactory.createUnit('hoplita', 'unit-1');
            expect(hoplite.name).toBe('hoplita');
            expect(hoplite.type).toBe(enums_1.UnitType.FirstLine);
            expect(hoplite.battleType).toBe(enums_1.BattleType.Terrestrial);
            expect(hoplite.stats.baseHP).toBe(56);
            expect(hoplite.stats.baseArmor).toBe(1);
            expect(hoplite.stats.baseDamage).toBe(18);
        });
        test('should create a Steam Giant correctly', () => {
            const giant = UnitFactory_1.UnitFactory.createUnit('gigante-vapor', 'unit-2');
            expect(giant.name).toBe('gigante-vapor');
            expect(giant.stats.baseHP).toBe(184);
        });
    });
    describe('Upgrades', () => {
        test('should apply upgrade level 1 correctly', () => {
            const hoplite = UnitFactory_1.UnitFactory.createUnit('hoplita', 'unit-1');
            UnitUpgradeService_1.UnitUpgradeService.applyUpgrade(hoplite, 1);
            const stats = hoplite.getEffectiveStats();
            // Hoplite Upgrade 1: Damage 19, Armor 2
            expect(stats.damage).toBe(19);
            expect(stats.armor).toBe(2);
        });
        test('should apply upgrade level 3 correctly', () => {
            const hoplite = UnitFactory_1.UnitFactory.createUnit('hoplita', 'unit-1');
            UnitUpgradeService_1.UnitUpgradeService.applyUpgrade(hoplite, 3);
            const stats = hoplite.getEffectiveStats();
            // Hoplite Upgrade 3: Damage 24, Armor 7
            expect(stats.damage).toBe(24);
            expect(stats.armor).toBe(7);
        });
    });
    describe('Hephaestus Bonus', () => {
        test('should apply Hephaestus level 5 correctly', () => {
            const giant = UnitFactory_1.UnitFactory.createUnit('gigante-vapor', 'unit-1');
            // Base: Damage 42, Armor 3
            giant.hephaestusLevel = 5;
            const stats = giant.getEffectiveStats();
            // Hephaestus 5: +20 Armor, +15% Damage
            // Armor: 3 + 20 = 23
            // Damage: 42 * 1.15 = 48.3 -> 48 (floored)
            expect(stats.armor).toBe(23);
            expect(stats.damage).toBe(48);
        });
        test('should combine Upgrades and Hephaestus correctly', () => {
            const giant = UnitFactory_1.UnitFactory.createUnit('gigante-vapor', 'unit-1');
            // Upgrade 3: Damage 48, Armor 9
            UnitUpgradeService_1.UnitUpgradeService.applyUpgrade(giant, 3);
            // Hephaestus 5: +20 Armor, +15% Damage
            giant.hephaestusLevel = 5;
            const stats = giant.getEffectiveStats();
            // Armor: 9 + 20 = 29
            // Damage: 48 * 1.15 = 55.2 -> 55
            expect(stats.armor).toBe(29);
            expect(stats.damage).toBe(55);
        });
    });
    describe('Battle Mechanics', () => {
        test('should take damage correctly', () => {
            const hoplite = UnitFactory_1.UnitFactory.createUnit('hoplita', 'unit-1');
            hoplite.takeDamage(20);
            expect(hoplite.currentHP).toBe(36); // 56 - 20
        });
        test('should die when HP <= 0', () => {
            const hoplite = UnitFactory_1.UnitFactory.createUnit('hoplita', 'unit-1');
            hoplite.takeDamage(60);
            expect(hoplite.isAlive()).toBe(false);
        });
        test('should consume ammunition', () => {
            const archer = UnitFactory_1.UnitFactory.createUnit('arquero', 'unit-1');
            expect(archer.currentAmmunition).toBe(3);
            archer.consumeAmmunition();
            expect(archer.currentAmmunition).toBe(2);
        });
        test('should go to reserve when out of ammo', () => {
            const archer = UnitFactory_1.UnitFactory.createUnit('arquero', 'unit-1');
            archer.consumeAmmunition(); // 2
            archer.consumeAmmunition(); // 1
            archer.consumeAmmunition(); // 0 -> Reserve
            expect(archer.currentAmmunition).toBe(0);
            expect(archer.isInReserve()).toBe(true);
            expect(archer.canAttack()).toBe(false);
        });
        test('should not take damage in reserve', () => {
            const archer = UnitFactory_1.UnitFactory.createUnit('arquero', 'unit-1');
            archer.sendToReserve();
            const hpBefore = archer.currentHP;
            archer.takeDamage(100);
            expect(archer.currentHP).toBe(hpBefore);
        });
    });
});
