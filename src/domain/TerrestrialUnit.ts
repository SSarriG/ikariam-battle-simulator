import { Unit } from './Unit';
import { BattleType, UnitType } from './enums';
import { UnitStats } from './UnitStats';

export class TerrestrialUnit extends Unit {
    constructor(
        id: string,
        name: string,
        type: UnitType,
        stats: UnitStats,
        upgradeLevelAttack: number = 0,
        upgradeLevelDefense: number = 0
    ) {
        super(id, name, type, BattleType.Terrestrial, stats, upgradeLevelAttack, upgradeLevelDefense);
    }
}
