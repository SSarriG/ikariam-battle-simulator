import { Unit } from './Unit';

/**
 * AccuracyFilter
 * Filters attacking units based on their accuracy stat
 * Example: 12 Spearmen with 70% accuracy → only 8 attack effectively
 */
export class AccuracyFilter {
    /**
     * Get the effective attackers based on accuracy
     * Formula: effective_count = floor(total × accuracy / 100)
     */
    static getEffectiveAttackers(units: Unit[]): Unit[] {
        if (units.length === 0) {
            return [];
        }

        // All units of the same type should have the same accuracy
        const accuracy = units[0].stats.accuracy ?? 100;

        if (accuracy >= 100) {
            return units;
        }

        const effectiveCount = Math.floor(units.length * accuracy / 100);
        return units.slice(0, effectiveCount);
    }

    /**
     * Check if a specific unit should attack based on its position and accuracy
     * Used when processing units individually
     */
    static shouldUnitAttack(unit: Unit, unitIndex: number, totalUnits: number): boolean {
        const accuracy = unit.stats.accuracy ?? 100;

        if (accuracy >= 100) {
            return true;
        }

        const effectiveCount = Math.floor(totalUnits * accuracy / 100);
        return unitIndex < effectiveCount;
    }
}
