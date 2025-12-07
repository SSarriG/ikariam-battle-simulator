import { Unit } from './Unit';
import { TerrestrialUnit } from './TerrestrialUnit';
import { MaritimeUnit } from './MaritimeUnit';
import { UnitStats } from './UnitStats';
import { BattleType, UnitType } from './enums';
import unidadesData from '../../data/unidades.json';

interface UnitData {
    'nombre-unidad': string;
    'puntos-golpe': number;
    'armadura': number;
    'daño': number;
    'precision': number;
    'daño-mejora1': number;
    'daño-mejora2': number;
    'daño-mejora3': number;
    'armadura-mejora1': number;
    'armadura-mejora2': number;
    'armadura-mejora3': number;
    'tamaño': number;
    'municion': number | null;
    'generales': number;
    'tipo-batalla': string;
    'tipo-unidad': string;
    'daño-2'?: number;
    'precision-2'?: number;
}

export class UnitFactory {
    private static unitMap: Map<string, UnitData>;

    private static initializeMap() {
        if (!this.unitMap) {
            this.unitMap = new Map();
            unidadesData.unit.forEach((u: any) => {
                this.unitMap.set(u['nombre-unidad'], u);
            });
        }
    }

    static createUnit(unitName: string, id: string, upgradeLevelAttack: number = 0, upgradeLevelDefense: number = 0): Unit {
        this.initializeMap();
        // Handle case where unitName might be a UnitType enum value (e.g. 'primera-linea') 
        // But usually it's the specific name 'hoplita'. 
        // If unitName is passed as 'hoplita', it works. 
        // If passed as UnitType, we need to find the unit data that matches? 
        // No, createUnit usually takes the specific name.
        // However, UnitGroupManager passes unitType (e.g. 'primera-linea')? 
        // Wait, UnitGroupManager takes UnitType. But UnitFactory.createUnit expects unitName (e.g. 'hoplita').
        // The guidelines say UnitGroupManager.addGroup(unitType: UnitType...). 
        // But 'primera-linea' is a category, not a specific unit. 
        // Actually, in the guidelines example: manager.addGroup('espadachin', 0, 100). 
        // 'espadachin' is a unit name, not UnitType. 
        // So UnitGroupManager should probably accept string (unitName) or I need to map UnitType to name?
        // The guidelines say: addGroup(unitType: UnitType...). But then use 'espadachin'.
        // 'espadachin' is NOT a UnitType in my enum. UnitType is 'primera-linea', 'flancos', etc.
        // So the guidelines might be using UnitType loosely or I need to adjust.
        // Let's assume for now createUnit takes unitName (string).

        const data = this.unitMap.get(unitName);

        if (!data) {
            // Try to find by iterating if unitName is not a direct key? 
            // Or maybe unitName IS the key in json.
            throw new Error(`Unit ${unitName} not found in configuration`);
        }

        const stats = new UnitStats(
            data['puntos-golpe'],
            data['armadura'],
            data['daño'],
            data['precision'],
            data['tamaño'],
            data['municion'],
            data['generales'],
            data['daño-2'] || 0,
            data['precision-2'] || 0
        );

        const type = this.mapUnitType(data['tipo-unidad']);

        if (data['tipo-batalla'] === 'terrestre') {
            return new TerrestrialUnit(id, unitName, type, stats, upgradeLevelAttack, upgradeLevelDefense);
        } else {
            return new MaritimeUnit(id, unitName, type, stats, upgradeLevelAttack, upgradeLevelDefense);
        }
    }

    private static mapUnitType(typeStr: string): UnitType {
        switch (typeStr) {
            case 'primera-linea': return UnitType.FirstLine;
            case 'luchadores-distancia': return UnitType.Ranged;
            case 'flancos': return UnitType.Flank;
            case 'artilleria': return UnitType.Artillery;
            case 'bombarderos': return UnitType.Bomber;
            case 'anti-aerea': return UnitType.AntiAir;
            default: throw new Error(`Unknown unit type: ${typeStr}`);
        }
    }
}
