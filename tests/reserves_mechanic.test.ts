import { CombatEngine } from '../src/domain/CombatEngine';
import { BattlefieldFactory } from '../src/domain/BattlefieldFactory';
import { UnitFactory } from '../src/domain/UnitFactory';
import { BattleType, UnitType } from '../src/domain/enums';

describe('Reserves Mechanic', () => {
    test('should refill slots from reserves after casualties', () => {
        // Setup: 
        // Slot size for Hoplite is 1. 
        // First Line has 7 slots (from lineas.json, assuming standard config).
        // Let's check lineas.json or assume a small number.
        // Actually, let's just use enough units to overflow.
        // If we put 50 Hoplites, they should fill the line and the rest go to reserve.

        // Capacity for Level 1 First Line is 3 slots * 30 size = 90.
        // So 100 Hoplites (size 1) should result in 90 active and 10 reserves.
        const attackerUnits = Array(100).fill(null).map((_, i) =>
            UnitFactory.createUnit('hoplita', `att-${i}`, 2)
        );
        // Defenders: Overwhelming force to ensure casualties
        const defenderUnits = Array(300).fill(null).map((_, i) =>
            UnitFactory.createUnit('hoplita', `def-${i}`, 3)
        );

        const battlefield = BattlefieldFactory.createBattlefieldWithUnits(
            BattleType.Terrestrial,
            1,
            attackerUnits,
            defenderUnits
        );

        const engine = new CombatEngine(battlefield);
        const attackerLine = battlefield.getLine('attacker', UnitType.FirstLine);

        // Check initial state
        const initialActive = attackerLine.getAllAliveUnits().length;
        const initialReserves = attackerLine.reserves.length;

        console.log(`Initial: Active=${initialActive}, Reserves=${initialReserves}`);

        expect(initialActive).toBe(90); // Full capacity
        expect(initialReserves).toBe(10); // Overflow
        expect(initialActive + initialReserves).toBe(100);

        // Execute Round 1
        engine.executeNextRound();

        // Execute Round 2 (Casualties should happen here)
        engine.executeNextRound();

        // Execute Round 3 (Refill should happen at start of this round)
        const round3Result = engine.executeNextRound();

        // Check state after Round 3
        const activeAfterRound3 = attackerLine.getAllAliveUnits().length;
        const reservesAfterRound3 = attackerLine.reserves.length;

        console.log(`Round 3: Active=${activeAfterRound3}, Reserves=${reservesAfterRound3}`);

        // Logic:
        // With the new accuracy-based wounded targeting:
        // 1. Units take damage more efficiently (focus fire on wounded)
        // 2. Some units may survive longer due to randomness
        // 3. We just verify that reserves were deployed (decreased from initial 10)

        // Verify reserves were used (should be < 10)
        expect(reservesAfterRound3).toBeLessThan(initialReserves);

        // Total alive should be less than initial (some casualties occurred)
        const totalAliveRound3 = activeAfterRound3 + reservesAfterRound3;
        expect(totalAliveRound3).toBeLessThan(initialActive + initialReserves);
    });
});
