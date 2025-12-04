import { Battlefield } from './Battlefield';
import { BattleStatistics } from './BattleStatistics';
import { BattleReport, RoundReport, AttackEvent } from './BattleReport';
import { AttackSequencer } from './AttackSequencer';
import { TargetSelector } from './TargetSelector';
import { DamageCalculator } from './DamageCalculator';
import { AmmunitionManager } from './AmmunitionManager';
import { ReserveRedistributionService } from './ReserveRedistributionService';
import { VirtualCombatState } from './VirtualCombatState';
import { SlotRefillService } from './SlotRefillService';
import { SlotRedistributionService } from './SlotRedistributionService';
import { ImmediateRedistributionService } from './ImmediateRedistributionService';
import { AccuracyFilter } from './AccuracyFilter';
import { DamageQueue } from './DamageQueue';
import { SlotFillingAlgorithm } from './SlotFillingAlgorithm';
import { BattleStatus, Winner, UnitType } from './enums';
import { Unit } from './Unit';
import { FieldSizeService } from './FieldSizeService';
import { BattlefieldConfiguration } from './BattlefieldConfiguration';
import { BattleSlot } from './BattleSlot';
import { BattleLine } from './BattleLine';
import { HealthEqualizer } from './HealthEqualizer';
import { MatrixCombatSystem } from './MatrixCombatSystem';

export class CombatEngine {
    private battlefield: Battlefield;
    private statistics: BattleStatistics;
    private currentRound: number = 0;
    private maxRounds: number = 60; // Standard Ikariam limit
    private status: BattleStatus = BattleStatus.Active;
    private damageQueue: DamageQueue = new DamageQueue(); // For simultaneous damage

    constructor(battlefield: Battlefield) {
        this.battlefield = battlefield;
        this.statistics = new BattleStatistics();
        this.initializeStatistics();
        this.resizeBattlefield();
    }

    private initializeStatistics(): void {
        // Record all initial units
        this.battlefield.attackerLines.forEach(line => {
            line.getAllAliveUnits().forEach(unit => {
                this.statistics.recordInitialUnit(unit, 'attacker');
            });
        });

        this.battlefield.defenderLines.forEach(line => {
            line.getAllAliveUnits().forEach(unit => {
                this.statistics.recordInitialUnit(unit, 'defender');
            });
        });
    }

    runBattle(): BattleReport {
        while (this.status === BattleStatus.Active && this.currentRound < this.maxRounds) {
            this.currentRound++;
            this.processRound();
            this.checkVictoryConditions();
        }

        return this.generateReport();
    }

    /**
     * Execute a single round of combat
     * Returns true if battle is complete, false if more rounds remain
     */
    executeNextRound(): { completed: boolean; report: BattleReport } {
        if (this.status !== BattleStatus.Active || this.currentRound >= this.maxRounds) {
            return { completed: true, report: this.generateReport() };
        }

        this.currentRound++;
        this.processRound();
        this.checkVictoryConditions();

        const completed = this.status !== BattleStatus.Active || this.currentRound >= this.maxRounds;
        return {
            completed,
            report: this.generateReport() // Always return a report (partial or final)
        };
    }

    /**
     * Get current round number
     */
    getCurrentRound(): number {
        return this.currentRound;
    }

    /**
     * Get current battle status
     */
    getStatus(): BattleStatus {
        return this.status;
    }

    /**
     * Get battlefield for UI updates
     */
    getBattlefield(): Battlefield {
        return this.battlefield;
    }

