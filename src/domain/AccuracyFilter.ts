import { Unit } from './Unit';

/**
 * AccuracyFilter
 * NOW PASS-THROUGH: All units attack regardless of accuracy.
 * Accuracy is handled by damage reduction in MatrixCombatSystem.
 */
export class AccuracyFilter {
    /**
     * Get the effective attackers based on accuracy.
     * 
     * NOW PASS-THROUGH: Returns all units.
     * Accuracy is handled by damage reduction in MatrixCombatSystem.
     */
    static getEffectiveAttackers(attackers: Unit[]): Unit[] {
        // Pass-through: All units attack
        return attackers;
    }

    /**
     * Determine if a specific unit should attack based on accuracy.
     * 
     * NOW PASS-THROUGH: Always returns true.
     * Accuracy is handled by damage reduction in MatrixCombatSystem.
     */
    static shouldUnitAttack(attacker: Unit): boolean {
        // Pass-through: All units attack
        return true;
    }
}
