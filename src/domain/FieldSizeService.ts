import { BattleType } from './enums';
import camposData from '../../data/campos.json';

export class FieldSizeService {
    static getFieldSizeLevel(battleType: BattleType, level: number): number {
        // This method maps the building level to the field size index (0-4 for sizes 1-5)
        // Terrestrial: Town Hall Level
        // Maritime: Port Level

        let configData;
        if (battleType === BattleType.Terrestrial) {
            configData = camposData.terrestre;
            // Map Town Hall level to size index
            // Size 1: 1-4
            // Size 2: 5-9
            // Size 3: 10-16
            // Size 4: 17-24
            // Size 5: 25+
            if (level <= 4) return 0;
            if (level <= 9) return 1;
            if (level <= 16) return 2;
            if (level <= 24) return 3;
            return 4;
        } else {
            configData = camposData.maritima;
            // Map Port level to size index
            // Size 1: 0-7
            // Size 2: 8-14
            // Size 3: 15-21
            // Size 4: 22-28
            // Size 5: 29+
            if (level <= 7) return 0;
            if (level <= 14) return 1;
            if (level <= 21) return 2;
            if (level <= 28) return 3;
            return 4;
        }
    }

    static isGarrisonLimitExceeded(defenderUnitsCount: number, limit: number): boolean {
        return defenderUnitsCount > limit;
    }
}