    private processRound(): void {
        // Check for battlefield resizing (Garrison Limit)
        this.resizeBattlefield();

        // Clear round statistics from previous round
        const clearStats = (line: any) => {
            line.slots.forEach((slot: any) => slot.clearRoundStats());
        };
        this.battlefield.attackerLines.forEach(clearStats);
        this.battlefield.defenderLines.forEach(clearStats);

        // 1. Refill slots from reserves (new units enter the battle)
        this.refillSlotsFromReserves();

        // 2. Redistribute active units across all lines (priority-based)
        // This ensures priority lines are filled first
        this.redistributeActiveUnits();

        const attackOrder = AttackSequencer.getAttackOrder();

        // SEQUENTIAL LINE COMBAT:
        for (let i = 0; i < attackOrder.length; i++) {
            const lineType = attackOrder[i];
            const isLastLine = (i === attackOrder.length - 1);

            console.log(`\n=== Processing line: ${lineType} ===`);

            // Calculate attacker attacks for this line
            this.processLineAttacks('attacker', lineType, 'defender');

            // Calculate defender attacks for this line
            this.processLineAttacks('defender', lineType, 'attacker');

            // MatrixCombatSystem applies damage immediately, no need for damage queue

            // Update statistics to reflect new HP/Alive states immediately
            this.updateStatistics();

            // Remove dead units immediately so they don't participate in subsequent phases
            console.log(`Removing dead units after ${lineType} exchange...`);
            this.battlefield.removeDeadUnits();

            // Health Equalization AFTER each line exchange, EXCEPT the last one
            // This way the final round result shows unequal damage from the last attacking line
            if (!isLastLine) {
                console.log('[CombatEngine] Applying Health Equalization...');
                this.battlefield.attackerLines.forEach(line => HealthEqualizer.equalize(line));
                this.battlefield.defenderLines.forEach(line => HealthEqualizer.equalize(line));
            }
        }

        // Apply Slot-Redistribution (SR) after damage is applied but before units die
        // DISABLED: SR causes excessive damage dilution in mass battles (100+ units per slot)
        // TODO: Re-implement SR with scaling factor or unit count threshold
        // this.battlefield.attackerLines.forEach(line => SlotRedistributionService.applySR(line));
        // this.battlefield.defenderLines.forEach(line => SlotRedistributionService.applySR(line));

        // NOTE: Health equalization at end of round is now SKIPPED
        // It only happens after each line exchange except the last

        // Handle ammo depletion: Move empty units to reserves so they can be replaced
        // This happens at the end of the round to prepare for the next one
        this.handleAmmoDepletion();
    }

    private handleAmmoDepletion(): void {
        const checkLine = (line: any) => {
            line.slots.forEach((slot: any) => {
                // Find units that are marked as in reserve (due to ammo depletion)
                // but are still in the slot
                const currentUnits = slot.units;
                const depletedUnits = currentUnits.filter((u: any) => u.isInReserve() && u.isAlive());

                if (depletedUnits.length > 0) {
                    // Remove them from slot using replaceUnits (since units is a getter)
                    const remainingUnits = currentUnits.filter((u: any) => !u.isInReserve());
                    slot.replaceUnits(remainingUnits);

                    // Add to line reserves
                    line.reserves.push(...depletedUnits);
                }
            });
        };

        this.battlefield.attackerLines.forEach(checkLine);
        this.battlefield.defenderLines.forEach(checkLine);
    }

    private updateStatistics(): void {
        const updateLine = (line: any) => {
            line.slots.forEach((slot: any) => {
                slot.units.forEach((unit: any) => {
                    this.statistics.updateUnitStatus(unit);
                });
            });
        };

        this.battlefield.attackerLines.forEach(updateLine);
        this.battlefield.defenderLines.forEach(updateLine);
    }

    private applyReserveRedistribution(): void {
        // Apply RR to all lines on both sides
        this.battlefield.attackerLines.forEach(line => {
            ReserveRedistributionService.applyRR(line);
        });
        this.battlefield.defenderLines.forEach(line => {
            ReserveRedistributionService.applyRR(line);
        });
    }

    private refillSlotsFromReserves(): void {
        console.log('[CombatEngine] Refilling slots from reserves (Shared Pool)...');
        this.refillSide(this.battlefield.attackerLines);
        this.refillSide(this.battlefield.defenderLines);
    }

    private refillSide(lines: Map<UnitType, BattleLine>): void {
        // 1. Collect ALL reserves from ALL lines into a single pool
        let allReserves: any[] = [];
        lines.forEach(line => {
            if (line.reserves.length > 0) {
                allReserves.push(...line.reserves);
                line.reserves = []; // Clear reserves
            }
        });

        if (allReserves.length === 0) return;

        console.log(`[CombatEngine] Total reserves available: ${allReserves.length}`);

        // 2. Fill slots line by line using the shared pool
        // Iteration order of Map matches insertion order (lineas.json order), which is correct priority
        lines.forEach(line => {
            // Try to fill slots with ANY available reserve unit
            // Pass false to handleReserves so we get back unused units
            allReserves = SlotFillingAlgorithm.fill(line, allReserves, false);
        });

        // 3. Distribute remaining units back to their native reserves
        if (allReserves.length > 0) {
            console.log(`[CombatEngine] Returning ${allReserves.length} unused units to native reserves.`);
            allReserves.forEach(unit => {
                const lineType = unit.type;
                const line = lines.get(lineType);
                if (line) {
                    line.reserves.push(unit);
                } else {
                    console.warn(`[CombatEngine] Unit ${unit.name} has unknown type ${lineType}. Cannot return to reserve.`);
                }
            });
        }
    }

    private redistributeActiveUnits(): void {
        console.log('[CombatEngine] Redistributing active units across all lines...');
        this.redistributeActiveSide(this.battlefield.attackerLines);
        this.redistributeActiveSide(this.battlefield.defenderLines);
    }

