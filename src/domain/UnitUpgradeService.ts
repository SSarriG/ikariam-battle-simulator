import { Unit } from './Unit';

export class UnitUpgradeService {
    static applyUpgrade(unit: Unit, level: number): void {
        unit.upgradeLevel = level;
    }
}
