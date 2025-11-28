import { BattleType, UnitType } from './enums';
import { UnitStats } from './UnitStats';
import { HephaestusService } from './HephaestusService';

export abstract class Unit {
    protected _currentHP: number;
    protected _currentAmmunition: number | null;
    protected _upgradeLevel: number = 0;
    protected _hephaestusLevel: number = 0;
    protected _inReserve: boolean = false;

    public readonly groupId: string;

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly type: UnitType,
        public readonly battleType: BattleType,
        public readonly stats: UnitStats,
        upgradeLevel: number = 0
    ) {
        this._currentHP = stats.baseHP;
        this._currentAmmunition = stats.ammunition;
        this.upgradeLevel = upgradeLevel;
        this.groupId = `${this.type}_upgrade${this.upgradeLevel}`;
    }

    get currentHP(): number {
        return this._currentHP;
    }

    set currentHP(value: number) {
        this._currentHP = value;
    }

    get currentAmmunition(): number | null {
        return this._currentAmmunition;
    }

    get upgradeLevel(): number {
        return this._upgradeLevel;
    }

    set upgradeLevel(level: number) {
        if (level < 0 || level > 3) {
            throw new Error('Upgrade level must be between 0 and 3');
        }
        this._upgradeLevel = level;
        // Update groupId when upgrade level changes (though usually immutable after creation)
        // this.groupId = `${this.type}_upgrade${this.upgradeLevel}`; 
    }

    get hephaestusLevel(): number {
        return this._hephaestusLevel;
    }

    set hephaestusLevel(level: number) {
        if (level < 0 || level > 5) {
            throw new Error('Hephaestus level must be between 0 and 5');
        }
        this._hephaestusLevel = level;
    }

    getEffectiveStats(hephaestusLevel?: number): { hp: number; armor: number; damage: number; accuracy: number; size: number; ammunition: number | null } {
        const level = hephaestusLevel !== undefined ? hephaestusLevel : this._hephaestusLevel;
        const hephaestus = HephaestusService.getBonuses(level);

        // Armor: base (from upgrade array at level 0) + upgrade + hephaestus
        // Note: stats.upgradeArmor[0] is base armor
        const armor = this.stats.upgradeArmor[this._upgradeLevel] + hephaestus.armor;

        // Damage: (base + upgrade) * (1 + hephaestus%)
        // Note: stats.upgradeDamage[0] is base damage
        const damage = this.stats.upgradeDamage[this._upgradeLevel] * (1 + hephaestus.damagePercent);

        return {
            hp: this.stats.baseHP,
            armor: Math.floor(armor),
            damage: Math.floor(damage), // Usually damage is integer in games
            accuracy: this.stats.accuracy,
            size: this.stats.size,
            ammunition: this.stats.ammunition
        };
    }

    takeDamage(amount: number): void {
        if (this._inReserve) return;
        this._currentHP -= amount;
    }

    isAlive(): boolean {
        return this._currentHP > 0;
    }

    canAttack(): boolean {
        if (this._inReserve) return false;
        if (this._currentAmmunition === null) return true;
        return this._currentAmmunition > 0;
    }

    consumeAmmunition(): void {
        if (this._currentAmmunition !== null && this._currentAmmunition > 0) {
            this._currentAmmunition--;
            if (this._currentAmmunition === 0) {
                this.sendToReserve();
            }
        }
    }

    isInReserve(): boolean {
        return this._inReserve;
    }

    sendToReserve(): void {
        this._inReserve = true;
    }

    activate(): void {
        this._inReserve = false;
    }
}
