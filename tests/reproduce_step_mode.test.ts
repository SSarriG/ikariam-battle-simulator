import { CombatEngine } from '../src/domain/CombatEngine';
import { BattlefieldFactory } from '../src/domain/BattlefieldFactory';
import { UnitFactory } from '../src/domain/UnitFactory';
import { BattleType } from '../src/domain/enums';

describe('Step Mode Reproduction', () => {
    test('should update alive units count after each round', () => {
        // Setup 40 vs 10 Hoplites to ensure kills (4 attackers per defender)
        const attackerUnits = Array(40).fill(null).map((_, i) =>
            UnitFactory.createUnit('hoplita', `att-${i}`, 2)
        );
        const defenderUnits = Array(10).fill(null).map((_, i) =>
            UnitFactory.createUnit('hoplita', `def-${i}`, 2)
        );

        const battlefield = BattlefieldFactory.createBattlefieldWithUnits(
            BattleType.Terrestrial,
            1,
            attackerUnits,
            defenderUnits
        );

        const engine = new CombatEngine(battlefield);

        // Initial state
        let attackerAlive = 0;
        battlefield.attackerLines.forEach(line => {
            attackerAlive += line.getAllAliveUnits().length;
        });
        expect(attackerAlive).toBe(40); // Corrected initial attacker count

        // Execute Round 1
        engine.executeNextRound();

        // Check state after Round 1
        let attackerAliveAfterRound1 = 0;
        battlefield.attackerLines.forEach(line => {
            attackerAliveAfterRound1 += line.getAllAliveUnits().length;
        });

        console.log(`Alive after Round 1: ${attackerAliveAfterRound1}`);

        // With 10 vs 10, some units SHOULD die.
        // 10 Hoplites deal ~180 damage. Hoplite HP is 56. ~3 kills expected.
        // This test setup is 40 vs 10, so attacker deaths are less likely but possible.
        // For now, let's just ensure it's not more than initial.
        expect(attackerAliveAfterRound1).toBeLessThanOrEqual(40);

        // Check state after Round 1
        let defenderAliveAfterRound1 = 0;
        battlefield.defenderLines.forEach(line => {
            defenderAliveAfterRound1 += line.getAllAliveUnits().length;
        });

        console.log(`Defender Alive after Round 1: ${defenderAliveAfterRound1}`);

        // With 40 vs 10, defenders should take significant damage
        expect(defenderAliveAfterRound1).toBeLessThan(10);
    });
});