    private redistributeActiveSide(lines: Map<UnitType, BattleLine>): void {
        // 1. Collect ALL active units from ALL slots (EXCEPT WallUnits)
        const allActiveUnits: Unit[] = [];

        lines.forEach(line => {
            line.slots.forEach(slot => {
                // Get all units from this slot
                const units = slot.units;
                // Filter out WallUnits - they should stay in their slots
                const nonWallUnits = units.filter(u => u.name !== 'Muro' && !u.name.startsWith('wall-'));
                allActiveUnits.push(...nonWallUnits);
            });
        });

        if (allActiveUnits.length === 0) return;

        console.log(`[CombatEngine] Collected ${allActiveUnits.length} active units for redistribution (excluding walls)`);

        // 2. Clear all slots BUT preserve WallUnits
        lines.forEach(line => {
            line.slots.forEach(slot => {
                const units = slot.units;
                // Keep only WallUnits
                const wallUnits = units.filter(u => u.name === 'Muro' || u.name.startsWith('wall-'));
                slot.replaceUnits(wallUnits);
            });
        });

        // 3. Redistribute units using priority-based filling
        // SlotFillingAlgorithm already checks for walls and skips those slots
        let remainingUnits = allActiveUnits;

        lines.forEach(line => {
            // Use SlotFillingAlgorithm to fill this line's slots
            remainingUnits = SlotFillingAlgorithm.fill(line, remainingUnits, false);
        });

        // 4. Any remaining units go to their native line reserves
        // (This should rarely happen, but just in case)
        if (remainingUnits.length > 0) {
            console.warn(`[CombatEngine] ${remainingUnits.length} active units could not be placed. Sending to reserves.`);
            remainingUnits.forEach(unit => {
                const lineType = unit.type;
                const line = lines.get(lineType);
                if (line) {
                    unit.sendToReserve();
                    line.reserves.push(unit);
                } else {
                    console.error(`[CombatEngine] Cannot find line for unit ${unit.name} of type ${lineType}`);
                }
            });
        }
    }

    private processLineAttacks(attackerSide: 'attacker' | 'defender', lineType: UnitType, enemySide: 'attacker' | 'defender'): void {
        const attackerLine = this.battlefield.getLine(attackerSide, lineType);
        const defenderLine = this.battlefield.getLine(enemySide, lineType);

        if (!attackerLine.hasAliveUnits()) {
            return;
        }

        if (!defenderLine.hasAliveUnits()) {
            return;
        }

        console.log(`[${attackerSide}] ${lineType} attacking ${lineType}...`);

        // Use Matrix Combat System
        MatrixCombatSystem.processPhase(attackerLine, defenderLine, this.battlefield.battleType);

        // Consume ammunition for all attackers
        // NOTE: Should ammunition consumption happen in MatrixCombatSystem?
        attackerLine.getAllAliveUnits().forEach(attacker => {
            if (attacker.canAttack()) {
                AmmunitionManager.consumeAmmunition(attacker);
            }
        });
    }

    private findUnitSlot(unit: Unit, side: 'attacker' | 'defender') {
        const lines = side === 'attacker' ? this.battlefield.attackerLines : this.battlefield.defenderLines;
        for (const line of lines.values()) {
            for (const slot of line.slots) {
                if (slot.units.some(u => u.id === unit.id)) {
                    return slot;
                }
            }
        }
        return null;
    }

    private checkVictoryConditions(): void {
        const attackerHasUnits = this.battlefield.hasAliveUnits('attacker');
        const defenderHasUnits = this.battlefield.hasAliveUnits('defender');

        if (!attackerHasUnits || !defenderHasUnits) {
            this.status = BattleStatus.Finished;
        }
    }

    private determineWinner(): Winner {
        const attackerHasUnits = this.battlefield.hasAliveUnits('attacker');
        const defenderHasUnits = this.battlefield.hasAliveUnits('defender');

        if (attackerHasUnits && !defenderHasUnits) {
            return Winner.Attacker;
        } else if (!attackerHasUnits && defenderHasUnits) {
            return Winner.Defender;
        } else {
            return Winner.Draw;
        }
    }

