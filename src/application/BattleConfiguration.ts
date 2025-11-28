import { BattleType } from '../domain/enums';

export interface UnitInput {
    name: string;
    quantity: number;
    upgradeLevel: number;
}

export interface SideConfiguration {
    units: UnitInput[];
    hephaestusLevel: number;
}

export interface BattleConfiguration {
    battleType: BattleType;
    level1: number;
    level2: number;
    attacker: SideConfiguration;
    defender: SideConfiguration;
}
