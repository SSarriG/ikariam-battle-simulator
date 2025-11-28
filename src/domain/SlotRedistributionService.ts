import { BattleLine } from './BattleLine';
import { BattleSlot } from './BattleSlot';
import { RedistributionResult, DamagePool } from './DamageRedistribution';
import { RedistributionType } from './enums';

/**
 * Slot-Redistribution (SR)
 * Triggers: After a line finishes attacking
 * Mechanic: Damage is redistributed within each slot of the target line
 */
export class SlotRedistributionService {
    /**
     * Apply SR to a target line after it has been attacked
     * Redistributes damage within each slot
     */
    static applySR(targetLine: BattleLine): RedistributionResult {
        const allAffectedUnits: string[] = [];
        let totalDamageRedistributed = 0;
        let totalUnitsAffected = 0;

        targetLine.slots.forEach(slot => {
            const result = this.redistributeSlot(slot);
            allAffectedUnits.push(...result.unitsAffected);
            totalDamageRedistributed += result.damagePool.totalDamage;
            totalUnitsAffected += result.damagePool.affectedUnits;
        });

        return {
            type: RedistributionType.Slot,
            damagePool: {
                totalDamage: totalDamageRedistributed,
                affectedUnits: totalUnitsAffected,
                damagePerUnit: totalUnitsAffected > 0 ? totalDamageRedistributed / totalUnitsAffected : 0
            },
            unitsAffected: allAffectedUnits
        };
    }

    private static redistributeSlot(slot: BattleSlot): RedistributionResult {
        // We must consider ALL units in the slot, including those that might have 'died' (HP <= 0)
        // during this round's damage application, because SR happens BEFORE dead units are removed.
        // This ensures that "overkill" damage on one unit is shared among the others.
        const unitsInSlot = slot.units;

        if (unitsInSlot.length === 0) {
            return {
                type: RedistributionType.Slot,
                damagePool: { totalDamage: 0, affectedUnits: 0, damagePerUnit: 0 },
                unitsAffected: []
            };
        }

        // Calculate total damage in this slot
        let totalSlotDamage = 0;
        unitsInSlot.forEach(unit => {
            const damageTaken = unit.stats.baseHP - unit.currentHP;
            totalSlotDamage += damageTaken;
        });

        // Redistribute evenly within slot
        const damagePerUnit = totalSlotDamage / unitsInSlot.length;

        unitsInSlot.forEach(unit => {
            unit.currentHP = unit.stats.baseHP - damagePerUnit;
        });

        return {
            type: RedistributionType.Slot,
            damagePool: {
                totalDamage: totalSlotDamage,
                affectedUnits: unitsInSlot.length,
                damagePerUnit
            },
            unitsAffected: unitsInSlot.map(u => u.id)
        };
    }
}
