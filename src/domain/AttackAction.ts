import { Unit } from './Unit';

export class AttackAction {
    constructor(
        public readonly attacker: Unit,
        public readonly defender: Unit,
        public readonly damage: number,
        public readonly killed: boolean,
        public readonly overkillDamage: number,
    ) { }
}
