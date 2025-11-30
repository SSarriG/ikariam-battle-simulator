import { Unit } from './Unit';

export class UnitUpgradeService {
    static applyUpgrade(unit: Unit, attackLevel: number, defenseLevel: number): void {
        unit.upgradeLevelAttack = attackLevel;
        unit.upgradeLevelDefense = defenseLevel;
    }
}
