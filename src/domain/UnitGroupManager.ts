import { Unit } from './Unit';
import { UnitGroup } from './UnitGroup';
import { UnitType } from './enums';
import { UnitFactory } from './UnitFactory';

export class UnitGroupManager {
    private groups: Map<string, UnitGroup> = new Map();

    addGroup(unitName: string, upgradeLevel: number, quantity: number): void {
        const groupId = `${unitName}_upgrade${upgradeLevel}`;

        if (this.groups.has(groupId)) {
            this.groups.get(groupId)!.quantity += quantity;
        } else {
            this.groups.set(groupId, new UnitGroup(unitName, upgradeLevel, quantity));
        }
    }

    instantiateUnits(unitFactory: typeof UnitFactory): void {
        for (const group of this.groups.values()) {
            group.units = [];
            for (let i = 0; i < group.quantity; i++) {
                // Generate a unique ID for each unit, e.g., "hoplita_upgrade0_1"
                const unitId = `${group.getId()}_${i + 1}`;
                const unit = unitFactory.createUnit(group.unitName, unitId, group.upgradeLevel);
                group.units.push(unit);
            }
        }
    }

    getAllUnits(): Unit[] {
        const allUnits: Unit[] = [];
        for (const group of this.groups.values()) {
            allUnits.push(...group.units);
        }
        return allUnits;
    }

    getGroupsByName(unitName: string): UnitGroup[] {
        return Array.from(this.groups.values()).filter(g => g.unitName === unitName);
    }

    get groupsMap(): Map<string, UnitGroup> {
        return this.groups;
    }
}
