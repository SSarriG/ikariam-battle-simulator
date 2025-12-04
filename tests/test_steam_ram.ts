import { CombatEngine } from '../src/domain/CombatEngine';
import { BattlefieldFactory } from '../src/domain/BattlefieldFactory';
import { UnitFactory } from '../src/domain/UnitFactory';
import { BattleType, UnitType } from '../src/domain/enums';

console.log('\n=== TEST: Steam Ram Scenario ===\n');

// Setup: 4 slots atacantes con 5 rams cada uno = matriz 5×4
// 2 slots defensores con 5 rams cada uno

const battlefield = BattlefieldFactory.createBattlefield(BattleType.Maritime, 30, 0);

// Atacante: 4 slots con 5 rams en cada uno (matriz 5×4)
const attackerSlots = [0, 1, 2, 3];
attackerSlots.forEach(slotIndex => {
    const slot = battlefield.getLine('attacker', UnitType.FirstLine).slots[slotIndex];
    for (let i = 0; i < 5; i++) {
        const ram = UnitFactory.createUnit('barco-espolon-vapor', `att-${slotIndex}-${i}`);
        slot.addUnit(ram);
    }
});

// Defensor: 2 slots (lateral y central) con 5 rams cada uno
const defenderLine = battlefield.getLine('defender', UnitType.FirstLine);
const lateralSlot = defenderLine.slots[1]; // Slot lateral  
const centralSlot = defenderLine.slots[3]; // Slot central

for (let i = 0; i < 5; i++) {
    lateralSlot.addUnit(UnitFactory.createUnit('barco-espolon-vapor', `def-lat-${i}`));
    centralSlot.addUnit(UnitFactory.createUnit('barco-espolon-vapor', `def-cen-${i}`));
}

console.log('Setup:');
console.log('- Atacante: 4 slots × 5 rams = 20 rams (matriz 5×4)');
console.log('- Defensor: 2 slots × 5 rams = 10 rams');
console.log('');

const engine = new CombatEngine(battlefield);

console.log('--- RONDA 1 ---');
engine.executeNextRound();

const lateralAlive = lateralSlot.units.filter(u => u.isAlive()).length;
const centralAlive = centralSlot.units.filter(u => u.isAlive()).length;

console.log(`\nResultados:`);
console.log(`Slot Lateral: ${5 - lateralAlive} muertos, ${lateralAlive} vivos`);
console.log(`Slot Central: ${5 - centralAlive} muertos, ${centralAlive} vivos`);
console.log('');
console.log(`✓ Esperado según tesis:`);
console.log(`  Slot Lateral: 1 muerto (recibe 2 ondas)`);
console.log(`  Slot Central: 3 muertos (recibe 3 ondas)`);
