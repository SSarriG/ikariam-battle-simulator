import { BattleLine } from './BattleLine';
import { RedistributionResult, DamagePool } from './DamageRedistribution';
import { RedistributionType } from './enums';

/**
 * Reserve-Redistribution (RR)
 * Triggers: At the start of each round
 * Mechanic: Total damage accumulated is redistributed evenly across ALL alive units
 */
export class ReserveRedistributionService {
    /**
     * Apply RR to a battle line
     * Redistributes accumulated damage evenly across all alive units
     */
    static applyRR(line: BattleLine): RedistributionResult {
        const aliveUnits = line.getAllAliveUnits();

        if (aliveUnits.length === 0) {
            return {
                type: RedistributionType.Reserve,
                damagePool: { totalDamage: 0, affectedUnits: 0, damagePerUnit: 0 },
                unitsAffected: []
            };
        }

        // Calculate total damage taken by all units
        let totalDamage = 0;
        aliveUnits.forEach(unit => {
            const damageTaken = unit.stats.baseHP - unit.currentHP;
            totalDamage += damageTaken;
        });

        // Redistribute evenly
        const damagePerUnit = totalDamage / aliveUnits.length;

        // Reset all units to full HP, then apply redistributed damage
        aliveUnits.forEach(unit => {
            unit.currentHP = unit.stats.baseHP - damagePerUnit;
        });

        return {
            type: RedistributionType.Reserve,
            damagePool: {
                totalDamage,
                affectedUnits: aliveUnits.length,
                damagePerUnit
            },
            unitsAffected: aliveUnits.map(u => u.id)
        };
    }
}
