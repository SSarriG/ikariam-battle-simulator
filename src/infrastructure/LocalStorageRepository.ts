import { BattleConfiguration } from '../application/BattleConfiguration';

export class LocalStorageRepository {
    private readonly STORAGE_KEY = 'ikariam-battle-configs';

    saveConfiguration(name: string, config: BattleConfiguration): void {
        const configs = this.getAllConfigurations();
        configs[name] = config;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    }

    loadConfiguration(name: string): BattleConfiguration | null {
        const configs = this.getAllConfigurations();
        return configs[name] || null;
    }

    deleteConfiguration(name: string): void {
        const configs = this.getAllConfigurations();
        delete configs[name];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    }

    listConfigurations(): string[] {
        const configs = this.getAllConfigurations();
        return Object.keys(configs);
    }

    private getAllConfigurations(): Record<string, BattleConfiguration> {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    }
}
