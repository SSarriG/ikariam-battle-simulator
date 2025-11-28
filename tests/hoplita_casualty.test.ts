import { CombatEngine } from '../src/domain/CombatEngine';
import { BattlefieldFactory } from '../src/domain/BattlefieldFactory';
import { UnitFactory } from '../src/domain/UnitFactory';
import { BattleType, UnitType } from '../src/domain/enums';

describe('Hoplita Casualty Rate', () => {
    it('should produce expected casualties in 100v100 hoplita battle', () => {
        // Create 100 Level 2 Hoplitas for each side
        const attackerUnits = [];
        const defenderUnits = [];

        for (let i = 0; i < 100; i++) {
            const attacker = UnitFactory.createUnit('hoplita', `att-${i}`);
            attacker.upgradeLevel = 2;
            attackerUnits.push(attacker);

            const defender = UnitFactory.createUnit('hoplita', `def-${i}`);
            defender.upgradeLevel = 2;
            defenderUnits.push(defender);
        }

        // Create battlefield
        const battlefield = BattlefieldFactory.createBattlefieldWithUnits(
            BattleType.Terrestrial,
            25,
            attackerUnits,
            defenderUnits
        );

        // Create engine and execute THREE rounds to see cumulative effect
        const engine = new CombatEngine(battlefield);

        console.log("\n=== EXECUTING ROUND 1 ===");
        engine.executeNextRound();

        console.log("\n=== EXECUTING ROUND 2 ===");
        engine.executeNextRound();

        console.log("\n=== EXECUTING ROUND 3 ===");
        engine.executeNextRound();

        // Count alive units
        const attackerAlive = battlefield.attackerLines.get(UnitType.FirstLine)!.getAllAliveUnits().length;
        const defenderAlive = battlefield.defenderLines.get(UnitType.FirstLine)!.getAllAliveUnits().length;

        // Check HP distribution
        const defenderLine = battlefield.defenderLines.get(UnitType.FirstLine)!;
        const defenders = defenderLine.getAllAliveUnits();
        const hpDistribution: { [key: string]: number } = {};
        defenders.forEach(u => {
            const hpBucket = `${Math.floor(u.currentHP / 10) * 10}-${Math.floor(u.currentHP / 10) * 10 + 10}`;
            hpDistribution[hpBucket] = (hpDistribution[hpBucket] || 0) + 1;
        });

        // Check slot distribution
        const slotDistribution = defenderLine.slots.map(slot => ({
            total: slot.units.length,
            alive: slot.getAliveUnits().length,
            capacity: slot.capacity
        }));

        console.log(`\n=== FINAL RESULTS ===`);
        console.log(`Attacker: ${attackerAlive}/100 alive, ${100 - attackerAlive} casualties`);
        console.log(`Defender: ${defenderAlive}/100 alive, ${100 - defenderAlive} casualties`);
        console.log(`Defender HP distribution:`, hpDistribution);
        console.log(`Defender slot distribution:`, slotDistribution);

        // Hoplita Level 2: 33 damage, 56 HP, 16 armor
        // Effective damage = 33 - 16 = 17 per hit
        // Hits to kill = 56 / 17 = ~3.3 hits
        // With smart damage distribution, expect steady casualties each round
        // After 3 rounds, should have significant casualties
        expect(100 - attackerAlive).toBeGreaterThanOrEqual(5);
        expect(100 - defenderAlive).toBeGreaterThanOrEqual(5);
    });
});
