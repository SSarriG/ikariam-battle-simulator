import { CombatEngine } from '../src/domain/CombatEngine';
import { BattlefieldFactory } from '../src/domain/BattlefieldFactory';
import { UnitFactory } from '../src/domain/UnitFactory';
import { BattleType, UnitType } from '../src/domain/enums';

console.log('\n=== TEST: 1 Espadachín vs 2 Aporreadores ===\n');

// Crear battlefield
const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10, 0);

// 1 Espadachín atacante
const attacker = UnitFactory.createUnit('espadachin', 'att-1');
battlefield.getLine('attacker', UnitType.Flank).slots[0].addUnit(attacker);

// 2 Aporreadores defensores
const def1 = UnitFactory.createUnit('aporreador-barbaro', 'def-1');
const def2 = UnitFactory.createUnit('aporreador-barbaro', 'def-2');
const defenderLine = battlefield.getLine('defender', UnitType.Flank);
defenderLine.slots[0].addUnit(def1);
defenderLine.slots[0].addUnit(def2);

console.log('Estado Inicial:');
console.log(`Espadachín: ${attacker.currentHP} HP`);
console.log(`Aporreador 1: ${def1.currentHP} HP`);
console.log(`Aporreador 2: ${def2.currentHP} HP`);

// Crear engine y ejecutar rondas
const engine = new CombatEngine(battlefield);

console.log('\n--- RONDA 1 ---');
engine.executeNextRound();
console.log(`Aporreador 1: ${def1.currentHP} HP (${def1.isAlive() ? 'Vivo' : 'Muerto'})`);
console.log(`Aporreador 2: ${def2.currentHP} HP (${def2.isAlive() ? 'Vivo' : 'Muerto'})`);
console.log(`✓ Esperado: Ambos ~140 HP (equalizados)`);

console.log('\n--- RONDA 2 ---');
engine.executeNextRound();
console.log(`Aporreador 1: ${def1.currentHP} HP (${def1.isAlive() ? 'Vivo' : 'Muerto'})`);
console.log(`Aporreador 2: ${def2.currentHP} HP (${def2.isAlive() ? 'Vivo' : 'Muerto'})`);
console.log(`✓ Esperado: Uno muerto, el otro ~130 HP`);
