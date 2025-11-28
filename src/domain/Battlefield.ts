import { BattleLine } from './BattleLine';
import { BattleType, UnitType } from './enums';
import { Unit } from './Unit';

export class Battlefield {
    public limboWalls: Unit[] = [];
    public garrisonLimit: number = 0;
    public isGarrisonLimitExceeded: boolean = false;
    public effectiveLevel: number = 0;

    constructor(
        public readonly battleType: BattleType,
        public readonly level: number,
        public readonly attackerLines: Map<UnitType, BattleLine>,
        public readonly defenderLines: Map<UnitType, BattleLine>,
    ) {
        this.effectiveLevel = level;
    }

    getLine(side: 'attacker' | 'defender', lineType: UnitType): BattleLine {
        const lines = side === 'attacker' ? this.attackerLines : this.defenderLines;
        const line = lines.get(lineType);
        if (!line) {
            throw new Error(`Line ${lineType} not found for ${side}`);
        }
        return line;
    }

    hasAliveUnits(side: 'attacker' | 'defender'): boolean {
        const lines = side === 'attacker' ? this.attackerLines : this.defenderLines;
        for (const line of lines.values()) {
            if (line.hasAliveUnits()) return true;
        }
        return false;
    }

    removeDeadUnits(): void {
        this.attackerLines.forEach(line => {
            line.slots.forEach(slot => slot.removeDeadUnits());
        });
        this.defenderLines.forEach(line => {
            line.slots.forEach(slot => slot.removeDeadUnits());
        });
    }

    getLines(side: 'attacker' | 'defender'): Map<UnitType, BattleLine> {
        return side === 'attacker' ? this.attackerLines : this.defenderLines;
    }

    activateWalls(): void {
        const firstLine = this.defenderLines.get(UnitType.FirstLine);
        if (!firstLine || this.limboWalls.length === 0) return;

        // Move walls from limbo to slots
        // This is a simplified version; real logic might need to displace units
        // But for now, we assume walls have absolute priority and we'll clear slots if needed
        // or rely on the fact that if we are activating walls, we are in Town mode,
        // so we should have space or the logic should handle it.

        // Actually, walls should be placed in the first N slots.
        // If there are units there, they should be moved to reserves?
        // Or maybe we just add them and let the redistribution logic handle it?
        // But walls are special.

        // Let's just put them in the slots for now.
        for (let i = 0; i < this.limboWalls.length && i < firstLine.slots.length; i++) {
            const wall = this.limboWalls[i];
            // Check if slot has units
            if (firstLine.slots[i].units.length > 0) {
                // Move existing units to reserves
                firstLine.reserves.push(...firstLine.slots[i].units);
                firstLine.slots[i].replaceUnits([]);
            }
            firstLine.slots[i].addUnit(wall);
        }
        this.limboWalls = [];
    }

    deactivateWalls(): void {
        const firstLine = this.defenderLines.get(UnitType.FirstLine);
        if (!firstLine) return;

        firstLine.slots.forEach(slot => {
            const walls = slot.units.filter(u => u.name === 'Muro');
            if (walls.length > 0) {
                this.limboWalls.push(...walls);
                // Remove walls from slot
                const remaining = slot.units.filter(u => u.name !== 'Muro');
                slot.replaceUnits(remaining);
            }
        });
    }
}
