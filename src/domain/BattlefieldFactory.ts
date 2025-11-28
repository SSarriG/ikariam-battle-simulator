import { Battlefield } from './Battlefield';
import { BattleLine } from './BattleLine';
import { BattleSlot } from './BattleSlot';
import { BattlefieldConfiguration } from './BattlefieldConfiguration';
import { SlotFillingAlgorithm } from './SlotFillingAlgorithm';
import { BattleType, UnitType } from './enums';
import { Unit } from './Unit';
import lineasData from '../../data/lineas.json';
import { WallService } from './WallService';
import { WallUnit } from './WallUnit';
import { GarrisonLimitService } from './GarrisonLimitService';
import { UnitStats } from './UnitStats';

export class BattlefieldFactory {
    static createBattlefield(battleType: BattleType, level1: number, level2: number): Battlefield {
        const config = BattlefieldConfiguration.getConfiguration(battleType, level1);

        const attackerLines = this.createLines(config, battleType);
        const defenderLines = this.createLines(config, battleType);

        const battlefield = new Battlefield(battleType, level1, attackerLines, defenderLines);

        // Calculate and set garrison limit
        battlefield.garrisonLimit = GarrisonLimitService.calculateLimit(battleType, level1, level2);

        // Add walls if terrestrial and wall level > 0
        if (battleType === BattleType.Terrestrial && level2 > 0) {
            this.addWalls(battlefield, level2);
        }

        return battlefield;
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
        level1: number,
        level2: number,
        attackerUnits: Unit[],
        defenderUnits: Unit[]
    ): Battlefield {
        const battlefield = this.createBattlefield(battleType, level1, level2);
        this.distributeUnits(battlefield, attackerUnits, defenderUnits);
        return battlefield;
    }

    private static distributeSide(lines: Map<UnitType, BattleLine>, units: Unit[]): void {
        // Phase 1: Fill slots with shared pool
        // We iterate through lines in the order they were created (which matches lineas.json order)
        // This ensures Front Line is filled first, then Ranged, etc.
        let availableUnits = [...units];

        lines.forEach((line) => {
            // Try to fill slots with ANY available unit that matches the line's priorities
            // Pass false to handleReserves so we get back unused units
            availableUnits = SlotFillingAlgorithm.fill(line, availableUnits, false);
        });

        // Phase 2: Distribute remaining units to native reserves
        if (availableUnits.length > 0) {
            console.log(`[BattlefieldFactory] Distributing ${availableUnits.length} remaining units to reserves.`);
            availableUnits.forEach(unit => {
                const lineType = unit.type;
                const line = lines.get(lineType);
                if (line) {
                    unit.sendToReserve();
                    line.reserves.push(unit);
                } else {
                    console.warn(`[BattlefieldFactory] Unit ${unit.name} has unknown type ${lineType}. Cannot add to reserves.`);
                }
            });
        }
    }

    private static addWalls(battlefield: Battlefield, wallLevel: number): void {
        const baseStats = WallService.getStats(wallLevel);
        if (!baseStats) {
            console.warn(`No stats found for Wall Level ${wallLevel}`);
            return;
        }
        const wallCount = 7; // Fixed number of slots in first line

        const firstLine = battlefield.defenderLines.get(UnitType.FirstLine);
        if (!firstLine) return;

        for (let i = 0; i < wallCount && i < firstLine.slots.length; i++) {
            const slot = firstLine.slots[i];

            // Create a new UnitStats instance with size = slot.capacity to ensure it fills the slot
            const wallStats = new UnitStats(
                baseStats.baseHP,
                baseStats.baseArmor,
                baseStats.baseDamage,
                baseStats.accuracy,
                slot.capacity, // Force size to fill slot
                baseStats.ammunition,
                baseStats.generalsCost,
                baseStats.upgradeDamage,
                baseStats.upgradeArmor
            );

            const wall = new WallUnit(`wall-${i}`, wallStats, wallLevel);

            // Check if slot has units and move them to reserves
            if (slot.units.length > 0) {
                firstLine.reserves.push(...slot.units);
                slot.replaceUnits([]);
            }

            slot.addUnit(wall);
        }
    }
}
