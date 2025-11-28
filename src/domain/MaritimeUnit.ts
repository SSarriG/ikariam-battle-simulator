import { Unit } from './Unit';
import { BattleType, UnitType } from './enums';
import { UnitStats } from './UnitStats';

export class MaritimeUnit extends Unit {
    constructor(
        id: string,
        name: string,
        type: UnitType,
        stats: UnitStats,
        upgradeLevel: number = 0
    ) {
        super(id, name, type, BattleType.Maritime, stats, upgradeLevel);
    }
}
