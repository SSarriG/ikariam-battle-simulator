"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const unidades_json_1 = __importDefault(require("../data/unidades.json"));
const lineas_json_1 = __importDefault(require("../data/lineas.json"));
const campos_json_1 = __importDefault(require("../data/campos.json"));
describe('Project Setup', () => {
    test('should load units data', () => {
        expect(unidades_json_1.default.unit.length).toBeGreaterThan(0);
        const hoplita = unidades_json_1.default.unit.find((u) => u['nombre-unidad'] === 'hoplita');
        expect(hoplita).toBeDefined();
        expect(hoplita?.daño).toBe(18);
    });
    test('should load lines data', () => {
        expect(lineas_json_1.default.lineas.length).toBeGreaterThan(0);
        const firstLine = lineas_json_1.default.lineas.find((l) => l.nombre === 'primera-linea');
        expect(firstLine).toBeDefined();
        expect(firstLine?.['orden-ataque']).toBe(5);
    });
    test('should load fields data', () => {
        expect(campos_json_1.default.terrestre.length).toBeGreaterThan(0);
        const level1 = campos_json_1.default.terrestre.find((c) => c['nivel-min-ciudad'] === 1);
        expect(level1).toBeDefined();
        expect(level1?.unidades['primera-linea']['num-huecos']).toBe(3);
    });
});
