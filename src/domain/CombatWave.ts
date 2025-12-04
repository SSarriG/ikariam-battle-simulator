import { Unit } from './Unit';

export class CombatWave {
    public readonly accuracy: number;

    constructor(
        public readonly units: Unit[]
    ) {
        // Calculate weighted average accuracy
        // Units with more damage contribute more to the average
        let totalWeightedAcc = 0;
        let totalDamage = 0;

        units.forEach(unit => {
            const stats = unit.getEffectiveStats();
            totalWeightedAcc += stats.accuracy * stats.damage;
            totalDamage += stats.damage;
        });

        this.accuracy = totalDamage > 0 ? totalWeightedAcc / totalDamage : 100;
    }

    get totalDamage(): number {
        return this.units.reduce((sum, unit) => {
            const stats = unit.getEffectiveStats();
            return sum + stats.damage;
        }, 0);
    }

    get unitCount(): number {
        return this.units.length;
    }

    hasUnits(): boolean {
        return this.units.length > 0;
    }
}
