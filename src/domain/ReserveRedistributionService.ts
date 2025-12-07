import { BattleLine } from './BattleLine';
import { RedistributionResult, DamagePool } from './DamageRedistribution';
import { RedistributionType } from './enums';
import { Unit } from './Unit';

/**
 * Reserve-Redistribution (R-R)
 * Triggers: At the start of each round (before refilling slots)
 * Mechanic: Redistributes HP among all units of the same TYPE across the entire line
 *           This includes units in ALL slots + reserves
 *           Each unit type is equalized independently
 */
export class ReserveRedistributionService {
    /**
     * Apply R-R to a battle line
     * Groups units by type and redistributes HP within each type group
     * across ALL slots + reserves
     */
    static applyRR(line: BattleLine): RedistributionResult {
        // Group ALL units (Active + Reserves) by type
        const unitsByType = new Map<string, Unit[]>();
        let totalUnitsAffected = 0;
        let totalDamageRedistributed = 0;

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

        // 3. Equalize each type group
        const affectedUnitIds: string[] = [];

        unitsByType.forEach(units => {
            if (units.length <= 1) return;

            const totalHP = units.reduce((sum, unit) => sum + unit.currentHP, 0);
            const totalMaxHP = units.reduce((sum, unit) => sum + unit.stats.baseHP, 0);
            const totalDamageTaken = totalMaxHP - totalHP;

            const averageHP = Math.floor(totalHP / units.length);
            const remainder = totalHP % units.length;

            units.forEach((unit, index) => {
                unit.currentHP = averageHP + (index < remainder ? 1 : 0);
                affectedUnitIds.push(unit.id);
            });

            totalUnitsAffected += units.length;
            totalDamageRedistributed += totalDamageTaken;
        });

        return {
            type: RedistributionType.Reserve,
            damagePool: {
                totalDamage: totalDamageRedistributed,
                affectedUnits: totalUnitsAffected,
                damagePerUnit: totalUnitsAffected > 0 ? totalDamageRedistributed / totalUnitsAffected : 0
            },
            unitsAffected: affectedUnitIds
        };
    }
}
