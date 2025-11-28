import { Unit } from './Unit';

export class DamageCalculator {
    static calculateDamage(attacker: Unit, defender: Unit): number {
        const attackerStats = attacker.getEffectiveStats();
        const defenderStats = defender.getEffectiveStats();

        const damage = Math.max(0, attackerStats.damage - defenderStats.armor);
        return damage;
    }
}
