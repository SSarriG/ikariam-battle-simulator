import { SlotRenumberingService } from '../../src/domain/SlotRenumberingService';
import { BattleLine } from '../../src/domain/BattleLine';
import { BattleSlot } from '../../src/domain/BattleSlot';
import { UnitType } from '../../src/domain/enums';
import { AttackingMatrix } from '../../src/domain/AttackingMatrix';
import { UnitFactory } from '../../src/domain/UnitFactory';

describe('Battlefield Module V3.0', () => {
    describe('SlotRenumberingService', () => {
        test('should calculate renumber IDs correctly for 7 slots (First Line)', () => {
            // Expected: [6, 4, 2, 1, 3, 5, 7]
            // Indices:   0, 1, 2, 3, 4, 5, 6
            // Center is 3 (ID 1)

            expect(SlotRenumberingService.getRenumberId(3, 7)).toBe(1); // Center
            expect(SlotRenumberingService.getRenumberId(2, 7)).toBe(2); // Left 1
            expect(SlotRenumberingService.getRenumberId(4, 7)).toBe(3); // Right 1
            expect(SlotRenumberingService.getRenumberId(1, 7)).toBe(4); // Left 2
            expect(SlotRenumberingService.getRenumberId(5, 7)).toBe(5); // Right 2
            expect(SlotRenumberingService.getRenumberId(0, 7)).toBe(6); // Left 3
            expect(SlotRenumberingService.getRenumberId(6, 7)).toBe(7); // Right 3
        });
    });

    describe('BattleLine & Renumbering', () => {
        test('should assign renumber IDs on creation', () => {
            const slots = Array(7).fill(null).map(() => new BattleSlot(30));
            const line = new BattleLine(
                UnitType.FirstLine,
                slots,
                1,
                [],
                []
            );

            expect(line.slots[3].renumberId).toBe(1);
            expect(line.slots[0].renumberId).toBe(6);
            expect(line.slots[6].renumberId).toBe(7);
        });
    });

    describe('AttackingMatrix', () => {
        test('should build matrix correctly', () => {
            const slots = Array(3).fill(null).map(() => new BattleSlot(2)); // 3 slots, cap 2
            const line = new BattleLine(UnitType.FirstLine, slots, 1, [], []);

            // Fill slots
            const u1 = UnitFactory.createUnit('hoplita', 'u1');
            const u2 = UnitFactory.createUnit('hoplita', 'u2');
            slots[0].addUnit(u1);
            slots[0].addUnit(u2); // Slot 0 full

            const matrix = new AttackingMatrix(line);

            expect(matrix.rows).toBe(2);
            expect(matrix.cols).toBe(3);

            // Check content
            expect(matrix.getUnitAt(0, 0)).toBe(u1);
            expect(matrix.getUnitAt(1, 0)).toBe(u2);
            expect(matrix.getUnitAt(0, 1)).toBeNull();
        });
    });
});
