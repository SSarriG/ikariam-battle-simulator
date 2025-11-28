import { Unit } from './Unit';

export class BattleSlot {
    private _units: Unit[] = [];

    public renumberId: number = 0;
    public deadUnitsThisRound: Unit[] = []; // Track actual dead units

    constructor(public capacity: number) { }

    get units(): Unit[] {
        return [...this._units];
    }

    get remainingCapacity(): number {
        const currentSize = this.getTotalSize();
        return this.capacity - currentSize;
    }

    addUnit(unit: Unit): boolean {
        if (unit.stats.size <= this.remainingCapacity) {
            this._units.push(unit);
            return true;
        }
        return false;
    }

    removeDeadUnits(): Unit[] {
        const deadUnits = this._units.filter(u => !u.isAlive());
        // Accumulate dead units instead of replacing (for sequential combat)
        this.deadUnitsThisRound.push(...deadUnits);
        this._units = this._units.filter(u => u.isAlive());
        return deadUnits;
    }

    getAliveUnits(): Unit[] {
        return this._units.filter(u => u.isAlive());
    }

    getTotalSize(): number {
        return this._units.reduce((sum, unit) => sum + unit.stats.size, 0);
    }

    isEmpty(): boolean {
        return this._units.length === 0;
    }

    /**
     * Clear round statistics (should be called at start of each round)
     */
    clearRoundStats(): void {
        this.deadUnitsThisRound = [];
    }

    /**
     * Replace all units in this slot with a new set
     * Used for slot redistribution
     */
    replaceUnits(units: Unit[]): void {
        this._units = [...units];
    }

    /**
     * Clear all units from this slot
     */
    clearUnits(): void {
        this._units = [];
    }
}
