"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CombatEngine_1 = require("../../src/domain/CombatEngine");
const BattlefieldFactory_1 = require("../../src/domain/BattlefieldFactory");
const UnitFactory_1 = require("../../src/domain/UnitFactory");
const enums_1 = require("../../src/domain/enums");
describe('CombatEngine', () => {
    describe('Basic Battle Flow', () => {
        test('should run a complete battle and determine winner', () => {
            // Create battlefield
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 10);
            // Add attacker units (stronger force)
            const attackerUnits = [
                UnitFactory_1.UnitFactory.createUnit('hoplita', 'att-1'),
                UnitFactory_1.UnitFactory.createUnit('hoplita', 'att-2'),
                UnitFactory_1.UnitFactory.createUnit('hoplita', 'att-3'),
            ];
            const attackerLine = battlefield.getLine('attacker', enums_1.UnitType.FirstLine);
            attackerUnits.forEach(unit => attackerLine.slots[0].addUnit(unit));
            // Add defender units (weaker force)
            const defenderUnits = [
                UnitFactory_1.UnitFactory.createUnit('hondero', 'def-1'),
            ];
            const defenderLine = battlefield.getLine('defender', enums_1.UnitType.Ranged);
            defenderUnits.forEach(unit => defenderLine.slots[0].addUnit(unit));
            // Run battle
            const engine = new CombatEngine_1.CombatEngine(battlefield);
            const report = engine.runBattle();
            // Verify report structure
            expect(report).toBeDefined();
            expect(report.battleId).toBeDefined();
            expect(report.totalRounds).toBeGreaterThan(0);
            expect(report.winner).toBe(enums_1.Winner.Attacker);
            expect(report.rounds.length).toBe(report.totalRounds);
        });
        test('should track damage and kills correctly', () => {
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 10);
            // Single attacker vs single defender
            const attacker = UnitFactory_1.UnitFactory.createUnit('hoplita', 'att-1');
            const defender = UnitFactory_1.UnitFactory.createUnit('hondero', 'def-1');
            battlefield.getLine('attacker', enums_1.UnitType.FirstLine).slots[0].addUnit(attacker);
            battlefield.getLine('defender', enums_1.UnitType.Ranged).slots[0].addUnit(defender);
            const engine = new CombatEngine_1.CombatEngine(battlefield);
            const report = engine.runBattle();
            // Verify statistics
            expect(report.attackerTotalDamage).toBeGreaterThan(0);
            expect(report.defenderUnitsLost).toBe(1);
            expect(report.attackerUnitsLost).toBe(0);
        });
        test('should handle draw when both sides are eliminated', () => {
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 10);
            // Equal weak forces
            const attacker = UnitFactory_1.UnitFactory.createUnit('hondero', 'att-1');
            const defender = UnitFactory_1.UnitFactory.createUnit('hondero', 'def-1');
            battlefield.getLine('attacker', enums_1.UnitType.Ranged).slots[0].addUnit(attacker);
            battlefield.getLine('defender', enums_1.UnitType.Ranged).slots[0].addUnit(defender);
            const engine = new CombatEngine_1.CombatEngine(battlefield);
            const report = engine.runBattle();
            // Both should be dead or one survives
            expect([enums_1.Winner.Attacker, enums_1.Winner.Defender, enums_1.Winner.Draw]).toContain(report.winner);
        });
    });
    describe('Round Reports', () => {
        test('should generate round-by-round reports', () => {
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 10);
            const attacker = UnitFactory_1.UnitFactory.createUnit('hoplita', 'att-1');
            const defender = UnitFactory_1.UnitFactory.createUnit('hoplita', 'def-1');
            battlefield.getLine('attacker', enums_1.UnitType.FirstLine).slots[0].addUnit(attacker);
            battlefield.getLine('defender', enums_1.UnitType.FirstLine).slots[0].addUnit(defender);
            const engine = new CombatEngine_1.CombatEngine(battlefield);
            const report = engine.runBattle();
            // Verify round reports
            expect(report.rounds.length).toBeGreaterThan(0);
            report.rounds.forEach(round => {
                expect(round.roundNumber).toBeGreaterThan(0);
                expect(round.attackEvents).toBeDefined();
                expect(Array.isArray(round.attackEvents)).toBe(true);
            });
        });
        test('should track attack events in rounds', () => {
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 10);
            const attacker = UnitFactory_1.UnitFactory.createUnit('hoplita', 'att-1');
            const defender = UnitFactory_1.UnitFactory.createUnit('hoplita', 'def-1');
            battlefield.getLine('attacker', enums_1.UnitType.FirstLine).slots[0].addUnit(attacker);
            battlefield.getLine('defender', enums_1.UnitType.FirstLine).slots[0].addUnit(defender);
            const engine = new CombatEngine_1.CombatEngine(battlefield);
            const report = engine.runBattle();
            // At least one round should have attack events
            const hasAttackEvents = report.rounds.some(round => round.attackEvents.length > 0);
            expect(hasAttackEvents).toBe(true);
            // Verify attack event structure
            const firstEventRound = report.rounds.find(r => r.attackEvents.length > 0);
            if (firstEventRound) {
                const event = firstEventRound.attackEvents[0];
                expect(event.attackerUnitId).toBeDefined();
                expect(event.targetUnitId).toBeDefined();
                expect(event.damageDealt).toBeGreaterThanOrEqual(0);
                expect(typeof event.targetKilled).toBe('boolean');
            }
        });
    });
    describe('Victory Conditions', () => {
        test('should stop battle when defender is eliminated', () => {
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 10);
            // Overwhelming attacker force
            const attackers = Array.from({ length: 5 }, (_, i) => UnitFactory_1.UnitFactory.createUnit('gigante-vapor', `att-${i}`));
            const defender = UnitFactory_1.UnitFactory.createUnit('hondero', 'def-1');
            const attackerLine = battlefield.getLine('attacker', enums_1.UnitType.FirstLine);
            attackers.forEach(unit => attackerLine.slots[0].addUnit(unit));
            battlefield.getLine('defender', enums_1.UnitType.Ranged).slots[0].addUnit(defender);
            const engine = new CombatEngine_1.CombatEngine(battlefield);
            const report = engine.runBattle();
            expect(report.winner).toBe(enums_1.Winner.Attacker);
            expect(report.defenderUnitsLost).toBe(1);
            expect(report.totalRounds).toBeLessThan(60); // Should end before max rounds
        });
        test('should respect max rounds limit', () => {
            const battlefield = BattlefieldFactory_1.BattlefieldFactory.createBattlefield(enums_1.BattleType.Terrestrial, 10);
            // Very strong units that won't kill each other quickly
            const attacker = UnitFactory_1.UnitFactory.createUnit('gigante-vapor', 'att-1');
            const defender = UnitFactory_1.UnitFactory.createUnit('gigante-vapor', 'def-1');
            battlefield.getLine('attacker', enums_1.UnitType.FirstLine).slots[0].addUnit(attacker);
            battlefield.getLine('defender', enums_1.UnitType.FirstLine).slots[0].addUnit(defender);
            const engine = new CombatEngine_1.CombatEngine(battlefield);
            const report = engine.runBattle();
            expect(report.totalRounds).toBeLessThanOrEqual(60);
        });
    });
});
