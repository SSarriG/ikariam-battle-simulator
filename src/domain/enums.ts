export enum BattleType {
    Terrestrial = 'terrestre',
    Maritime = 'maritima',
}

export enum UnitType {
    FirstLine = 'primera-linea',
    Ranged = 'luchadores-distancia',
    Flank = 'flancos',
    Artillery = 'artilleria',
    Bomber = 'bombarderos',
    AntiAir = 'anti-aerea',
}

export enum BattleStatus {
    Active = 'active',
    Finished = 'finished',
}

export enum Winner {
    Attacker = 'attacker',
    Defender = 'defender',
    Draw = 'draw',
}

export enum RedistributionType {
    Reserve = 'RR',
    Slot = 'SR',
    Immediate = 'IR',
}
