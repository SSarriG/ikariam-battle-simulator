
import { BattlefieldFactory } from './src/domain/BattlefieldFactory';
import { BattleType, UnitType } from './src/domain/enums';
import { UnitFactory } from './src/domain/UnitFactory';
import { Unit } from './src/domain/Unit';
import { UnitStats } from './src/domain/UnitStats';

// Mock data loading if needed, or rely on existing imports in Factory
// We need to ensure the environment can load the JSONs. 
// Since we are running with ts-node or similar, it should work if paths are correct.

async function run() {
    try {
        console.log('Starting Wall Issue Reproduction...');

        // 1. Create Battlefield (Terrestrial, Town Hall 5, Wall 5)
        // Level 5 Town Hall -> Size 2 -> Capacity 30 (likely, need to check json)
        const battleType = BattleType.Terrestrial;
        const townHallLevel = 5;
        const wallLevel = 5;

        console.log(`Creating Battlefield: Type=${battleType}, TH=${townHallLevel}, Wall=${wallLevel}`);
        const battlefield = BattlefieldFactory.createBattlefield(battleType, townHallLevel, wallLevel);

        // 2. Check First Line Slots
        const firstLine = battlefield.defenderLines.get(UnitType.FirstLine);
        if (!firstLine) throw new Error('First Line not found');

        console.log(`First Line Slots: ${firstLine.slots.length}`);

        firstLine.slots.forEach((slot, i) => {
            console.log(`Slot ${i}: Capacity=${slot.capacity}, Units=${slot.units.length}`);
            if (slot.units.length > 0) {
                const u = slot.units[0];
                console.log(`  Unit 0: ${u.name}, Size=${u.stats.size}`);
            }
        });

        // 3. Try to add Hoplites (Defender)
        // Create 100 Hoplites
        const hoplites = [];
        // We need a dummy stats object for factory or just mock it
        // UnitFactory.createUnit requires stats.
        // Let's just use BattlefieldFactory.distributeUnits with a mock unit if possible,
        // or rely on the fact that we can create units manually.

        // We can't easily use UnitFactory without the JSONs loaded correctly in this script context.
        // But BattlefieldFactory imports UnitFactory? No, it imports Unit.

        // Let's try to simulate what distributeUnits does.
        // It calls SlotFillingAlgorithm.fill(line, units).

        // We need a Unit instance.
        // Let's mock a Hoplite.
        const hopliteStats = new UnitStats(100, 10, 10, 90, 1, 0, 1, [10, 10, 10, 10], [10, 10, 10, 10]);
        // Mock Unit class
        class TestUnit extends Unit {
            constructor(id: string) {
                super(id, 'hoplita', UnitType.FirstLine, BattleType.Terrestrial, hopliteStats, 0);
            }
        }

        const defenderUnits: Unit[] = [];
        for (let i = 0; i < 100; i++) {
            defenderUnits.push(new TestUnit(`hop-${i}`));
        }

        console.log(`Distributing ${defenderUnits.length} Hoplites...`);
        BattlefieldFactory.distributeUnits(battlefield, [], defenderUnits);

        // 4. Check Slots again
        console.log('--- After Distribution ---');
        firstLine.slots.forEach((slot, i) => {
            console.log(`Slot ${i}: Capacity=${slot.capacity}, Units=${slot.units.length}, Remaining=${slot.remainingCapacity}`);
            const names = slot.units.map(u => u.name);
            const wallCount = names.filter(n => n === 'Muro').length;
            const hopCount = names.filter(n => n === 'hoplita').length;
            console.log(`  Walls: ${wallCount}, Hoplites: ${hopCount}`);

            if (wallCount > 0 && hopCount > 0) {
                console.error('  FAIL: Mixed Walls and Hoplites!');
            }
        });

    } catch (e) {
        console.error(e);
    }
}

run();
