import { BattleLine } from './BattleLine';
import { Unit } from './Unit';

export class HealthEqualizer {
    static equalize(line: BattleLine): void {
        // Group ALL units (Active + Reserves) by type
        const unitsByType = new Map<string, Unit[]>();

        // 1. Collect from ALL Slots
        line.slots.forEach(slot => {
            slot.units.forEach(unit => {
                if (!unit.isAlive()) return;

                const type = unit.name;
                if (!unitsByType.has(type)) {
                    unitsByType.set(type, []);
                }
                unitsByType.get(type)!.push(unit);
            });
        });

        // 2. Collect from Reserves
        line.reserves.forEach(unit => {
            if (!unit.isAlive()) return;

            const type = unit.name;
            if (!unitsByType.has(type)) {
                unitsByType.set(type, []);
            }
            unitsByType.get(type)!.push(unit);
        });

        // 3. Equalize each group
        unitsByType.forEach(units => {
            if (units.length <= 1) return;

            const totalHP = units.reduce((sum, unit) => sum + unit.currentHP, 0);
            const averageHP = Math.floor(totalHP / units.length);
            const remainder = totalHP % units.length;

            units.forEach((unit, index) => {
                unit.currentHP = averageHP + (index < remainder ? 1 : 0);
            });
        });
    }
}
