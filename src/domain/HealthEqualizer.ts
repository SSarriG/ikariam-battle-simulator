import { BattleLine } from './BattleLine';
import { Unit } from './Unit';

/**
 * S-R (Slot-Redistribution) via HealthEqualizer
 * Triggers: After each line exchange (except the last one)
 * Mechanic: Redistributes HP within each slot independently
 *           Groups units by type WITHIN each slot and equalizes HP
 */
export class HealthEqualizer {
    static equalize(line: BattleLine): void {
        // Equalize HP within each slot independently
        // This ensures damage redistribution only happens within the same slot

        // 1. Process each slot independently
        line.slots.forEach(slot => {
            this.equalizeSlot(slot.units);
        });

        // 2. Process reserves (all reserves together as one group)
        this.equalizeSlot(line.reserves);
    }

    /**
     * Equalize HP among units in a single slot
     * Groups units by type and redistributes HP within each type group
     */
    private static equalizeSlot(units: Unit[]): void {
        // Group units by type within this slot
        const unitsByType = new Map<string, Unit[]>();

        units.forEach(unit => {
            if (!unit.isAlive()) return;

            const type = unit.name;
            if (!unitsByType.has(type)) {
                unitsByType.set(type, []);
            }
            unitsByType.get(type)!.push(unit);
        });

        // Equalize each type group within this slot
        unitsByType.forEach(typeUnits => {
            if (typeUnits.length <= 1) return;

            const totalHP = typeUnits.reduce((sum, unit) => sum + unit.currentHP, 0);
            const averageHP = Math.floor(totalHP / typeUnits.length);
            const remainder = totalHP % typeUnits.length;

            typeUnits.forEach((unit, index) => {
                unit.currentHP = averageHP + (index < remainder ? 1 : 0);
            });
        });
    }
}
