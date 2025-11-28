import unidades from '../data/unidades.json';
import lineas from '../data/lineas.json';
import campos from '../data/campos.json';

describe('Project Setup', () => {
    test('should load units data', () => {
        expect(unidades.unit.length).toBeGreaterThan(0);
        const hoplita = unidades.unit.find((u) => u['nombre-unidad'] === 'hoplita');
        expect(hoplita).toBeDefined();
        expect(hoplita?.daño).toBe(18);
    });

    test('should load lines data', () => {
        expect(lineas.lineas.length).toBeGreaterThan(0);
        const firstLine = lineas.lineas.find((l) => l.nombre === 'primera-linea');
        expect(firstLine).toBeDefined();
        expect(firstLine?.['orden-ataque']).toBe(5);
    });

    test('should load fields data', () => {
        expect(campos.terrestre.length).toBeGreaterThan(0);
        const level1 = campos.terrestre.find((c) => c['nivel-min-ciudad'] === 1);
        expect(level1).toBeDefined();
        expect(level1?.unidades['primera-linea']['num-huecos']).toBe(3);
    });
});
