import { BattleLine } from './BattleLine';
import { BattleType, UnitType } from './enums';
import { Unit } from './Unit';

export class Battlefield {
    constructor(
        public readonly battleType: BattleType,
        public readonly level: number,
        public readonly attackerLines: Map<UnitType, BattleLine>,
        public readonly defenderLines: Map<UnitType, BattleLine>,
    ) { }

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
}
