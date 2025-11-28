import { Unit } from './Unit';

export class UnitGroup {
    public units: Unit[] = [];

    constructor(
        public readonly unitName: string,
        public readonly upgradeLevel: number,
        public quantity: number
    ) { }

    getId(): string {
        return `${this.unitName}_upgrade${this.upgradeLevel}`;
    }
}
