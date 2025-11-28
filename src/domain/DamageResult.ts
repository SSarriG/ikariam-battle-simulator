export class DamageResult {
    constructor(
        public readonly initialHP: number,
        public readonly finalHP: number,
        public readonly damageReceived: number,
        public readonly unitKilled: boolean,
        public readonly overkillDamage: number,
    ) { }
}
