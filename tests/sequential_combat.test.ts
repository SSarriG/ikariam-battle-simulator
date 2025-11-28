import { UnitFactory } from '../src/domain/UnitFactory';
import { BattlefieldFactory } from '../src/domain/BattlefieldFactory';
import { CombatEngine } from '../src/domain/CombatEngine';
import { BattleType, UnitType } from '../src/domain/enums';

describe('Sequential Combat Logic', () => {
    test('Anti-Air should kill Bombers before they can attack', () => {
        // Setup: 
        // Attacker: 30 Gyrocopters (Anti-Air) - High damage vs air
        // Defender: 10 Bombers - Low HP, should die quickly

        const attackerUnits = [];
        for (let i = 0; i < 30; i++) {
            attackerUnits.push(UnitFactory.createUnit('girocoptero', `gyro-${i}`));
        }

        const defenderUnits = [];
        for (let i = 0; i < 10; i++) {
            defenderUnits.push(UnitFactory.createUnit('bombardero', `bomber-${i}`));
        }

        // Create battlefield with correct signature (battleType, level)
        const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 25);

        // Manually populate the lines with units
        const attackerAntiAirLine = battlefield.attackerLines.get(UnitType.AntiAir);
        const defenderBomberLine = battlefield.defenderLines.get(UnitType.Bomber);

        if (attackerAntiAirLine && defenderBomberLine) {
            attackerUnits.forEach(u => attackerAntiAirLine.reserves.push(u));
            defenderUnits.forEach(u => defenderBomberLine.reserves.push(u));
        }

        const engine = new CombatEngine(battlefield);

        // Execute Round 1
        const result = engine.executeNextRound();
        const report = result.report;

        // Verification:
        // 1. Gyrocopters (Anti-Air) attack first.
        // 2. They should kill ALL Bombers (30 gyros vs 10 bombers is overkill).
        // 3. Bombers (Priority 2) should be dead before they can attack.
        // 4. Therefore, Defender Total Damage should be 0.

        const deadBombers = report.defenderUnits.filter(u => !u.isAlive).length;
        console.log(`Dead Bombers: ${deadBombers}/10`);
        console.log(`Defender Total Damage: ${report.defenderTotalDamage}`);

        expect(deadBombers).toBe(10);
        expect(report.defenderTotalDamage).toBe(0);
    });
});
