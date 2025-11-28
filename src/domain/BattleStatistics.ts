import { AttackEvent, UnitStatus } from './BattleReport';
import { Unit } from './Unit';

export class BattleStatistics {
    private unitStatusMap: Map<string, UnitStatus> = new Map();
    private unitSideMap: Map<string, 'attacker' | 'defender'> = new Map();
    private attackEvents: AttackEvent[] = [];

    recordInitialUnit(unit: Unit, side: 'attacker' | 'defender'): void {
        const status: UnitStatus = {
            unitId: unit.id,
            name: unit.name,
            initialHP: unit.currentHP,
            currentHP: unit.currentHP,
            isAlive: unit.isAlive(),
            damageDealt: 0,
            damageTaken: 0,
            kills: 0,
        };
        this.unitStatusMap.set(unit.id, status);
        this.unitSideMap.set(unit.id, side);
    }

    recordAttack(round: number, attacker: Unit, target: Unit, damage: number, killed: boolean): void {
        const event: AttackEvent = {
            round,
            attackerUnitId: attacker.id,
            attackerName: attacker.name,
            targetUnitId: target.id,
            targetName: target.name,
            damageDealt: damage,
            targetKilled: killed,
        };
        this.attackEvents.push(event);

        // Update attacker stats
        const attackerStatus = this.unitStatusMap.get(attacker.id);
        if (attackerStatus) {
            attackerStatus.damageDealt += damage;
            if (killed) {
                attackerStatus.kills++;
            }
        }

        // Update target stats
        // Note: We don't update currentHP/isAlive here anymore because damage is queued.
        // We rely on updateUnitStatus being called after damage application.
        const targetStatus = this.unitStatusMap.get(target.id);
        if (targetStatus) {
            targetStatus.damageTaken += damage;
        }
    }

    updateUnitStatus(unit: Unit): void {
        const status = this.unitStatusMap.get(unit.id);
        if (status) {
            status.currentHP = unit.currentHP;
            status.isAlive = unit.isAlive();
        }
    }

    getUnitStatus(unitId: string): UnitStatus | undefined {
        return this.unitStatusMap.get(unitId);
    }

    getAllUnitStatuses(): UnitStatus[] {
        return Array.from(this.unitStatusMap.values());
    }

    getAttackEvents(): AttackEvent[] {
        return this.attackEvents;
    }

    getAttackEventsForRound(round: number): AttackEvent[] {
        return this.attackEvents.filter(e => e.round === round);
    }

    getTotalDamageDealt(unitIds: string[]): number {
        return unitIds.reduce((total, id) => {
            const status = this.unitStatusMap.get(id);
            return total + (status?.damageDealt || 0);
        }, 0);
    }

    getUnitsLost(unitIds: string[]): number {
        return unitIds.filter(id => {
            const status = this.unitStatusMap.get(id);
            return status && !status.isAlive;
        }).length;
    }

    getUnitStatusesBySide(side: 'attacker' | 'defender'): UnitStatus[] {
        const statuses: UnitStatus[] = [];
        this.unitSideMap.forEach((unitSide, unitId) => {
            if (unitSide === side) {
                const status = this.unitStatusMap.get(unitId);
                if (status) {
                    statuses.push(status);
                }
            }
        });
        return statuses;
    }
}
