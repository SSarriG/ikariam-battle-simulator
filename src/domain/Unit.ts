import { BattleType, UnitType } from './enums';
import { UnitStats } from './UnitStats';
import { HephaestusService } from './HephaestusService';

export abstract class Unit {
    protected _currentHP: number;
    protected _currentAmmunition: number | null;
    protected _upgradeLevelAttack: number = 0;
    protected _upgradeLevelDefense: number = 0;
    protected _hephaestusLevel: number = 0;
    protected _inReserve: boolean = false;

    public readonly groupId: string;

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly type: UnitType,
        public readonly battleType: BattleType,
        public readonly stats: UnitStats,
        upgradeLevelAttack: number = 0,
        upgradeLevelDefense: number = 0
    ) {
        this._currentHP = stats.baseHP;
        this._currentAmmunition = stats.ammunition;
        this.upgradeLevelAttack = upgradeLevelAttack;
        this.upgradeLevelDefense = upgradeLevelDefense;
        this.groupId = `${this.type}_att${this.upgradeLevelAttack}_def${this.upgradeLevelDefense}`;
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

    get upgradeLevelAttack(): number {
        return this._upgradeLevelAttack;
    }

    set upgradeLevelAttack(level: number) {
        if (level < 0) {
            throw new Error("Upgrade level must be non-negative");
        }
        this._upgradeLevelAttack = level;
    }

    get upgradeLevelDefense(): number {
        return this._upgradeLevelDefense;
    }

    set upgradeLevelDefense(level: number) {
        if (level < 0) {
            throw new Error("Upgrade level must be non-negative");
        }
        this._upgradeLevelDefense = level;
    }

    get hephaestusLevel(): number {
        return this._hephaestusLevel;
    }

    set hephaestusLevel(level: number) {
        this._hephaestusLevel = level;
    }

    getEffectiveStats(): { hp: number; armor: number; damage: number; accuracy: number; size: number; ammunition: number | null; damage2?: number; accuracy2?: number } {
        const hephaestus = HephaestusService.getBonuses(this._hephaestusLevel);

        const upgradeIncrement = this.battleType === BattleType.Terrestrial ? 5 : 10;

        // Armor: base + (level * increment) + hephaestus
        const baseArmor = this.stats.baseArmor;
        const armorUpgradeBonus = this._upgradeLevelDefense * upgradeIncrement;
        const armor = baseArmor + armorUpgradeBonus + hephaestus.armor;

        // Damage: (base + (level * increment)) * (1 + hephaestus%)
        const baseDamage = this.stats.baseDamage;
        const damageUpgradeBonus = this._upgradeLevelAttack * upgradeIncrement;
        const damage = (baseDamage + damageUpgradeBonus) * (1 + hephaestus.damagePercent);

        return {
            hp: this.stats.baseHP,
            armor: Math.floor(armor),
            damage: Math.floor(damage), // Usually damage is integer in games
            accuracy: this.stats.accuracy,
            size: this.stats.size,
            ammunition: this.stats.ammunition,
            damage2: this.stats.damage2,
            accuracy2: this.stats.accuracy2
        };
    }

    takeDamage(amount: number): void {
        if (this._inReserve) {
            console.log(`[Unit ${this.name}] Ignored ${amount} dmg because in reserve`);
            return;
        }
        const before = this._currentHP;
        this._currentHP -= amount;
        // console.log(`[Unit ${this.name}] Took ${amount} dmg. HP: ${before} -> ${this._currentHP}`);
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
