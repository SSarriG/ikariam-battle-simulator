import { Unit } from './Unit';

export class AmmunitionManager {
    static canAttack(unit: Unit): boolean {
        return unit.canAttack();
    }

    static consumeAmmunition(unit: Unit): void {
        unit.consumeAmmunition();
    }
}
