
import { CombatEngine } from '../src/domain/CombatEngine';
import { BattlefieldFactory } from '../src/domain/BattlefieldFactory';
import { UnitFactory } from '../src/domain/UnitFactory';
import { BattleType, UnitType } from '../src/domain/enums';

describe('Ammo Depletion Integration Test', () => {
    it('should deplete ammo correctly over rounds', () => {
        // Create 5 Fusileros (3 ammo each)
        const attackerUnits = [];
        for (let i = 0; i < 5; i++) {
            attackerUnits.push(UnitFactory.createUnit('fusilero', `fusilero-${i}`));
        }

        // Create low-damage defenders (honderos have very low damage)
        const defenderUnits = [];
        for (let i = 0; i < 5; i++) {
            defenderUnits.push(UnitFactory.createUnit('hondero', `defender-${i}`));
        }

        const battlefield = BattlefieldFactory.createBattlefieldWithUnits(
            BattleType.Terrestrial,
            10,
            attackerUnits,
            defenderUnits
        );

        const engine = new CombatEngine(battlefield);

        // Get reference to the fusilero
        const fusilero = battlefield.attackerLines.get(UnitType.Ranged)!.slots
            .flatMap(s => s.units)
            .find(u => u.name === 'fusilero');

        expect(fusilero).toBeDefined();
        expect(fusilero!.currentAmmunition).toBe(3);

        // Round 1
        engine.executeNextRound();

        const rangedLine = battlefield.attackerLines.get(UnitType.Ranged)!;
        console.log('Ranged Line Slots Units:', rangedLine.slots.flatMap(s => s.units).length);
        console.log('Ranged Line Reserves Units:', rangedLine.reserves.length);

        let currentFusilero = rangedLine.slots
            .flatMap(s => s.units)
            .find(u => u.name === 'fusilero');

        if (!currentFusilero) {
            console.log('Unit not found in slots. Checking reserves...');
            currentFusilero = rangedLine.reserves.find(u => u.name === 'fusilero');
        }

        if (currentFusilero) {
            console.log('Found unit. Ammo:', currentFusilero.currentAmmunition);
            console.log('In Reserve?', currentFusilero.isInReserve());
        } else {
            console.log('Unit completely lost!');
        }

        console.log('Round 1 Ammo:', currentFusilero?.currentAmmunition);

        // Log defender status
        const defenders = battlefield.defenderLines.get(UnitType.FirstLine)?.getAllAliveUnits() || [];
        console.log('Alive Defenders (FirstLine):', defenders.length);
        const flankDefenders = battlefield.defenderLines.get(UnitType.Flank)?.getAllAliveUnits() || [];
        console.log('Alive Defenders (Flank):', flankDefenders.length);

        expect(currentFusilero!.currentAmmunition).toBe(2);

        // Round 2
        engine.executeNextRound();
        currentFusilero = battlefield.attackerLines.get(UnitType.Ranged)!.slots
            .flatMap(s => s.units)
            .find(u => u.name === 'fusilero');
        console.log('Round 2 Ammo:', currentFusilero!.currentAmmunition);
        expect(currentFusilero!.currentAmmunition).toBe(1);

        // Round 3
        engine.executeNextRound();
        currentFusilero = battlefield.attackerLines.get(UnitType.Ranged)!.slots
            .flatMap(s => s.units)
            .find(u => u.name === 'fusilero');
        console.log('Round 3 Ammo:', currentFusilero!.currentAmmunition);
        expect(currentFusilero!.currentAmmunition).toBe(0);
        expect(currentFusilero!.isInReserve()).toBe(true);

        // Round 4 (Should be moved to reserves and removed from slot)
        engine.executeNextRound();

        // Check if removed from slot
        const fusileroInSlot = battlefield.attackerLines.get(UnitType.Ranged)!.slots
            .flatMap(s => s.units)
            .find(u => u.id === fusilero!.id);

        expect(fusileroInSlot).toBeUndefined();
    });
});
