import { Unit } from './Unit';

/**
 * Represents pending damage that will be applied simultaneously
 */
export interface PendingDamage {
    target: Unit;
    totalDamage: number;
    attackerSide: 'attacker' | 'defender';
}

/**
 * Manages pending damage for simultaneous combat
 */
export class DamageQueue {
    private pendingDamage: Map<string, PendingDamage> = new Map();

    /**
     * Add damage to a unit (accumulates if unit already has pending damage)
     */
    addDamage(target: Unit, damage: number, attackerSide: 'attacker' | 'defender'): void {
        const existing = this.pendingDamage.get(target.id);
        if (existing) {
            existing.totalDamage += damage;
        } else {
            this.pendingDamage.set(target.id, {
                target,
                totalDamage: damage,
                attackerSide
            });
        }
    }

    /**
     * Apply all pending damage simultaneously
     */
    applyAll(): PendingDamage[] {
        const applied: PendingDamage[] = [];

        for (const pending of this.pendingDamage.values()) {
            pending.target.takeDamage(pending.totalDamage);
            applied.push(pending);
        }

        this.pendingDamage.clear();
        return applied;
    }

    /**
     * Clear all pending damage without applying
     */
    clear(): void {
        this.pendingDamage.clear();
    }

    /**
     * Check if there is any pending damage
     */
    hasPendingDamage(): boolean {
        return this.pendingDamage.size > 0;
    }

    /**
     * Check if a target already has extreme overkill damage queued
     * Returns true if pending damage >= 2x target's current HP
     * This prevents massive overkill while still allowing focus fire
     */
    hasLethalDamage(target: Unit): boolean {
        const pending = this.pendingDamage.get(target.id);
        if (!pending) return false;
        // Only filter if damage is 2x or more of current HP (extreme overkill)
        return pending.totalDamage >= (target.currentHP * 2);
    }

    /**
     * Get the amount of pending damage for a target
     */
    getPendingDamage(target: Unit): number {
        const pending = this.pendingDamage.get(target.id);
        return pending ? pending.totalDamage : 0;
    }
}
