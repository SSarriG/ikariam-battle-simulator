const fs = require('fs');
const path = require('path');

const unitsPath = path.join(__dirname, '../data/unidades.json');
const rawData = fs.readFileSync(unitsPath, 'utf8');
const unitsData = JSON.parse(rawData);

const MULTIPLIER = 20;

function updateStats(unit) {
    const oldHp = unit['puntos-golpe'];
    const oldArmor = unit['armadura'];
    const oldDamage = unit['daño'];

    // Update base stats
    unit['puntos-golpe'] = oldHp * MULTIPLIER;
    unit['armadura'] = oldArmor * MULTIPLIER;
    unit['daño'] = oldDamage * MULTIPLIER;

    // Update upgrade stats preserving delta
    // NewUpgrade = (OldBase * 20) + (OldUpgrade - OldBase)
    // Simplified: NewUpgrade = NewBase + (OldUpgrade - OldBase)

    const updateUpgrade = (key, oldBase) => {
        if (unit[key] !== undefined) {
            const oldUpgrade = unit[key];
            const delta = oldUpgrade - oldBase;
            unit[key] = (oldBase * MULTIPLIER) + delta;
        }
    };

    updateUpgrade('daño-mejora1', oldDamage);
    updateUpgrade('daño-mejora2', oldDamage);
    updateUpgrade('daño-mejora3', oldDamage);

    updateUpgrade('armadura-mejora1', oldArmor);
    updateUpgrade('armadura-mejora2', oldArmor);
    updateUpgrade('armadura-mejora3', oldArmor);
}

unitsData.unit.forEach(updateStats);

fs.writeFileSync(unitsPath, JSON.stringify(unitsData, null, 2), 'utf8');
console.log('Successfully updated unit stats by x20.');
