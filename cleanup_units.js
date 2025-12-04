const fs = require('fs');
const path = '/Users/sergi/Documents/PruebaSimulador/data/unidades.json';

try {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));

    if (data.unit && Array.isArray(data.unit)) {
        data.unit.forEach(unit => {
            delete unit['daño-mejora1'];
            delete unit['daño-mejora2'];
            delete unit['daño-mejora3'];
            delete unit['armadura-mejora1'];
            delete unit['armadura-mejora2'];
            delete unit['armadura-mejora3'];
        });

        // Write back with 4 spaces indentation to match existing style
        fs.writeFileSync(path, JSON.stringify(data, null, 4), 'utf8');
        console.log('Unidades actualizadas correctamente.');
    } else {
        console.error('Formato de unidades.json incorrecto: no se encontró la propiedad "unidades" o no es un array.');
    }
} catch (err) {
    console.error('Error procesando el archivo:', err);
}
