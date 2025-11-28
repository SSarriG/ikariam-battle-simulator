import { BattleConfiguration } from './BattleConfiguration';
import { BattleReport } from '../domain/BattleReport';
import { BattlefieldFactory } from '../domain/BattlefieldFactory';
import { UnitFactory } from '../domain/UnitFactory';
import { CombatEngine } from '../domain/CombatEngine';
import { Unit } from '../domain/Unit';
import { BattleStatus } from '../domain/enums';

export class StepBattleSimulationUseCase {
    private combatEngine: CombatEngine | null = null;
    private config: BattleConfiguration | null = null;

    /**
     * Initialize a new battle in step-by-step mode
     */
    startBattle(config: BattleConfiguration): void {
        this.config = config;

        // Create units for attacker
        const attackerUnits: Unit[] = [];
        config.attacker.units.forEach(unitInput => {
            for (let i = 0; i < unitInput.quantity; i++) {
                const unit = UnitFactory.createUnit(
                    unitInput.name,
                    `attacker-${unitInput.name}-${i}`
                );
                unit.upgradeLevel = unitInput.upgradeLevel;
                unit.hephaestusLevel = config.attacker.hephaestusLevel;
                attackerUnits.push(unit);
            }
        });

        // Create units for defender
        const defenderUnits: Unit[] = [];
        config.defender.units.forEach(unitInput => {
            for (let i = 0; i < unitInput.quantity; i++) {
                const unit = UnitFactory.createUnit(
                    unitInput.name,
                    `defender-${unitInput.name}-${i}`
                );
                unit.upgradeLevel = unitInput.upgradeLevel;
                unit.hephaestusLevel = config.defender.hephaestusLevel;
                defenderUnits.push(unit);
            }
        });

        // Create battlefield with units
        const battlefield = BattlefieldFactory.createBattlefieldWithUnits(
            config.battleType,
            config.level1,
            config.level2,
            attackerUnits,
            defenderUnits
        );

        // Initialize combat engine
        this.combatEngine = new CombatEngine(battlefield);
    }

    /**
     * Execute the next round
     * Returns info about current state
     */
    nextRound(): { completed: boolean; currentRound: number; status: string; report: BattleReport } {
        if (!this.combatEngine) {
            throw new Error('Battle not started. Call startBattle() first.');
        }

        const result = this.combatEngine.executeNextRound();

        return {
            completed: result.completed,
            currentRound: this.combatEngine.getCurrentRound(),
            status: this.getStatusString(this.combatEngine.getStatus()),
            report: result.report
        };
    }

    /**
     * Get current battlefield state for UI updates
     */
    getBattlefield() {
        if (!this.combatEngine) {
            throw new Error('Battle not started. Call startBattle() first.');
        }
        return this.combatEngine.getBattlefield();
    }

    /**
     * Get current round number
     */
    getCurrentRound(): number {
        if (!this.combatEngine) {
            return 0;
        }
        return this.combatEngine.getCurrentRound();
    }

    /**
     * Get current battle report (partial or final)
     * NOTE: This should NOT execute a round. 
     * But CombatEngine doesn't store the report unless we execute.
     * So we rely on nextRound() returning the report.
     */
    // getReport(): BattleReport | null {
    //     if (!this.combatEngine) {
    //         return null;
    //     }
    //     return this.combatEngine.executeNextRound().report; // SIDE EFFECT! BAD!
    // }

    /**
     * Reset the battle state
     */
    reset(): void {
        this.combatEngine = null;
        this.config = null;
    }

    /**
     * Check if battle is initialized
     */
    isInitialized(): boolean {
        return this.combatEngine !== null;
    }

    private getStatusString(status: BattleStatus): string {
        return status === BattleStatus.Active ? 'Active' : 'Finished';
    }
}