    private resizeBattlefield(): void {
        const defenderUnitsCount = this.countAliveUnits('defender');
        const isLimitExceeded = FieldSizeService.isGarrisonLimitExceeded(defenderUnitsCount, this.battlefield.garrisonLimit);

        // Always check on first run or if state changes
        if (this.currentRound === 0 || isLimitExceeded !== this.battlefield.isGarrisonLimitExceeded) {
            console.log(`Resizing battlefield. Limit Exceeded: ${isLimitExceeded} (Units: ${defenderUnitsCount}, Limit: ${this.battlefield.garrisonLimit})`);

            this.battlefield.isGarrisonLimitExceeded = isLimitExceeded;

            let targetLevel: number;

            if (isLimitExceeded) {
                this.battlefield.deactivateWalls();
                targetLevel = 50; // Force max size (Open Field)
            } else {
                this.battlefield.activateWalls();
                targetLevel = this.battlefield.effectiveLevel;
            }

            const newConfig = BattlefieldConfiguration.getConfiguration(this.battlefield.battleType, targetLevel);
            this.applyConfigToLines(newConfig);
        }
    }

    private countAliveUnits(side: 'attacker' | 'defender'): number {
        let count = 0;
        const lines = side === 'attacker' ? this.battlefield.attackerLines : this.battlefield.defenderLines;
        lines.forEach(line => {
            count += line.getAllAliveUnits().length;
            count += line.reserves.length;
        });
        return count;
    }

    private applyConfigToLines(config: Record<UnitType, any>): void {
        console.log('[CombatEngine] Applying new configuration to lines...');
        const updateLines = (lines: Map<UnitType, any>, side: string) => {
            lines.forEach((line, lineType) => {
                const slotConfig = config[lineType];
                if (!slotConfig) return;

                const newNumSlots = slotConfig['num-huecos'];
                const newCapacity = slotConfig['tamano-por-hueco'];

                console.log(`[CombatEngine] Resizing ${side} ${lineType}: Slots ${line.slots.length} -> ${newNumSlots}, Capacity -> ${newCapacity}`);

                // Update capacity for all existing slots
                line.slots.forEach((slot: any, index: number) => {
                    const oldCapacity = slot.capacity;
                    slot.capacity = newCapacity;

                    // If units exceed new capacity, move excess to reserves
                    // Note: slot.units returns a copy, so we must use replaceUnits to update the slot
                    const currentUnits = slot.units;
                    if (currentUnits.length > newCapacity) {
                        const excess = currentUnits.splice(newCapacity);
                        // Update slot with remaining units
                        slot.replaceUnits(currentUnits);

                        console.log(`[CombatEngine] Slot ${index} overflow: Moving ${excess.length} units to reserves.`);
                        line.reserves.push(...excess);
                    }
                });

                // Resize slots array
                if (line.slots.length < newNumSlots) {
                    // Add new slots
                    console.log(`[CombatEngine] Adding ${newNumSlots - line.slots.length} new slots to ${lineType}`);
                    for (let i = line.slots.length; i < newNumSlots; i++) {
                        line.slots.push(new BattleSlot(newCapacity));
                    }
                } else if (line.slots.length > newNumSlots) {
                    // Remove slots and move units to reserves
                    const removedSlots = line.slots.splice(newNumSlots);
                    console.log(`[CombatEngine] Removing ${removedSlots.length} slots from ${lineType}. Moving units to reserves.`);
                    removedSlots.forEach((slot: any) => {
                        if (slot.units.length > 0) {
                            console.log(`[CombatEngine] Moving ${slot.units.length} units from removed slot to reserves.`);
                            line.reserves.push(...slot.units);
                        }
                    });
                }
            });
        };

        updateLines(this.battlefield.attackerLines, 'attacker');
        updateLines(this.battlefield.defenderLines, 'defender');
    }

    private generateReport(): BattleReport {
        const winner = this.determineWinner();

        const attackerStatuses = this.statistics.getUnitStatusesBySide('attacker');
        const defenderStatuses = this.statistics.getUnitStatusesBySide('defender');

        const attackerUnitIds = attackerStatuses.map(s => s.unitId);
        const defenderUnitIds = defenderStatuses.map(s => s.unitId);

        // Generate round reports
        const rounds: RoundReport[] = [];
        for (let r = 1; r <= this.currentRound; r++) {
            const events = this.statistics.getAttackEventsForRound(r);
            rounds.push({
                roundNumber: r,
                attackEvents: events,
                attackerUnitsAlive: attackerStatuses.filter(s => s.isAlive).length,
                defenderUnitsAlive: defenderStatuses.filter(s => s.isAlive).length,
            });
        }

        return {
            battleId: `battle-${Date.now()}`,
            winner,
            totalRounds: this.currentRound,
            rounds,
            attackerUnits: attackerStatuses,
            defenderUnits: defenderStatuses,
            attackerTotalDamage: this.statistics.getTotalDamageDealt(attackerUnitIds),
            defenderTotalDamage: this.statistics.getTotalDamageDealt(defenderUnitIds),
            attackerUnitsLost: this.statistics.getUnitsLost(attackerUnitIds),
            defenderUnitsLost: this.statistics.getUnitsLost(defenderUnitIds),
        };
    }
}
