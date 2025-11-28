import { RedistributionType } from './enums';

export interface DamagePool {
    totalDamage: number;
    affectedUnits: number;
    damagePerUnit: number;
}

export interface RedistributionResult {
    type: RedistributionType;
    damagePool: DamagePool;
    unitsAffected: string[]; // Unit IDs
}
