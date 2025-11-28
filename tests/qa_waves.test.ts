import { SlotRefillService } from '../src/domain/SlotRefillService';
import { BattleLine } from '../src/domain/BattleLine';
import { BattleSlot } from '../src/domain/BattleSlot';
import { Unit } from '../src/domain/Unit';
import { UnitType, BattleType } from '../src/domain/enums';
import { UnitStats } from '../src/domain/UnitStats';

// Mock Unit
class MockUnit extends Unit {
    constructor(id: string, hp: number) {
        super(
            id,
            'test-unit',
            UnitType.FirstLine,
            BattleType.Terrestrial,
            new UnitStats(
                10, // baseHP
                0, // baseArmor
                10, // baseDamage
                1, // accuracy
                1, // size
                0, // ammunition
                0, // generalsCost
                [10, 10, 10, 10], // upgradeDamage
                [0, 0, 0, 0] // upgradeArmor
            )
        );
        this.currentHP = hp;
    }
}

describe('SlotRefillService QA', () => {
    test('should refill slots from reserves', () => {
        // Setup Line with 1 slot, capacity 5
        const line = new BattleLine(
            UnitType.FirstLine,
            [], // slots
            1, // attackOrder
            [], // attackPriorities
            [] // unitPositionPriorities
        );
        const slot = new BattleSlot(5);
        line.slots.push(slot);

        // Add 2 units to slot (3 empty spaces)
        slot.addUnit(new MockUnit('u1', 10));
        slot.addUnit(new MockUnit('u2', 10));

        // Add 5 units to reserve
        for (let i = 0; i < 5; i++) {
            line.reserves.push(new MockUnit(`r${i}`, 10));
        }

        console.log('Before refill:');
        console.log(`Slot units: ${slot.units.length}`);
        console.log(`Reserve units: ${line.reserves.length}`);

        // Run redistribution
        SlotRefillService.redistributeSlots(line);

        console.log('After refill:');
        console.log(`Slot units: ${slot.units.length}`);
        console.log(`Reserve units: ${line.reserves.length}`);

        // Assertions
        // Slot should be full (5 units)
        expect(slot.units.length).toBe(5);
        // Reserves should have 2 units left (2 initial + 5 reserves = 7 total. 5 in slot, 2 in reserve)
        expect(line.reserves.length).toBe(2);
    });

    test('should prioritize healthy units', () => {
        const line = new BattleLine(
            UnitType.FirstLine,
            [], // slots
            1, // attackOrder
            [], // attackPriorities
            [] // unitPositionPriorities
        );
        const slot = new BattleSlot(2); // Capacity 2
        line.slots.push(slot);

        // Add 1 wounded unit to slot
        const wounded = new MockUnit('wounded', 5); // 5/10 HP
        slot.addUnit(wounded);

        // Add 2 healthy units to reserve
        const healthy1 = new MockUnit('healthy1', 10);
        const healthy2 = new MockUnit('healthy2', 10);
        line.reserves.push(healthy1, healthy2);

        SlotRefillService.redistributeSlots(line);

        // Slot should contain the 2 healthy units
        expect(slot.units.length).toBe(2);
        expect(slot.units.some(u => u.id === 'healthy1')).toBe(true);
        expect(slot.units.some(u => u.id === 'healthy2')).toBe(true);

        // Reserve should contain the wounded unit
        expect(line.reserves.length).toBe(1);
        expect(line.reserves[0].id).toBe('wounded');
    });
});
