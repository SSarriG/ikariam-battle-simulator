import { Unit } from './Unit';
import { UnitStats } from './UnitStats';
import { BattleType, UnitType } from './enums';

export class WallUnit extends Unit {
    constructor(id: string, stats: UnitStats, level: number) {
        super(
            id,
            'Muro',
            UnitType.FirstLine, // Wall acts as First Line
            BattleType.Terrestrial,
            stats,
            0 // No upgrades
        );
        // Wall specific properties if any
    }
}
