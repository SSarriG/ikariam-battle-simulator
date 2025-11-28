import { BattleLine } from './BattleLine';
import { UnitType } from './enums';
import { Unit } from './Unit';

/**
 * Service to redistribute units between slots at the start of each round
 * Prioritizes filling the main slot first with healthy units
 */
export class SlotRefillService {
    /**
     * Get the priority order for slots based on line type
     * Returns array of slot indices in priority order (0-6)
     */
    private static getSlotPriorityOrder(lineType: UnitType): number[] {
        switch (lineType) {
            case UnitType.FirstLine:
            case UnitType.Ranged:
            case UnitType.Artillery:
                // Center, Center-Right, Center-Left, Far-Right, Far-Left, etc.
                return [3, 4, 2, 5, 1, 6, 0];

            case UnitType.Flank:
            case UnitType.Bomber:
                // Left to Right (assuming Flank is left flank)
                return [0, 1, 2, 3, 4, 5, 6];

            case UnitType.AntiAir:
                // Right to Left
                return [6, 5, 4, 3, 2, 1, 0];

            default:
                // Default: center outward
                return [3, 4, 2, 5, 1, 6, 0];
        }
    }

    /**
     * Redistribute units between slots to fill priority slots first
     * Prioritizes moving healthy (non-wounded) units
     */
    static redistributeSlots(line: BattleLine): void {
        const priorityOrder = this.getSlotPriorityOrder(line.lineType);

        // Collect all alive units from all slots
        const allUnits: Unit[] = [];
        for (const slot of line.slots) {
            allUnits.push(...slot.getAliveUnits());
        }

        if (allUnits.length === 0) return;

        // Separate healthy and wounded units
        const healthyUnits = allUnits.filter(u => u.currentHP >= u.stats.baseHP);
        const woundedUnits = allUnits.filter(u => u.currentHP < u.stats.baseHP);

        // Prioritize healthy units first, then wounded
        const sortedUnits = [...healthyUnits, ...woundedUnits];

        // Clear all slots
        for (const slot of line.slots) {
            slot.clearUnits();
        }

        // Redistribute units following priority order
        let unitIndex = 0;
        for (const slotIndex of priorityOrder) {
            const slot = line.slots[slotIndex];
            if (!slot) continue;

            // Fill this slot up to capacity
            while (unitIndex < sortedUnits.length && slot.remainingCapacity >= sortedUnits[unitIndex].stats.size) {
                slot.addUnit(sortedUnits[unitIndex]);
                unitIndex++;
            }

            // If we've placed all units, stop
            if (unitIndex >= sortedUnits.length) break;
        }
    }
}
