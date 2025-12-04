import { BattleLine } from './BattleLine';
import { Unit } from './Unit';

export class HealthEqualizer {
    static equalize(line: BattleLine): void {
        line.slots.forEach(slot => {
            if (slot.units.length === 0) return;

            // Group units by name (type) to ensure we only equalize same-type units
            const unitsByType = new Map<string, Unit[]>();

            slot.units.forEach(unit => {
                if (!unit.isAlive()) return;

                const type = unit.name;
                if (!unitsByType.has(type)) {
                    unitsByType.set(type, []);
                }
                unitsByType.get(type)!.push(unit);
            });

            // Equalize each group
            unitsByType.forEach(units => {
                if (units.length <= 1) return;

                const totalHP = units.reduce((sum, unit) => sum + unit.currentHP, 0);
                const averageHP = Math.floor(totalHP / units.length); // Floor to avoid creating HP out of thin air? Or Round? 
                // User example: 285/480 -> 59%. 285/2 = 142.5. 
                // If we floor, we lose 1 HP total. If we round, we might gain.
                // Let's use floor for now to be conservative, or maybe distribute remainders.
                // Simpler approach: Floor, and give remainder to first units.

                const remainder = totalHP % units.length;

                units.forEach((unit, index) => {
                    unit.currentHP = averageHP + (index < remainder ? 1 : 0);
                });
            });
        });
    }
}
