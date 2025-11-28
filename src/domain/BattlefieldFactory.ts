import { Battlefield } from './Battlefield';
import { BattleLine } from './BattleLine';
import { BattleSlot } from './BattleSlot';
import { BattlefieldConfiguration } from './BattlefieldConfiguration';
import { SlotFillingAlgorithm } from './SlotFillingAlgorithm';
import { BattleType, UnitType } from './enums';
import { Unit } from './Unit';
import lineasData from '../../data/lineas.json';

export class BattlefieldFactory {
    static createBattlefield(battleType: BattleType, level: number): Battlefield {
        const config = BattlefieldConfiguration.getConfiguration(battleType, level);

        const attackerLines = this.createLines(config, battleType);
        const defenderLines = this.createLines(config, battleType);

        return new Battlefield(battleType, level, attackerLines, defenderLines);
    }

    private static createLines(config: any, battleType: BattleType): Map<UnitType, BattleLine> {
        const lines = new Map<UnitType, BattleLine>();

        lineasData.lineas.forEach((lineData: any) => {
            const lineType = this.mapStringToUnitType(lineData.nombre);
            const slotConfig = config[lineType];

            if (slotConfig) {
                const slots: BattleSlot[] = [];
                for (let i = 0; i < slotConfig['num-huecos']; i++) {
                    slots.push(new BattleSlot(slotConfig['tamano-por-hueco']));
                }

                const attackPriorities = lineData['prioridad-ataque'].map((s: string) => this.mapStringToUnitType(s));

                const positionPrioritiesKey = battleType === BattleType.Terrestrial
                    ? 'prioridad-posicion-terrestre'
                    : 'prioridad-posicion-maritima';

                const positionPriorities = lineData[positionPrioritiesKey];

                lines.set(lineType, new BattleLine(
                    lineType,
                    slots,
                    lineData['orden-ataque'],
                    attackPriorities,
                    positionPriorities
                ));
            }
        });

        return lines;
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

    static distributeUnits(battlefield: Battlefield, attackerUnits: Unit[], defenderUnits: Unit[]): void {
        this.distributeSide(battlefield.attackerLines, attackerUnits);
        this.distributeSide(battlefield.defenderLines, defenderUnits);
    }

    static createBattlefieldWithUnits(
        battleType: BattleType,
        level: number,
        attackerUnits: Unit[],
        defenderUnits: Unit[]
    ): Battlefield {
        const battlefield = this.createBattlefield(battleType, level);
        this.distributeUnits(battlefield, attackerUnits, defenderUnits);
        return battlefield;
    }

    private static distributeSide(lines: Map<UnitType, BattleLine>, units: Unit[]): void {
        // Group units by their target line type
        const unitsByLine = new Map<UnitType, Unit[]>();

        units.forEach(unit => {
            // Map unit type to line type (usually same, but good to be explicit)
            // In our enum they are the same
            const lineType = unit.type;
            if (!unitsByLine.has(lineType)) {
                unitsByLine.set(lineType, []);
            }
            unitsByLine.get(lineType)?.push(unit);
        });

        // Distribute for each line
        lines.forEach((line, lineType) => {
            const lineUnits = unitsByLine.get(lineType) || [];
            SlotFillingAlgorithm.fill(line, lineUnits);
        });
    }
}
