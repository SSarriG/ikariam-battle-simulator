import { BattleLine } from './BattleLine';
import { BattleSlot } from './BattleSlot';
import { Unit } from './Unit';

export class AttackingMatrix {
    // Matrix: rows = max units per slot (n), cols = number of slots (m)
    // matrix[i][j] contains the Unit at that position
    private matrix: (Unit | null)[][];
    public readonly rows: number;
    public readonly cols: number;

    constructor(line: BattleLine) {
        this.cols = line.slots.length;
        // Determine max units in any slot to define rows (n)
        // Or should it be the max capacity of the slot type? 
        // Usually capacity is uniform for a line.
        // Let's assume uniform capacity for now.
        const maxCapacity = line.slots.length > 0 ? line.slots[0].capacity : 0;
        this.rows = maxCapacity;

        this.matrix = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
        this.buildMatrix(line);
    }

    private buildMatrix(line: BattleLine): void {
        line.slots.forEach((slot, colIndex) => {
            const units = slot.getAliveUnits(); // Or all units? Am theory usually considers alive units.
            units.forEach((unit, rowIndex) => {
                if (rowIndex < this.rows) {
                    this.matrix[rowIndex][colIndex] = unit;
                }
            });
        });
    }

    getUnitAt(row: number, col: number): Unit | null {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.matrix[row][col];
        }
        return null;
    }

    /**
     * Get target slot index for a unit at given row
     * Formula: target_slot = row % cols
     * This implements the Am Theory: row i attacks slot j where j ≡ i (mod m)
     */
    getTargetSlotForRow(rowIndex: number): number {
        return rowIndex % this.cols;
    }

    /**
     * Get all attacking units that target a specific slot
     * Returns units from all rows where row % cols === targetSlot
     */
    getAttackingUnitsForSlot(targetSlot: number): Unit[] {
        const attackers: Unit[] = [];

        for (let row = 0; row < this.rows; row++) {
            if (this.getTargetSlotForRow(row) === targetSlot) {
                for (let col = 0; col < this.cols; col++) {
                    const unit = this.matrix[row][col];
                    if (unit) {
                        attackers.push(unit);
                    }
                }
            }
        }

        return attackers;
    }

    /**
     * Get all alive units in the matrix
     */
    getAllAliveUnits(): Unit[] {
        const units: Unit[] = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const unit = this.matrix[row][col];
                if (unit && unit.isAlive()) {
                    units.push(unit);
                }
            }
        }
        return units;
    }
}
