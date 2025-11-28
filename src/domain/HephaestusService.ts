export class HephaestusService {
    private static readonly BONUSES = {
        0: { armor: 0, damagePercent: 0.00 },
        1: { armor: 0, damagePercent: 0.075 },
        2: { armor: 10, damagePercent: 0.075 },
        3: { armor: 10, damagePercent: 0.10 },
        4: { armor: 20, damagePercent: 0.125 },
        5: { armor: 20, damagePercent: 0.15 }
    };

    static getBonuses(level: number): { armor: number; damagePercent: number } {
        if (level < 0 || level > 5) {
            throw new Error(`Invalid Hephaestus level: ${level}. Must be 0-5.`);
        }
        // @ts-ignore
        return this.BONUSES[level];
    }
}
