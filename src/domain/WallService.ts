import { UnitStats } from './UnitStats';

export class WallService {
    private static readonly WALL_STATS = [
        { "nivel": 1, "armadura": 72, "daño": 216, "puntos_golpe": 2700 },
        { "nivel": 2, "armadura": 144, "daño": 252, "puntos_golpe": 3600 },
        { "nivel": 3, "armadura": 216, "daño": 288, "puntos_golpe": 4500 },
        { "nivel": 4, "armadura": 288, "daño": 324, "puntos_golpe": 5400 },
        { "nivel": 5, "armadura": 360, "daño": 360, "puntos_golpe": 6300 },
        { "nivel": 6, "armadura": 432, "daño": 396, "puntos_golpe": 7200 },
        { "nivel": 7, "armadura": 504, "daño": 432, "puntos_golpe": 8100 },
        { "nivel": 8, "armadura": 576, "daño": 468, "puntos_golpe": 9000 },
        { "nivel": 9, "armadura": 648, "daño": 504, "puntos_golpe": 9900 },
        { "nivel": 10, "armadura": 720, "daño": 1440, "puntos_golpe": 10800 },
        { "nivel": 11, "armadura": 792, "daño": 1530, "puntos_golpe": 11700 },
        { "nivel": 12, "armadura": 864, "daño": 1620, "puntos_golpe": 12600 },
        { "nivel": 13, "armadura": 936, "daño": 1710, "puntos_golpe": 13500 },
        { "nivel": 14, "armadura": 1008, "daño": 1800, "puntos_golpe": 14400 },
        { "nivel": 15, "armadura": 1080, "daño": 1890, "puntos_golpe": 15300 },
        { "nivel": 16, "armadura": 1152, "daño": 1980, "puntos_golpe": 16200 },
        { "nivel": 17, "armadura": 1224, "daño": 2070, "puntos_golpe": 17100 },
        { "nivel": 18, "armadura": 1296, "daño": 2160, "puntos_golpe": 18000 },
        { "nivel": 19, "armadura": 1368, "daño": 2250, "puntos_golpe": 18900 },
        { "nivel": 20, "armadura": 1440, "daño": 4500, "puntos_golpe": 19800 },
        { "nivel": 21, "armadura": 1512, "daño": 4680, "puntos_golpe": 20700 },
        { "nivel": 22, "armadura": 1584, "daño": 4860, "puntos_golpe": 21600 },
        { "nivel": 23, "armadura": 1656, "daño": 5040, "puntos_golpe": 22500 },
        { "nivel": 24, "armadura": 1728, "daño": 5220, "puntos_golpe": 23400 },
        { "nivel": 25, "armadura": 1800, "daño": 5400, "puntos_golpe": 24300 },
        { "nivel": 26, "armadura": 1872, "daño": 5580, "puntos_golpe": 25200 },
        { "nivel": 27, "armadura": 1944, "daño": 5760, "puntos_golpe": 26100 },
        { "nivel": 28, "armadura": 2016, "daño": 5940, "puntos_golpe": 27000 },
        { "nivel": 29, "armadura": 2088, "daño": 6120, "puntos_golpe": 27900 },
        { "nivel": 30, "armadura": 2160, "daño": 6300, "puntos_golpe": 28800 },
        { "nivel": 31, "armadura": 2232, "daño": 6480, "puntos_golpe": 29700 },
        { "nivel": 32, "armadura": 2304, "daño": 6660, "puntos_golpe": 30600 },
        { "nivel": 33, "armadura": 2376, "daño": 6840, "puntos_golpe": 31500 },
        { "nivel": 34, "armadura": 2448, "daño": 7020, "puntos_golpe": 32400 },
        { "nivel": 35, "armadura": 2520, "daño": 7200, "puntos_golpe": 33300 },
        { "nivel": 36, "armadura": 2592, "daño": 7380, "puntos_golpe": 34200 },
        { "nivel": 37, "armadura": 2664, "daño": 7560, "puntos_golpe": 35100 },
        { "nivel": 38, "armadura": 2736, "daño": 7740, "puntos_golpe": 36000 },
        { "nivel": 39, "armadura": 2808, "daño": 7920, "puntos_golpe": 36900 },
        { "nivel": 40, "armadura": 2880, "daño": 8100, "puntos_golpe": 37800 },
        { "nivel": 41, "armadura": 2952, "daño": 8280, "puntos_golpe": 38700 },
        { "nivel": 42, "armadura": 3024, "daño": 8460, "puntos_golpe": 39600 },
        { "nivel": 43, "armadura": 3096, "daño": 8640, "puntos_golpe": 40500 },
        { "nivel": 44, "armadura": 3168, "daño": 8820, "puntos_golpe": 41400 },
        { "nivel": 45, "armadura": 3240, "daño": 9000, "puntos_golpe": 42300 },
        { "nivel": 46, "armadura": 3312, "daño": 9180, "puntos_golpe": 43200 },
        { "nivel": 47, "armadura": 3384, "daño": 9360, "puntos_golpe": 44100 },
        { "nivel": 48, "armadura": 3456, "daño": 9540, "puntos_golpe": 45000 }
    ];

    static getStats(level: number): UnitStats | null {
        const stats = this.WALL_STATS.find(s => s.nivel === level);
        if (!stats) return null;

        return new UnitStats(
            stats.puntos_golpe,
            stats.armadura,
            stats.daño,
            100, // Accuracy
            1,   // Size (1 per slot? No, Wall fills the slot. Size 1 is fine if capacity is 1)
            // Wait, Wall is 1 unit per slot. Slot capacity for First Line is 30/40/50.
            // But Wall is special. It occupies the WHOLE slot.
            // So its size should be equal to the slot capacity? 
            // Or we treat it as size 1 but force it to fill the slot?
            // Let's assume size 1 for now, but we'll need special logic to place only 1 per slot.
            null, // Ammunition
            0    // Generals Cost
        );
    }
}
