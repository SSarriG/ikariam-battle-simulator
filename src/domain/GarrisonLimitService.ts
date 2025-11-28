import { BattleType } from './enums';

export class GarrisonLimitService {
    static calculateLimit(battleType: BattleType, level1: number, level2: number = 0): number {
        if (battleType === BattleType.Maritime) {
            // Maritime: 125 + (HighestPortLevel * 25)
            // level1 is Port Level
            return 125 + (level1 * 25);
        } else {
            // Terrestrial: (WallLevel + TownHallLevel) * 50 + 250
            // level1 is Town Hall Level, level2 is Wall Level
            return (level1 + level2) * 50 + 250;
        }
    }
}
