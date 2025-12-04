import { BattleLine } from './BattleLine';
import { BattleSlot } from './BattleSlot';
import { CombatWave } from './CombatWave';
import { BattleType } from './enums';
import { Unit } from './Unit';

/**
 * MatrixCombatSystem
 * Implements wave-based matrix combat with:
 * - Wave generation (horizontal slices)
 * - Center-out slot distribution
 * - Accuracy-based damage split
 * - Battle-type-specific overflow
 */
export class MatrixCombatSystem {
    /**
     * Process combat phase: attacker line attacks defender line
     * This is called bidirectionally (attacker→defender and defender→attacker)
     */
    static processPhase(attackerLine: BattleLine, defenderLine: BattleLine, battleType: BattleType): void {
        // 1. Generate Attack Waves
        const waves = this.generateWaves(attackerLine);
        if (waves.length === 0) return;

        // 2. Map Waves to Target Slots
        const waveMapping = this.mapWavesToSlots(waves, defenderLine);

        // 3. Resolve Combat per Slot
        waveMapping.forEach((slotWaves, slot) => {
            this.resolveSlotCombat(slot, slotWaves, battleType);
        });
    }

    /**
     * Generate waves from attacker line
     * Each wave = horizontal slice across all slots at same depth
     */
    private static generateWaves(line: BattleLine): CombatWave[] {
        const waves: CombatWave[] = [];
        const maxDepth = Math.max(...line.slots.map(s => s.units.length));

        for (let depth = 0; depth < maxDepth; depth++) {
            const waveUnits: Unit[] = [];

            line.slots.forEach(slot => {
                const unit = slot.units[depth];
                if (unit && unit.isAlive() && unit.canAttack()) {
                    waveUnits.push(unit);
                }
            });

            if (waveUnits.length > 0) {
                waves.push(new CombatWave(waveUnits));
            }
        }

        return waves;
    }

    /**
     * Map waves to defender slots using center-out distribution
     * Uses ROUND-ROBIN: waves cycle through slots in center-out order
     * Example: 5 waves, 2 slots -> Wave 0,2,4 to slot 0 (center), Wave 1,3 to slot 1
     */
    private static mapWavesToSlots(waves: CombatWave[], targetLine: BattleLine): Map<BattleSlot, CombatWave[]> {
        const mapping = new Map<BattleSlot, CombatWave[]>();
        const allSlots = targetLine.slots;
        const numTotalSlots = allSlots.length;

        if (numTotalSlots === 0 || waves.length === 0) return mapping;

        // Calculate center-out order based on TOTAL slots (not just occupied ones)
        // This ensures center is calculated from battlefield geometry, not current occupancy
        const slotIndices: number[] = [];

        if (numTotalSlots % 2 === 1) {
            // ODD number of slots: single center, then alternate outward
            // Example 5 slots [0,1,2,3,4]: [2, 1, 3, 0, 4]
            const centerIndex = Math.floor(numTotalSlots / 2);
            slotIndices.push(centerIndex);

            for (let offset = 1; offset <= centerIndex; offset++) {
                if (centerIndex - offset >= 0) slotIndices.push(centerIndex - offset);
                if (centerIndex + offset < numTotalSlots) slotIndices.push(centerIndex + offset);
            }
        } else {
            // EVEN number of slots: two centers, alternate between them first, then outward
            // Example 4 slots [0,1,2,3]: [1, 2, 0, 3]
            const centerLeft = Math.floor(numTotalSlots / 2) - 1;
            const centerRight = Math.floor(numTotalSlots / 2);

            slotIndices.push(centerLeft, centerRight);

            for (let offset = 1; offset < numTotalSlots / 2; offset++) {
                if (centerLeft - offset >= 0) slotIndices.push(centerLeft - offset);
                if (centerRight + offset < numTotalSlots) slotIndices.push(centerRight + offset);
            }
        }

        // Filter target order to only include slots with units
        const targetOrder: BattleSlot[] = slotIndices
            .map(index => allSlots[index])
            .filter(slot => slot.units.length > 0);

        if (targetOrder.length === 0) return mapping;

        // ROUND-ROBIN distribution: waves cycle through target order
        // Wave 0 -> targetOrder[0], Wave 1 -> targetOrder[1], Wave 2 -> targetOrder[0], etc.
        waves.forEach((wave, waveIndex) => {
            const slot = targetOrder[waveIndex % targetOrder.length];

            if (!mapping.has(slot)) {
                mapping.set(slot, []);
            }
            mapping.get(slot)!.push(wave);
        });

        return mapping;
    }

    /**
     * Resolve combat for a slot against incoming waves
     * Accuracy-Based Logic: accuracy% direct, (100-accuracy)% splash, battle-type overflow
     */
    private static resolveSlotCombat(slot: BattleSlot, waves: CombatWave[], battleType: BattleType): void {
        if (slot.units.length === 0) return;

        // Calculate total damage
        let totalDamage = 0;
        let weightedAccuracy = 0;
        let totalAttackers = 0;

        waves.forEach(wave => {
            totalDamage += wave.totalDamage;
            weightedAccuracy += wave.accuracy * wave.unitCount;
            totalAttackers += wave.unitCount;
        });

        if (totalDamage === 0) return;

        const averageAccuracy = totalAttackers > 0 ? weightedAccuracy / totalAttackers : 0;
        const accuracyFactor = averageAccuracy / 100; // e.g., 0.9 for 90% accuracy

        // Accuracy-Based Split: accuracy% Direct, (100-accuracy)% Splash
        // Example: 90% accuracy → 90% direct, 10% splash
        //          80% accuracy → 80% direct, 20% splash
        const directDamagePool = totalDamage * accuracyFactor;
        const splashDamagePool = totalDamage * (1 - accuracyFactor);

        console.log(`  Slot combat: ${waves.length} waves, ${totalDamage.toFixed(0)} total dmg, ${directDamagePool.toFixed(0)} direct, ${splashDamagePool.toFixed(0)} splash`);

        const livingUnits = slot.units.filter(u => u.isAlive());
        if (livingUnits.length === 0) return;

        // Apply Splash (Global Tax)
        const splashPerUnit = splashDamagePool / livingUnits.length;
        livingUnits.forEach(u => u.takeDamage(splashPerUnit));

        // Apply Direct Damage (Overflow Logic)
        let remainingDirectDamage = directDamagePool;

        for (const unit of livingUnits) {
            if (remainingDirectDamage <= 0) break;
            if (!unit.isAlive()) continue; // Already dead from splash

            const hpBefore = unit.currentHP;
            const damageToApply = Math.min(remainingDirectDamage, hpBefore);

            unit.takeDamage(damageToApply);
            remainingDirectDamage -= damageToApply;

            // Battle-Type Overflow
            if (battleType === BattleType.Terrestrial && !unit.isAlive()) {
                // Terrestrial: No Overflow - stop after first kill
                remainingDirectDamage = 0;
                break;
            }
            // Maritime: Linear Overflow - continue to next unit
        }
    }
}
