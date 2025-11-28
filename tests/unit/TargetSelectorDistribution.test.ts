import { TargetSelector } from '../../src/domain/TargetSelector';
import { BattlefieldFactory } from '../../src/domain/BattlefieldFactory';
import { UnitFactory } from '../../src/domain/UnitFactory';
import { BattleType, UnitType } from '../../src/domain/enums';

describe('TargetSelector Distribution', () => {
    test('should distribute attacks 1-to-1 when counts are equal', () => {
        const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);
        const attackerLine = battlefield.getLine('attacker', UnitType.FirstLine);
        const defenderLine = battlefield.getLine('defender', UnitType.FirstLine);

        // Add 3 attackers
        const att1 = UnitFactory.createUnit('hoplita', 'att-1');
        const att2 = UnitFactory.createUnit('hoplita', 'att-2');
        const att3 = UnitFactory.createUnit('hoplita', 'att-3');
        attackerLine.slots[0].addUnit(att1);
        attackerLine.slots[0].addUnit(att2);
        attackerLine.slots[0].addUnit(att3);

        // Add 3 defenders
        const def1 = UnitFactory.createUnit('hoplita', 'def-1');
        const def2 = UnitFactory.createUnit('hoplita', 'def-2');
        const def3 = UnitFactory.createUnit('hoplita', 'def-3');
        defenderLine.slots[0].addUnit(def1);
        defenderLine.slots[0].addUnit(def2);
        defenderLine.slots[0].addUnit(def3);

        // Verify targeting
        const t1 = TargetSelector.selectTarget(att1, attackerLine, battlefield, 'defender');
        const t2 = TargetSelector.selectTarget(att2, attackerLine, battlefield, 'defender');
        const t3 = TargetSelector.selectTarget(att3, attackerLine, battlefield, 'defender');

        expect(t1?.id).toBe(def1.id);
        expect(t2?.id).toBe(def2.id);
        expect(t3?.id).toBe(def3.id);
    });

    test('should distribute attacks evenly when attackers > defenders', () => {
        const battlefield = BattlefieldFactory.createBattlefield(BattleType.Terrestrial, 10);
        const attackerLine = battlefield.getLine('attacker', UnitType.FirstLine);
        const defenderLine = battlefield.getLine('defender', UnitType.FirstLine);

        // Add 3 attackers
        const att1 = UnitFactory.createUnit('hoplita', 'att-1');
        const att2 = UnitFactory.createUnit('hoplita', 'att-2');
        const att3 = UnitFactory.createUnit('hoplita', 'att-3');
        attackerLine.slots[0].addUnit(att1);
        attackerLine.slots[0].addUnit(att2);
        attackerLine.slots[0].addUnit(att3);

        // Add 2 defenders
        const def1 = UnitFactory.createUnit('hoplita', 'def-1');
        const def2 = UnitFactory.createUnit('hoplita', 'def-2');
        defenderLine.slots[0].addUnit(def1);
        defenderLine.slots[0].addUnit(def2);

        // Verify targeting (0->0, 1->1, 2->0)
        const t1 = TargetSelector.selectTarget(att1, attackerLine, battlefield, 'defender');
        const t2 = TargetSelector.selectTarget(att2, attackerLine, battlefield, 'defender');
        const t3 = TargetSelector.selectTarget(att3, attackerLine, battlefield, 'defender');

        expect(t1?.id).toBe(def1.id);
        expect(t2?.id).toBe(def2.id);
        expect(t3?.id).toBe(def1.id);
    });
});
