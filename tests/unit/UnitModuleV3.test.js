"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UnitFactory_1 = require("../../src/domain/UnitFactory");
const UnitGroupManager_1 = require("../../src/domain/UnitGroupManager");
describe('Unit Module V3.0', () => {
    describe('Individual Upgrades', () => {
        test('should create unit with specific upgrade level', () => {
            const unit = UnitFactory_1.UnitFactory.createUnit('hoplita', 'u1', 3);
            expect(unit.upgradeLevel).toBe(3);
            const stats = unit.getEffectiveStats(0);
            // Hoplite Upgrade 3: Damage 24, Armor 7
            expect(stats.damage).toBe(24);
            expect(stats.armor).toBe(7);
        });
        test('should calculate stats correctly with upgrade 0', () => {
            const unit = UnitFactory_1.UnitFactory.createUnit('hoplita', 'u2', 0);
            expect(unit.upgradeLevel).toBe(0);
            const stats = unit.getEffectiveStats(0);
            // Hoplite Base: Damage 18, Armor 1
            expect(stats.damage).toBe(18);
            expect(stats.armor).toBe(1);
        });
    });
    describe('Variable Accuracy', () => {
        test('should load correct accuracy for Lancero', () => {
            const lancero = UnitFactory_1.UnitFactory.createUnit('lancero', 'l1');
            expect(lancero.stats.accuracy).toBe(70);
        });
        test('should load correct accuracy for Hoplite', () => {
            const hoplita = UnitFactory_1.UnitFactory.createUnit('hoplita', 'h1');
            expect(hoplita.stats.accuracy).toBe(100);
        });
    });
    describe('UnitGroupManager', () => {
        test('should manage groups with different upgrade levels', () => {
            const manager = new UnitGroupManager_1.UnitGroupManager();
            manager.addGroup('hoplita', 0, 10);
            manager.addGroup('hoplita', 3, 5);
            expect(manager.groupsMap.size).toBe(2);
            expect(manager.groupsMap.get('hoplita_upgrade0').quantity).toBe(10);
            expect(manager.groupsMap.get('hoplita_upgrade3').quantity).toBe(5);
        });
        test('should instantiate units correctly', () => {
            const manager = new UnitGroupManager_1.UnitGroupManager();
            manager.addGroup('hoplita', 3, 2);
            manager.instantiateUnits(UnitFactory_1.UnitFactory);
            const units = manager.getAllUnits();
            expect(units.length).toBe(2);
            expect(units[0].name).toBe('hoplita');
            expect(units[0].upgradeLevel).toBe(3);
            expect(units[0].getEffectiveStats(0).damage).toBe(24); // Upgrade 3
        });
    });
});
