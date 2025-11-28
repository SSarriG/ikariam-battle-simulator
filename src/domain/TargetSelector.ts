import { Battlefield } from './Battlefield';
import { BattleLine } from './BattleLine';
import { Unit } from './Unit';
import { UnitType } from './enums';
import { VirtualCombatState } from './VirtualCombatState';

export class TargetSelector {
    static selectTarget(
        attacker: Unit,
        attackerLine: BattleLine,
        battlefield: Battlefield,
        enemySide: 'attacker' | 'defender',
        virtualState: VirtualCombatState
    ): Unit | null {
        const enemyLines = battlefield.getLines(enemySide);

        // Find attacker's slot index
        const attackerSlotIndex = this.findAttackerSlotIndex(attacker, attackerLine);
        if (attackerSlotIndex === -1) return null;

        // Iterate through target priorities
        for (const targetLineType of attackerLine.attackPriorities) {
            const enemyLine = enemyLines.get(targetLineType);
            if (!enemyLine) continue;

            // Try to find a valid target in this line, starting with corresponding slot
            const target = this.findTargetInLine(
                enemyLine,
                attackerSlotIndex,
                attacker,
                virtualState
            );

            if (target) return target;
        }

        return null;
    }

    private static findTargetInLine(
        enemyLine: BattleLine,
        preferredSlotIndex: number,
        attacker: Unit,
        virtualState: VirtualCombatState
    ): Unit | null {
        const totalSlots = enemyLine.slots.length;
        const centerIndex = Math.floor(totalSlots / 2);

        // Create search order: start with preferred slot, then move toward center
        const searchOrder: number[] = [preferredSlotIndex];
        const visited = new Set<number>([preferredSlotIndex]);

        // Determine direction toward center
        const direction = preferredSlotIndex < centerIndex ? 1 : -1;

        // Add slots moving toward center
        let current = preferredSlotIndex + direction;
        while (current >= 0 && current < totalSlots) {
            searchOrder.push(current);
            visited.add(current);
            current += direction;
        }

        // Add remaining slots on the other side
        for (let i = 0; i < totalSlots; i++) {
            if (!visited.has(i)) {
                searchOrder.push(i);
            }
        }

        // Search through slots in order
        for (const slotIndex of searchOrder) {
            const targetSlot = enemyLine.slots[slotIndex];
            if (!targetSlot) continue;

            const aliveTargets = targetSlot.getAliveUnits();
            if (aliveTargets.length === 0) continue;

            // Filter out virtually dead targets
            const virtuallyAlive = virtualState.getVirtuallyAlive(aliveTargets);
            if (virtuallyAlive.length === 0) continue;

            // Priority 1: Virtually wounded targets
            const woundedTargets = virtualState.getVirtuallyWounded(virtuallyAlive);

            if (woundedTargets.length > 0) {
                // Use accuracy to determine if we target wounded
                const targetWounded = Math.random() * 100 < attacker.stats.accuracy;

                if (targetWounded) {
                    // Random selection from wounded
                    const randomIndex = Math.floor(Math.random() * woundedTargets.length);
                    return woundedTargets[randomIndex];
                }
            }

            // Priority 2: Random from all virtually alive
            const randomIndex = Math.floor(Math.random() * virtuallyAlive.length);
            return virtuallyAlive[randomIndex];
        }

        return null;
    }

    private static findAttackerSlotIndex(attacker: Unit, attackerLine: BattleLine): number {
        for (let i = 0; i < attackerLine.slots.length; i++) {
            const slot = attackerLine.slots[i];
            if (slot.units.some(u => u.id === attacker.id)) {
                return i;
            }
        }
        return -1;
    }
}
