import { BattleLine } from './BattleLine';
import { Unit } from './Unit';

export class SlotFillingAlgorithm {
    static fill(line: BattleLine, availableUnits: Unit[]): void {
        // Group units by name for easier access
        const unitsMap = new Map<string, Unit[]>();
        availableUnits.forEach(unit => {
            if (!unitsMap.has(unit.name)) {
                unitsMap.set(unit.name, []);
            }
            unitsMap.get(unit.name)?.push(unit);
        });

        // Sort units in each group: Units with ammo first, then units without ammo
        unitsMap.forEach((units) => {
            units.sort((a, b) => {
                const aHasAmmo = a.currentAmmunition === null || a.currentAmmunition > 0;
                const bHasAmmo = b.currentAmmunition === null || b.currentAmmunition > 0;
                if (aHasAmmo && !bHasAmmo) return -1;
                if (!aHasAmmo && bHasAmmo) return 1;
                return 0;
            });
        });

        // Iterate over each slot
        for (const slot of line.slots) {
            // Iterate over unit priorities for this line
            for (const unitName of line.unitPositionPriorities) {
                const units = unitsMap.get(unitName);

                if (units && units.length > 0) {
                    // Try to fill the slot with this unit type
                    while (units.length > 0 && slot.remainingCapacity >= units[0].stats.size) {
                        const unit = units[0]; // Peek
                        if (slot.addUnit(unit)) {
                            unit.activate(); // Ensure unit is active (not in reserve)
                            units.shift(); // Remove from available if added
                        } else {
                            break; // Should not happen if check passed, but safety break
                        }
                    }
                }

                // If slot is full (or effectively full), move to next slot
                if (slot.remainingCapacity === 0) {
                    break;
                }
            }
        }

        // Add remaining units to reserves
        unitsMap.forEach((units) => {
            if (units.length > 0) {
                units.forEach(u => u.sendToReserve());
                line.reserves.push(...units);
            }
        });
    }
}
