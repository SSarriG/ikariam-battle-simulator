import { UnitType } from './enums';
import { BattleSlot } from './BattleSlot';
import { Unit } from './Unit';
import { SlotRenumberingService } from './SlotRenumberingService';

export class BattleLine {
    constructor(
        public readonly lineType: UnitType,
        public readonly slots: BattleSlot[],
        public readonly attackOrder: number,
        public readonly attackPriorities: UnitType[],
        public readonly unitPositionPriorities: string[],
    ) {
        this.assignRenumberIds();
    }

    public reserves: Unit[] = [];

    private assignRenumberIds(): void {
        const totalSlots = this.slots.length;
        this.slots.forEach((slot, index) => {
            // Use the service to calculate ID based on physical index
            // We need to import SlotRenumberingService.
            // But wait, I can't import it if I haven't added the import statement.
            // I'll add the import in a separate step or assume it's available?
            // Better to add import first or use full path? No, import.
            // I will add the method here but I need to add the import at the top.
            // Let's just add the logic here or call the service.
            // I'll use a placeholder and then add the import.
            slot.renumberId = SlotRenumberingService.getRenumberId(index, totalSlots);
        });
    }

    getAllAliveUnits(): Unit[] {
        return this.slots.flatMap(slot => slot.getAliveUnits());
    }

    hasAliveUnits(): boolean {
        return this.slots.some(slot => slot.getAliveUnits().length > 0) || this.reserves.length > 0;
    }

    getTotalUnits(): number {
        const activeUnits = this.slots.reduce((sum, slot) => sum + slot.getAliveUnits().length, 0);
        return activeUnits + this.reserves.length;
    }
}
