import { Battlefield } from './Battlefield';
import { BattleLine } from './BattleLine';
import { UnitType } from './enums';

export class BattlefieldAnalyzer {
    static analyze(battlefield: Battlefield, side: 'attacker' | 'defender' = 'attacker'): { missingLines: UnitType[], incompleteSlots: number } {
        const missingLines: UnitType[] = [];
        let incompleteSlots = 0;

        // Check for missing lines (standard lines usually expected)
        // This depends on what we consider "required". 
        // For now, let's just report which lines are empty.
        const lines = [
            battlefield.getLine(side, UnitType.FirstLine),
            battlefield.getLine(side, UnitType.Ranged),
            battlefield.getLine(side, UnitType.Flank),
            battlefield.getLine(side, UnitType.Artillery),
            battlefield.getLine(side, UnitType.Bomber),
            battlefield.getLine(side, UnitType.AntiAir)
        ];

        lines.forEach(line => {
            if (line && !line.hasAliveUnits()) {
                missingLines.push(line.lineType);
            }

            if (line) {
                line.slots.forEach(slot => {
                    if (!slot.isEmpty() && slot.remainingCapacity > 0) {
                        incompleteSlots++;
                    }
                });
            }
        });

        return { missingLines, incompleteSlots };
    }

    static isAmTheoryApplicable(battlefield: Battlefield): boolean {
        // Am Theory might break if there are incomplete slots?
        // Guidelines: "Incomplete slots (fewer units than capacity) break Am Theory."
        const analysis = this.analyze(battlefield, 'attacker');
        return analysis.incompleteSlots === 0;
    }
}
