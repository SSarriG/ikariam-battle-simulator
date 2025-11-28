import { Unit } from './Unit';

/**
 * Virtual combat state tracks simulated HP and deaths during sequential attack processing
 * Actual damage is only applied after all attacks in a line complete
 */
export class VirtualCombatState {
    private virtualHP: Map<string, number> = new Map();
    private virtualDeaths: Set<string> = new Set();

    /**
     * Get the virtual HP of a unit (or actual HP if not yet attacked)
     */
    getVirtualHP(unit: Unit): number {
        return this.virtualHP.get(unit.id) ?? unit.currentHP;
    }

    /**
     * Check if a unit is virtually dead
     */
    isVirtuallyDead(unit: Unit): boolean {
        return this.virtualDeaths.has(unit.id);
    }

    /**
     * Apply virtual damage to a unit
     * Returns true if the unit died from this damage
     */
    applyVirtualDamage(unit: Unit, damage: number): boolean {
        const currentVirtualHP = this.getVirtualHP(unit);
        const newHP = currentVirtualHP - damage;

        this.virtualHP.set(unit.id, newHP);

        if (newHP <= 0 && !this.virtualDeaths.has(unit.id)) {
            this.virtualDeaths.add(unit.id);
            return true;
        }

        return false;
    }

    /**
     * Get all units that are wounded (HP < max) but not dead
     */
    getVirtuallyWounded(units: Unit[]): Unit[] {
        return units.filter(u => {
            if (this.isVirtuallyDead(u)) return false;
            const virtualHP = this.getVirtualHP(u);
            return virtualHP < u.stats.baseHP;
        });
    }

    /**
     * Get all units that are alive (not virtually dead)
     */
    getVirtuallyAlive(units: Unit[]): Unit[] {
        return units.filter(u => !this.isVirtuallyDead(u));
    }

    /**
     * Clear all virtual state
     */
    clear(): void {
        this.virtualHP.clear();
        this.virtualDeaths.clear();
    }
}
