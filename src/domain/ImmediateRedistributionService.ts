import { Unit } from './Unit';
import { RedistributionResult, DamagePool } from './DamageRedistribution';
import { RedistributionType } from './enums';

/**
 * Immediate-Redistribution (IR)
 * Triggers: During attack for specific units when threshold is met
 * Units: Portaglobos (≥30), Steam Rams (≥80)
 * Mechanic: Incoming damage is divided among all units in the group
 */
export class ImmediateRedistributionService {
    private static readonly IR_THRESHOLDS: Map<string, number> = new Map([
        ['barco-portaglobos', 30],  // Balloon Carrier
        ['barco-espolon-vapor', 80] // Steam Ram
    ]);

    /**
     * Check if IR should be applied for this unit type and group size
     */
    static shouldApplyIR(unitName: string, groupSize: number): boolean {
        const threshold = this.IR_THRESHOLDS.get(unitName);
        return threshold !== undefined && groupSize >= threshold;
    }

    /**
     * Apply IR to a group of units receiving damage
     * Divides incoming damage evenly among all units in the group
     */
    static applyIR(units: Unit[], incomingDamage: number): RedistributionResult {
        if (units.length === 0) {
            return {
                type: RedistributionType.Immediate,
                damagePool: { totalDamage: 0, affectedUnits: 0, damagePerUnit: 0 },
                unitsAffected: []
            };
        }

        const damagePerUnit = incomingDamage / units.length;

        // Apply redistributed damage to each unit
        units.forEach(unit => {
            unit.takeDamage(damagePerUnit);
        });

        return {
            type: RedistributionType.Immediate,
            damagePool: {
                totalDamage: incomingDamage,
                affectedUnits: units.length,
                damagePerUnit
            },
            unitsAffected: units.map(u => u.id)
        };
    }

    /**
     * Get the IR threshold for a specific unit type
     */
    static getThreshold(unitName: string): number | undefined {
        return this.IR_THRESHOLDS.get(unitName);
    }
}
