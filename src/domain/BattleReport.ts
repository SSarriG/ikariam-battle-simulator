import { Winner } from './enums';
import { Unit } from './Unit';

export interface UnitStatus {
    unitId: string;
    name: string;
    initialHP: number;
    currentHP: number;
    isAlive: boolean;
    damageDealt: number;
    damageTaken: number;
    kills: number;
}

export interface AttackEvent {
    round: number;
    attackerUnitId: string;
    attackerName: string;
    targetUnitId: string;
    targetName: string;
    damageDealt: number;
    targetKilled: boolean;
}

export interface RoundReport {
    roundNumber: number;
    attackEvents: AttackEvent[];
    attackerUnitsAlive: number;
    defenderUnitsAlive: number;
}

export interface BattleReport {
    battleId: string;
    winner: Winner;
    totalRounds: number;
    rounds: RoundReport[];
    attackerUnits: UnitStatus[];
    defenderUnits: UnitStatus[];
    attackerTotalDamage: number;
    defenderTotalDamage: number;
    attackerUnitsLost: number;
    defenderUnitsLost: number;
}
