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
     * Calculate combat phase WITHOUT applying damage
     * Returns damage information to be applied later for simultaneous combat
     */
    static calculatePhase(attackerLine: BattleLine, defenderLine: BattleLine, battleType: BattleType): Map<BattleSlot, { directDmg: number, splashDmg: number, numAttackers: number, avgDefenderHP: number, waves: CombatWave[] }> {
        const damageMap = new Map<BattleSlot, { directDmg: number, splashDmg: number, numAttackers: number, avgDefenderHP: number, waves: CombatWave[] }>();

        // 1. Generate Attack Waves
        const waves = this.generateWaves(attackerLine);
        if (waves.length === 0) return damageMap;

        console.log(`  Generated ${waves.length} waves from attacker line ${attackerLine.lineType}`);
        waves.forEach((wave, i) => console.log(`    Wave ${i}: ${wave.unitCount} units, ${wave.totalDamage.toFixed(0)} gross dmg`));

        // 2. Map Waves to Target Slots
        const waveMapping = this.mapWavesToSlots(waves, defenderLine);

        console.log(`  Mapped to ${waveMapping.size} defender slots`);

        // 3. Calculate damage per slot (but don't apply it yet)
        waveMapping.forEach((slotWaves, slot) => {
            const damage = this.calculateSlotDamage(slot, slotWaves, battleType);
            if (damage) {
                damageMap.set(slot, { ...damage, waves: slotWaves }); // Include waves for sequential processing
            }
        });

        return damageMap;
    }

    /**
     * Apply pre-calculated damage to all slots
     * This is called AFTER both sides have calculated their attacks for true simultaneity
     */
    static applyDamage(damageMap: Map<BattleSlot, { directDmg: number, splashDmg: number, numAttackers: number, avgDefenderHP: number, waves: CombatWave[] }>, battleType: BattleType): void {
        damageMap.forEach((damageInfo, slot) => {
            this.applySlotDamage(slot, damageInfo, battleType);
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

        console.log(`  Wave mapping: ${waves.length} waves -> ${targetOrder.length} target slots`);
        mapping.forEach((slotWaves, slot) => {
            const slotIndex = targetLine.slots.indexOf(slot);
            console.log(`    Slot ${slotIndex}: ${slotWaves.length} waves`);
        });

        return mapping;
    }

    /**
     * Calculate damage for a slot WITHOUT applying it
     * Returns null if no damage should be applied
     */
    private static calculateSlotDamage(slot: BattleSlot, waves: CombatWave[], battleType: BattleType): { directDmg: number, splashDmg: number, numAttackers: number, avgDefenderHP: number } | null {
        console.log(`  >> calculateSlotDamage: ${slot.units.length} units in slot, ${waves.length} waves`);

        if (slot.units.length === 0) return null;

        // Calculate average defender armor and HP from living units
        const livingUnits = slot.units.filter(u => u.isAlive());
        if (livingUnits.length === 0) return null;

        const avgDefenderArmor = livingUnits.reduce((sum, u) => sum + u.getEffectiveStats().armor, 0) / livingUnits.length;
        const avgDefenderHP = livingUnits.reduce((sum, u) => sum + u.currentHP, 0) / livingUnits.length;

        // Calculate total NET damage (after armor)
        let totalNetDamage = 0;
        let weightedAccuracy = 0;
        let totalAttackers = 0;

        waves.forEach(wave => {
            wave.units.forEach(attacker => {
                const grossDamage = attacker.getEffectiveStats().damage;
                const netDamage = Math.max(0, grossDamage - avgDefenderArmor);
                totalNetDamage += netDamage;

                const accuracy = attacker.getEffectiveStats().accuracy;
                weightedAccuracy += accuracy;
                totalAttackers++;
            });
        });

        if (totalNetDamage === 0) return null;

        const averageAccuracy = totalAttackers > 0 ? weightedAccuracy / totalAttackers : 0;
        const accuracyFactor = averageAccuracy / 100; // e.g., 0.9 for 90% accuracy

        // Accuracy-Based Split: accuracy% Direct, (100-accuracy)% Splash
        const directDamagePool = totalNetDamage * accuracyFactor;
        const splashDamagePool = totalNetDamage * (1 - accuracyFactor);

        console.log(`  Slot combat: ${waves.length} waves, ${totalNetDamage.toFixed(0)} NET dmg, ${directDamagePool.toFixed(0)} direct, ${splashDamagePool.toFixed(0)} splash, ${totalAttackers} attackers`);

        return { directDmg: directDamagePool, splashDmg: splashDamagePool, numAttackers: totalAttackers, avgDefenderHP };
    }

    /**
     * Apply pre-calculated damage to a slot
     * Terrestrial: Sequential attacker-by-attacker processing
     * Maritime: Aggregated damage with linear overflow
     */
    private static applySlotDamage(
        slot: BattleSlot,
        damageInfo: { directDmg: number, splashDmg: number, numAttackers: number, avgDefenderHP: number, waves: CombatWave[] },
        battleType: BattleType
    ): void {
        if (battleType === BattleType.Terrestrial) {
            this.applyTerrestrialDamageSequential(slot, damageInfo.waves);
        } else {
            this.applyMaritimeDamage(slot, damageInfo);
        }
    }

    /**
     * Apply damage in TERRESTRIAL battles - SEQUENTIAL PROCESSING
     * Each attacker attacks one-by-one
     * 1-kill detection: if total damage >= avg defender HP, apply all damage without splash
     */
    private static applyTerrestrialDamageSequential(slot: BattleSlot, waves: CombatWave[]): void {
        console.log(`  [TERRESTRIAL-SEQ] ========================================`);
        console.log(`  [TERRESTRIAL-SEQ] Processing ${waves.length} waves`);
        console.log(`  [TERRESTRIAL-SEQ] Initial defenders: ${slot.units.length} units`);

        let totalAttackerNum = 0;

        // Process each wave
        waves.forEach((wave, waveIndex) => {
            console.log(`\n  [WAVE ${waveIndex + 1}/${waves.length}] ═══════════════════════`);
            console.log(`  [WAVE ${waveIndex + 1}] ${wave.unitCount} attackers in this wave`);

            // Process each attacker in this wave sequentially
            wave.units.forEach((attacker, attackerIndexInWave) => {
                totalAttackerNum++;
                const attackerNum = totalAttackerNum;

                // Get current living defenders
                const livingDefenders = slot.units.filter(u => u.isAlive());
                if (livingDefenders.length === 0) {
                    console.log(`  [WAVE ${waveIndex + 1}] No living defenders remaining, stopping wave`);
                    return; // Exit this wave, no more defenders
                }

                // Calculate average armor and HP from CURRENT living defenders
                const avgArmor = livingDefenders.reduce((sum, u) => sum + u.getEffectiveStats().armor, 0) / livingDefenders.length;
                const avgDefenderHP = livingDefenders.reduce((sum, u) => sum + u.currentHP, 0) / livingDefenders.length;

                // Calculate attacker's damage
                const attackerName = attacker.name;
                const grossDamage = attacker.getEffectiveStats().damage;
                const netDamage = Math.max(0, grossDamage - avgArmor);

                if (netDamage === 0) {
                    console.log(`  [W${waveIndex + 1}-A${attackerIndexInWave + 1}] ${attackerName}: No damage (armor blocked all)`);
                    return;
                }

                // Detect 1-kill: total damage >= average defender HP
                const isOneKill = netDamage >= avgDefenderHP;

                if (isOneKill) {
                    // 1-KILL: Apply ALL damage to first defender, NO splash
                    const target = livingDefenders[0];
                    const targetHPBefore = target.currentHP;

                    target.takeDamage(netDamage);

                    const targetHPAfter = target.currentHP;
                    const killed = !target.isAlive();
                    const remainingAlive = slot.units.filter(u => u.isAlive()).length;

                    console.log(`  [W${waveIndex + 1}-A${attackerIndexInWave + 1}] ${attackerName} >> 1-KILL MODE`);
                    console.log(`    └─ Gross: ${grossDamage.toFixed(0)}, Armor: ${avgArmor.toFixed(0)}, Net: ${netDamage.toFixed(0)}`);
                    console.log(`    └─ Target HP: ${targetHPBefore.toFixed(0)} → ${targetHPAfter.toFixed(0)} ${killed ? '☠️ KILLED' : ''}`);
                    console.log(`    └─ Defenders alive: ${remainingAlive}/${slot.units.length}`);
                } else {
                    // NORMAL: Apply splash then direct
                    const accuracy = attacker.getEffectiveStats().accuracy / 100;
                    const directDamage = netDamage * accuracy;
                    const splashDamage = netDamage * (1 - accuracy);

                    // 1. Apply SPLASH to ALL currently living defenders
                    const splashPerUnit = splashDamage / livingDefenders.length;
                    if (splashDamage > 0) {
                        livingDefenders.forEach(u => u.takeDamage(splashPerUnit));
                    }

                    // 2. Find first living defender after splash (some may have died from splash)
                    const stillAlive = slot.units.filter(u => u.isAlive());
                    if (stillAlive.length === 0) {
                        console.log(`  [W${waveIndex + 1}-A${attackerIndexInWave + 1}] ${attackerName}: All defenders died from splash`);
                        return;
                    }

                    // 3. Apply DIRECT damage to first living defender
                    const target = stillAlive[0];
                    const targetHPBefore = target.currentHP;
                    target.takeDamage(directDamage);
                    const targetHPAfter = target.currentHP;
                    const killed = !target.isAlive();
                    const remainingAlive = slot.units.filter(u => u.isAlive()).length;

                    console.log(`  [W${waveIndex + 1}-A${attackerIndexInWave + 1}] ${attackerName} >> NORMAL (${(accuracy * 100).toFixed(0)}% acc)`);
                    console.log(`    ├─ Gross: ${grossDamage.toFixed(0)}, Armor: ${avgArmor.toFixed(0)}, Net: ${netDamage.toFixed(0)}`);
                    console.log(`    ├─ Direct: ${directDamage.toFixed(0)}, Splash: ${splashPerUnit.toFixed(1)}/u × ${livingDefenders.length}`);
                    console.log(`    ├─ Target HP: ${targetHPBefore.toFixed(0)} → ${targetHPAfter.toFixed(0)} ${killed ? '☠️ KILLED' : ''}`);
                    console.log(`    └─ Defenders alive: ${remainingAlive}/${slot.units.length}`);
                }
            });

            // Wave summary
            const aliveAfterWave = slot.units.filter(u => u.isAlive()).length;
            const killedInWave = slot.units.length - aliveAfterWave;
            console.log(`  [WAVE ${waveIndex + 1}] Wave complete. Alive: ${aliveAfterWave}, Total killed so far: ${killedInWave}`);
        });

        const finalAlive = slot.units.filter(u => u.isAlive()).length;
        const finalKilled = slot.units.length - finalAlive;
        console.log(`\n  [TERRESTRIAL-SEQ] ========================================`);
        console.log(`  [TERRESTRIAL-SEQ] ALL WAVES COMPLETE`);
        console.log(`  [TERRESTRIAL-SEQ] SUMMARY: ${finalKilled} killed, ${finalAlive} alive`);

        // Show HP distribution of survivors
        if (finalAlive > 0 && finalAlive <= 10) {
            const survivors = slot.units.filter(u => u.isAlive());
            console.log(`  [TERRESTRIAL-SEQ] Survivor HP: ${survivors.map(u => u.currentHP.toFixed(0)).join(', ')}`);
        }
    }

    /**
     * Apply damage in MARITIME battles
     * - Splash to all units
     * - Direct damage with LINEAR OVERFLOW (flows through units)
     */
    private static applyMaritimeDamage(
        slot: BattleSlot,
        info: { directDmg: number, splashDmg: number, numAttackers: number, avgDefenderHP: number }
    ): void {
        const livingUnits = slot.units.filter(u => u.isAlive());
        if (livingUnits.length === 0) return;

        // Apply Splash (Global Tax)
        const splashPerUnit = info.splashDmg / livingUnits.length;
        livingUnits.forEach(u => u.takeDamage(splashPerUnit));

        // Recalculate living units after splash (some may have died from splash alone)
        const livingAfterSplash = slot.units.filter(u => u.isAlive());
        if (livingAfterSplash.length === 0) return;

        // Apply Direct Damage with LINEAR OVERFLOW
        let remainingDirectDamage = info.directDmg;

        for (const unit of livingAfterSplash) {
            if (remainingDirectDamage <= 0) break;

            const damageToApply = Math.min(remainingDirectDamage, unit.currentHP);
            unit.takeDamage(damageToApply);
            remainingDirectDamage -= damageToApply;
            // Continue to next unit with remaining damage
        }
    }
}
