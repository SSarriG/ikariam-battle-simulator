import { Unit } from './Unit';

export class CombatWave {
    public readonly accuracy: number;

    constructor(
        public readonly units: Unit[]
    ) {
        // Assume homogenous wave for now, or take average/first.
        // In Ikariam, rows are usually same unit type.
        if (units.length > 0) {
            this.accuracy = units[0].getEffectiveStats().accuracy;
        } else {
            this.accuracy = 0;
        }
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
