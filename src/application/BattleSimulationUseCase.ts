import { BattleConfiguration } from './BattleConfiguration';
import { BattleReport } from '../domain/BattleReport';
import { BattlefieldFactory } from '../domain/BattlefieldFactory';
import { UnitFactory } from '../domain/UnitFactory';
import { SlotFillingAlgorithm } from '../domain/SlotFillingAlgorithm';
import { CombatEngine } from '../domain/CombatEngine';
import { Unit } from '../domain/Unit';

export class BattleSimulationUseCase {
    execute(config: BattleConfiguration): BattleReport {
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
            config.level,
            attackerUnits,
            defenderUnits
        );

        // Run simulation
        const combatEngine = new CombatEngine(battlefield);
        const report = combatEngine.runBattle();

        return report;
    }
}
