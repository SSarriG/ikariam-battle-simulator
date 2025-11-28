"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BattlefieldFactory_1 = require("../../src/domain/BattlefieldFactory");
const UnitFactory_1 = require("../../src/domain/UnitFactory");
const enums_1 = require("../../src/domain/enums");
describe('Battlefield Module', () => {
    describe('Battlefield Creation', () => {
        test('should create a terrestrial battlefield for level 10', () => {
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 10);
            const firstLine = battlefield.getLine('attacker', enums_1.UnitType.FirstLine);
            expect(firstLine).toBeDefined();
            expect(firstLine.slots.length).toBe(7);
            expect(firstLine.slots[0].capacity).toBe(30);
            const flanks = battlefield.getLine('attacker', enums_1.UnitType.Flank);
            expect(flanks.slots.length).toBe(4);
        });
        test('should create a maritime battlefield for level 20', () => {
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Maritime, 20);
            const firstLine = battlefield.getLine('attacker', enums_1.UnitType.FirstLine);
            expect(firstLine).toBeDefined();
            expect(firstLine.slots.length).toBe(7);
            expect(firstLine.slots[0].capacity).toBe(15);
        });
    });
    describe('Unit Distribution', () => {
        test('should distribute hoplites correctly', () => {
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 25);
            const units = [];
            // Create 200 Hoplites
            for (let i = 0; i < 200; i++) {
                units.push(UnitFactory_1.UnitFactory.createUnit('hoplita', `hoplite-${i}`));
            }
            BattlefieldFactory_1.BattlefieldFactory.distributeUnits(battlefield, units, []);
            const firstLine = battlefield.getLine('attacker', enums_1.UnitType.FirstLine);
            // Level 25: 7 slots of capacity 50
            // Hoplite size: 1
            // 200 hoplites should fill:
            // Slot 1: 50
            // Slot 2: 50
            // Slot 3: 50
            // Slot 4: 50
            // Slot 5: 0
            expect(firstLine.slots[0].units.length).toBe(50);
            expect(firstLine.slots[1].units.length).toBe(50);
            expect(firstLine.slots[2].units.length).toBe(50);
            expect(firstLine.slots[3].units.length).toBe(50);
            expect(firstLine.slots[4].units.length).toBe(0);
            expect(firstLine.getTotalUnits()).toBe(200);
        });
        test('should respect unit priorities', () => {
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 25);
            const units = [];
            // 50 Steam Giants (Size 3) -> 150 capacity
            for (let i = 0; i < 50; i++) {
                units.push(UnitFactory_1.UnitFactory.createUnit('gigante-vapor', `giant-${i}`));
            }
            // 50 Hoplites (Size 1) -> 50 capacity
            for (let i = 0; i < 50; i++) {
                units.push(UnitFactory_1.UnitFactory.createUnit('hoplita', `hoplite-${i}`));
            }
            // Priority: Hoplite > Steam Giant
            BattlefieldFactory_1.BattlefieldFactory.distributeUnits(battlefield, units, []);
            const firstLine = battlefield.getLine('attacker', enums_1.UnitType.FirstLine);
            // Slot 1 (Cap 50): 50 Hoplites (Size 50) - Full
            // Slot 2 (Cap 50): 16 Giants (Size 48) - 2 remaining
            // Slot 3 (Cap 50): 16 Giants (Size 48) - 2 remaining
            // Slot 4 (Cap 50): 16 Giants (Size 48) - 2 remaining
            // Slot 5 (Cap 50): 2 Giants (Size 6) - 44 remaining
            expect(firstLine.slots[0].units[0].name).toBe('hoplita');
            expect(firstLine.slots[0].units.length).toBe(50);
            expect(firstLine.slots[1].units[0].name).toBe('gigante-vapor');
            expect(firstLine.slots[1].units.length).toBe(16);
            expect(firstLine.getTotalUnits()).toBe(100);
        });
        test('should handle mixed unit types in different lines', () => {
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 25);
            const units = [];
            // 100 Hoplites (First Line)
            for (let i = 0; i < 100; i++) {
                units.push(UnitFactory_1.UnitFactory.createUnit('hoplita', `hoplite-${i}`));
            }
            // 50 Archers (Ranged)
            for (let i = 0; i < 50; i++) {
                units.push(UnitFactory_1.UnitFactory.createUnit('arquero', `archer-${i}`));
            }
            // 20 Mortars (Artillery)
            for (let i = 0; i < 20; i++) {
                units.push(UnitFactory_1.UnitFactory.createUnit('mortero', `mortar-${i}`));
            }
            BattlefieldFactory_1.BattlefieldFactory.distributeUnits(battlefield, units, []);
            const firstLine = battlefield.getLine('attacker', enums_1.UnitType.FirstLine);
            expect(firstLine.getTotalUnits()).toBe(100);
            const rangedLine = battlefield.getLine('attacker', enums_1.UnitType.Ranged);
            expect(rangedLine.getTotalUnits()).toBe(50);
            const artilleryLine = battlefield.getLine('attacker', enums_1.UnitType.Artillery);
            expect(artilleryLine.getTotalUnits()).toBe(20);
        });
    });
});
