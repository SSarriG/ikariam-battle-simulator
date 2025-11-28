import { UnitType } from './enums';

export class AttackSequencer {
    static getAttackOrder(): UnitType[] {
        // Order defined in guidelines:
        // 1. Anti-Air
        // 2. Bombers
        // 3. Artillery
        // 4. Ranged
        // 5. First Line
        // 6. Flanks
        return [
            UnitType.AntiAir,
            UnitType.Bomber,
            UnitType.Artillery,
            UnitType.Ranged,
            UnitType.FirstLine,
            UnitType.Flank,
        ];
    }
}
