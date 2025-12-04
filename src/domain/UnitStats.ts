export class UnitStats {
    constructor(
        public readonly baseHP: number,
        public readonly baseArmor: number,
        public readonly baseDamage: number,
        public readonly accuracy: number,
        public readonly size: number,
        public readonly ammunition: number | null,
        public readonly generalsCost: number
    ) { }
}
