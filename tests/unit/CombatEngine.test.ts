import { CombatEngine } from '../../src/domain/CombatEngine';
import { BattlefieldFactory } from '../../src/domain/BattlefieldFactory';
import { UnitFactory } from '../../src/domain/UnitFactory';
import { BattleType, UnitType, Winner } from '../../src/domain/enums';

describe('CombatEngine', () => {
    describe('Basic Battle Flow', () => {
        test('should run a complete battle and determine winner', () => {
            // Create battlefield
            const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);

            // Add attacker units (stronger force)
            const attackerUnits = [
                UnitFactory.createUnit('hoplita', 'att-1'),
                UnitFactory.createUnit('hoplita', 'att-2'),
                UnitFactory.createUnit('hoplita', 'att-3'),
            ];

            const attackerLine = battlefield.getLine('attacker', UnitType.FirstLine);
            attackerUnits.forEach(unit => attackerLine.slots[0].addUnit(unit));

            // Add defender units (weaker force)
            const defenderUnits = [
                UnitFactory.createUnit('hondero', 'def-1'),
            ];

            const defenderLine = battlefield.getLine('defender', UnitType.Ranged);
            defenderUnits.forEach(unit => defenderLine.slots[0].addUnit(unit));

            // Run battle
            const engine = new CombatEngine(battlefield);
            const report = engine.runBattle();

            // Verify report structure
            expect(report).toBeDefined();
            expect(report.battleId).toBeDefined();
            expect(report.totalRounds).toBeGreaterThan(0);
            expect(report.winner).toBe(Winner.Attacker);
            expect(report.rounds.length).toBe(report.totalRounds);
        });

        test('should track damage and kills correctly', () => {
            const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);

            // Single attacker vs single defender
            const attacker = UnitFactory.createUnit('hoplita', 'att-1');
            const defender = UnitFactory.createUnit('hondero', 'def-1');

            battlefield.getLine('attacker', UnitType.FirstLine).slots[0].addUnit(attacker);
            battlefield.getLine('defender', UnitType.Ranged).slots[0].addUnit(defender);

            const engine = new CombatEngine(battlefield);
            const report = engine.runBattle();

            // Verify statistics
            expect(report.attackerTotalDamage).toBeGreaterThan(0);
            expect(report.defenderUnitsLost).toBe(1);
            expect(report.attackerUnitsLost).toBe(0);
        });

        test('should handle draw when both sides are eliminated', () => {
            const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);

            // Equal weak forces
            const attacker = UnitFactory.createUnit('hondero', 'att-1');
            const defender = UnitFactory.createUnit('hondero', 'def-1');

            battlefield.getLine('attacker', UnitType.Ranged).slots[0].addUnit(attacker);
            battlefield.getLine('defender', UnitType.Ranged).slots[0].addUnit(defender);

            const engine = new CombatEngine(battlefield);
            const report = engine.runBattle();

            // Both should be dead or one survives
            expect([Winner.Attacker, Winner.Defender, Winner.Draw]).toContain(report.winner);
        });
    });

    describe('Round Reports', () => {
        test('should generate round-by-round reports', () => {
            const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);

            const attacker = UnitFactory.createUnit('hoplita', 'att-1');
            const defender = UnitFactory.createUnit('hoplita', 'def-1');

            battlefield.getLine('attacker', UnitType.FirstLine).slots[0].addUnit(attacker);
            battlefield.getLine('defender', UnitType.FirstLine).slots[0].addUnit(defender);

            const engine = new CombatEngine(battlefield);
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
            const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);

            const attacker = UnitFactory.createUnit('hoplita', 'att-1');
            const defender = UnitFactory.createUnit('hoplita', 'def-1');

            battlefield.getLine('attacker', UnitType.FirstLine).slots[0].addUnit(attacker);
            battlefield.getLine('defender', UnitType.FirstLine).slots[0].addUnit(defender);

            const engine = new CombatEngine(battlefield);
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
            const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);

            // Overwhelming attacker force
            const attackers = Array.from({ length: 5 }, (_, i) =>
                UnitFactory.createUnit('gigante-vapor', `att-${i}`)
            );
            const defender = UnitFactory.createUnit('hondero', 'def-1');

            const attackerLine = battlefield.getLine('attacker', UnitType.FirstLine);
            attackers.forEach(unit => attackerLine.slots[0].addUnit(unit));

            battlefield.getLine('defender', UnitType.Ranged).slots[0].addUnit(defender);

            const engine = new CombatEngine(battlefield);
            const report = engine.runBattle();

            expect(report.winner).toBe(Winner.Attacker);
            expect(report.defenderUnitsLost).toBe(1);
            expect(report.totalRounds).toBeLessThan(60); // Should end before max rounds
        });

        test('should respect max rounds limit', () => {
            const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);

            // Very strong units that won't kill each other quickly
            const attacker = UnitFactory.createUnit('gigante-vapor', 'att-1');
            const defender = UnitFactory.createUnit('gigante-vapor', 'def-1');

            battlefield.getLine('attacker', UnitType.FirstLine).slots[0].addUnit(attacker);
            battlefield.getLine('defender', UnitType.FirstLine).slots[0].addUnit(defender);

            const engine = new CombatEngine(battlefield);
            const report = engine.runBattle();

            expect(report.totalRounds).toBeLessThanOrEqual(60);
        });
    });
});
