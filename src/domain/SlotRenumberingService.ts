import { UnitType } from './enums';

export class SlotRenumberingService {
    // Mapping of physical slot indices (0-based) to logical renumber IDs for a standard 7-slot line
    // Example for First Line (7 slots): Center is 3. Order: 3, 2, 4, 1, 5, 0, 6
    // Renumber IDs: 1, 2, 3, 4, 5, 6, 7 (assigned in that order)
    // Actually, the guidelines say:
    // First Line (7 slots): [6, 4, 2, 1, 3, 5, 7]
    // This means:
    // Physical Slot 0 (Leftmost) -> Logical 6
    // Physical Slot 1 -> Logical 4
    // Physical Slot 2 -> Logical 2
    // Physical Slot 3 (Center) -> Logical 1
    // Physical Slot 4 -> Logical 3
    // Physical Slot 5 -> Logical 5
    // Physical Slot 6 (Rightmost) -> Logical 7

    // We need to generate these mappings dynamically based on line size.
    // General algorithm: Center is 1. Then alternate Left (even), Right (odd).

    static getRenumberId(physicalIndex: number, totalSlots: number): number {
        const centerIndex = Math.floor(totalSlots / 2);

        if (physicalIndex === centerIndex) return 1;

        const distance = Math.abs(physicalIndex - centerIndex);
        const isLeft = physicalIndex < centerIndex;

        // If Left: 2, 4, 6... (2 * distance)
        // If Right: 3, 5, 7... (2 * distance + 1)

        if (isLeft) {
            return 2 * distance;
        } else {
            return 2 * distance + 1;
        }
    }

    static getPhysicalIndex(renumberId: number, totalSlots: number): number {
        const centerIndex = Math.floor(totalSlots / 2);

        if (renumberId === 1) return centerIndex;

        const isEven = renumberId % 2 === 0;
        const distance = isEven ? renumberId / 2 : (renumberId - 1) / 2;

        if (isEven) {
            return centerIndex - distance;
        } else {
            return centerIndex + distance;
        }
    }
}
