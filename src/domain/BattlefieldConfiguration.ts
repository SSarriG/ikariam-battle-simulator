import camposData from '../../data/campos.json';
import { BattleType, UnitType } from './enums';

interface SlotConfig {
    'num-huecos': number;
    'tamano-por-hueco': number;
}

interface LevelConfig {
    'nivel-min-ciudad'?: number;
    'nivel-max-ciudad'?: number;
    'nivel-min-puerto'?: number;
    'nivel-max-puerto'?: number;
    'unidades': Record<string, SlotConfig>;
}

export class BattlefieldConfiguration {
    static getConfiguration(battleType: BattleType, level: number): Record<UnitType, SlotConfig> {
        let configData: LevelConfig[] = [];

        if (battleType === BattleType.Terrestrial) {
            configData = camposData.terrestre;
        } else {
            configData = camposData.maritima;
        }

        const config = configData.find(c => {
            const min = c['nivel-min-ciudad'] || c['nivel-min-puerto'] || 0;
            const max = c['nivel-max-ciudad'] || c['nivel-max-puerto'] || 100;
            return level >= min && level <= max;
        });

        if (!config) {
            throw new Error(`No configuration found for ${battleType} level ${level}`);
        }

        const result: Partial<Record<UnitType, SlotConfig>> = {};

        // Map string keys to UnitType enum
        Object.entries(config.unidades).forEach(([key, value]) => {
            const unitType = this.mapStringToUnitType(key);
            result[unitType] = value;
        });

        return result as Record<UnitType, SlotConfig>;
    }

    private static mapStringToUnitType(key: string): UnitType {
        switch (key) {
            case 'primera-linea': return UnitType.FirstLine;
            case 'luchadores-distancia': return UnitType.Ranged;
            case 'flancos': return UnitType.Flank;
            case 'artilleria': return UnitType.Artillery;
            case 'bombarderos': return UnitType.Bomber;
            case 'anti-aerea': return UnitType.AntiAir;
            default: throw new Error(`Unknown unit type key: ${key}`);
        }
    }
}
