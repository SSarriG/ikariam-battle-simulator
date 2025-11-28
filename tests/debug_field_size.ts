import { BattlefieldFactory } from '../src/domain/BattlefieldFactory';
import { BattleType, UnitType } from '../src/domain/enums';
import { UnitFactory } from '../src/domain/UnitFactory';
import { GarrisonLimitService } from '../src/domain/GarrisonLimitService';

// Mock data
const battleType = BattleType.Terrestrial;
const townHallLevel = 5;
const wallLevel = 0;
const defenderCount = 550;

console.log('--- Debugging Field Size Logic ---');

// 1. Check Garrison Limit
const limit = GarrisonLimitService.calculateLimit(battleType, townHallLevel, wallLevel);
console.log(`Garrison Limit for TH ${townHallLevel} + Wall ${wallLevel}: ${limit}`);
console.log(`Defender Count: ${defenderCount}`);
console.log(`Is Limit Exceeded? ${defenderCount > limit}`);

// 2. Create Battlefield
// We need dummy units to pass to createBattlefieldWithUnits, but createBattlefield only needs count
// Let's call createBattlefield directly if possible, but it's static.
// We can use createBattlefieldWithUnits with empty arrays just to trigger the logic if we mock the count?
// Actually, createBattlefieldWithUnits calculates count from array.
// So let's create 550 dummy units.

const defenderUnits = [];
for (let i = 0; i < defenderCount; i++) {
    defenderUnits.push(UnitFactory.createUnit('hoplita', `def-${i}`));
}

const battlefield = BattlefieldFactory.createBattlefieldWithUnits(
    battleType,
    townHallLevel,
    wallLevel,
    [], // attackers
    defenderUnits // defenders
);

console.log(`Battlefield Created.`);
console.log(`Battlefield Level1: ${battlefield.level1}`);
console.log(`Battlefield Garrison Limit: ${battlefield.garrisonLimit}`);
console.log(`Battlefield Limit Exceeded: ${battlefield.isGarrisonLimitExceeded}`);

// Check slot count for First Line (should be 7 for Open Field, 5 for Level 5)
const firstLine = battlefield.defenderLines.get(UnitType.FirstLine);
console.log(`First Line Slots: ${firstLine?.slots.length}`);
console.log(`First Line Slot Capacity: ${firstLine?.slots[0]?.capacity}`);

if (firstLine?.slots.length === 7) {
    console.log('RESULT: OPEN FIELD (Correct)');
} else {
    console.log('RESULT: SMALL FIELD (Incorrect)');
}
