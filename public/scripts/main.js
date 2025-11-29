// Main UI Controller
console.log('Bundle execution started');
import { BattleSimulationUseCase } from '../../src/application/BattleSimulationUseCase';
import { StepBattleSimulationUseCase } from '../../src/application/StepBattleSimulationUseCase';
import { LocalStorageRepository } from '../../src/infrastructure/LocalStorageRepository';
import { BattleType } from '../../src/domain/enums';
import { UnitFactory } from '../../src/domain/UnitFactory';
import { BattlefieldFactory } from '../../src/domain/BattlefieldFactory';

console.log('Imports completed');

const TERRESTRIAL_UNITS_NORMAL = [
    'hoplita', 'espadachin', 'lancero', 'arquero', 'hondero', 'fusilero',
    'catapulta', 'mortero', 'ariete', 'gigante-vapor', 'girocoptero', 'bombardero',
    'espartano'
];

const TERRESTRIAL_UNITS_BARBARIAN = [
    'agitador-hachas-barbaro', 'aporreador-barbaro', 'unidad-guerra-barbara',
    'clava-cuchillos-barbaro', 'lanzahachas-barbaro', 'ariete-barbaro',
    'catapulta-barbara', 'dirigible-barbaro', 'caza-barbaro'
];

const TERRESTRIAL_UNITS = [...TERRESTRIAL_UNITS_NORMAL, ...TERRESTRIAL_UNITS_BARBARIAN];

const MARITIME_UNITS_NORMAL = [
    'barco-espolon-comun', 'barco-lanzallamas', 'barco-espolon-vapor', 'barco-ballesta',
    'barco-catapulta', 'barco-mortero', 'barco-lanzamisiles', 'submarino',
    'lancha-palas', 'barco-portaglobos'
];

const MARITIME_UNITS_BARBARIAN = [
    'rompelanchas', 'rajavelas', 'pirobarco', 'tiraguijarros', 'cuña',
    'catapulta-polvora', 'terror-profundidades-marinas', 'fuego-dragon',
    'encendedor-zepelin', 'Nido-barbaros'
];

const MARITIME_UNITS = [...MARITIME_UNITS_NORMAL, ...MARITIME_UNITS_BARBARIAN];

class BattleSimulatorApp {
    constructor() {
        console.log('BattleSimulatorApp constructor started');
        try {
            this.useCase = new BattleSimulationUseCase();
            this.stepUseCase = new StepBattleSimulationUseCase();
            this.repository = new LocalStorageRepository();
            this.currentReport = null;
            this.stepMode = false;
            this.currentBattleType = 'terrestrial'; // Default

            if (window.BattlefieldMatrix) {
                this.battlefieldMatrix = new window.BattlefieldMatrix();
            }
        } catch (e) {
            console.error('Error in constructor:', e);
        }

        // Bind methods
        this.setBattleType = this.setBattleType.bind(this);
        this.clearUnits = this.clearUnits.bind(this);
        this.applyUpgrades = this.applyUpgrades.bind(this);
        this.runSimulation = this.runSimulation.bind(this);
        this.startStepMode = this.startStepMode.bind(this);
        this.saveConfig = this.saveConfig.bind(this);
        this.loadConfig = this.loadConfig.bind(this);
        this.executeNextRound = this.executeNextRound.bind(this);
        this.resetBattle = this.resetBattle.bind(this);
        this.updateMatrixPreview = this.updateMatrixPreview.bind(this);

        // Initial Setup
        this.renderStaticGrids();
        this.setupEventListeners();

        // Initial Preview
        this.updateMatrixPreview();
    }

    setupEventListeners() {
        // Step mode controls
        const nextRoundButton = document.querySelector('.next-round-button');
        if (nextRoundButton) {
            nextRoundButton.addEventListener('click', () => this.executeNextRound());
        }

        const resetButton = document.querySelector('.reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetBattle());
        }

        // Global Config Inputs
        const globalInputs = document.querySelectorAll('#global-config input');
        globalInputs.forEach(input => {
            input.addEventListener('change', () => this.updateMatrixPreview());
            input.addEventListener('input', () => this.updateMatrixPreview());
        });
    }

    setBattleType(type) {
        this.currentBattleType = type;

        // Update Buttons
        document.getElementById('btn-terrestrial').classList.toggle('active', type === 'terrestrial');
        document.getElementById('btn-maritime').classList.toggle('active', type === 'maritime');

        // Update Global Config Visibility
        const portConfig = document.getElementById('port-config');
        if (type === 'maritime') {
            portConfig.classList.remove('hidden');
        } else {
            portConfig.classList.add('hidden');
        }

        // Reset unit type selectors to 'normal'
        const attackerTypeSelector = document.getElementById('attacker-unit-type');
        const defenderTypeSelector = document.getElementById('defender-unit-type');
        if (attackerTypeSelector) attackerTypeSelector.value = 'normal';
        if (defenderTypeSelector) defenderTypeSelector.value = 'normal';

        // Re-render grids with correct units (normal by default)
        this.renderStaticGrids();
        this.updateMatrixPreview();
    }

    renderStaticGrids() {
        const units = this.currentBattleType === 'terrestrial' ? TERRESTRIAL_UNITS_NORMAL : MARITIME_UNITS_NORMAL;

        this.renderGrid('attacker', units);
        this.renderGrid('defender', units);
    }

    renderGrid(side, units) {
        const grid = document.getElementById(`${side}-grid`);
        if (!grid) return;

        grid.innerHTML = units.map(unitName => `
            <div class="unit-card" data-unit="${unitName}">
                <div class="unit-img-container">
                    <img src="assets/units/${unitName}.png" alt="${unitName}" onerror="this.style.display='none'">
                </div>
                <div class="unit-inputs">
                    <input type="number" class="quantity-input" min="0" value="0" placeholder="0">
                    <select class="upgrade-select attack-upgrade">
                        <option value="0">Att: 0</option>
                        <option value="1">Att: 1</option>
                        <option value="2">Att: 2</option>
                        <option value="3">Att: 3</option>
                    </select>
                    <select class="upgrade-select defense-upgrade">
                        <option value="0">Def: 0</option>
                        <option value="1">Def: 1</option>
                        <option value="2">Def: 2</option>
                        <option value="3">Def: 3</option>
                    </select>
                </div>
            </div>
        `).join('');

        // Add listeners for preview
        const inputs = grid.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => this.updateMatrixPreview());
            input.addEventListener('input', () => this.updateMatrixPreview());
        });
    }

    clearUnits(side) {
        const grid = document.getElementById(`${side}-grid`);
        if (!grid) return;
        const inputs = grid.querySelectorAll('input, select');
        inputs.forEach(input => input.value = 0);
        this.updateMatrixPreview();
    }

    applyUpgrades(side) {
        const grid = document.getElementById(`${side}-grid`);
        if (!grid) return;
        const selects = grid.querySelectorAll('select');
        selects.forEach(select => select.value = 3); // Max level
        this.updateMatrixPreview();
    }

    filterUnitType(side, type) {
        // Get the appropriate unit list based on battle type and filter type
        let units;
        if (this.currentBattleType === 'terrestrial') {
            units = type === 'normal' ? TERRESTRIAL_UNITS_NORMAL : TERRESTRIAL_UNITS_BARBARIAN;
        } else {
            units = type === 'normal' ? MARITIME_UNITS_NORMAL : MARITIME_UNITS_BARBARIAN;
        }

        // Re-render the grid with filtered units
        this.renderGrid(side, units);
        this.updateMatrixPreview();
    }

    updateMatrixPreview() {
        // Get battle type and levels
        const battleType = this.currentBattleType === 'maritime' ? BattleType.Maritime : BattleType.Terrestrial;

        let level1, level2;
        if (battleType === BattleType.Terrestrial) {
            level1 = parseInt(document.getElementById('townHallLevel').value) || 25;
            level2 = parseInt(document.getElementById('wallLevel').value) || 0;
        } else {
            level1 = parseInt(document.getElementById('portLevel').value) || 20;
            level2 = 0;
        }

        // Create empty battlefield first
        const battlefield = BattlefieldFactory.createBattlefield(battleType, level1, level2);

        // Helper to get units from grid
        const getUnitsFromGrid = (gridId) => {
            const grid = document.getElementById(gridId);
            if (!grid) return [];
            const cards = grid.querySelectorAll('.unit-card');
            const units = [];

            cards.forEach(card => {
                const unitName = card.dataset.unit;
                const quantityInput = card.querySelector('.quantity-input');
                const attackInput = card.querySelector('.attack-upgrade');

                const quantity = parseInt(quantityInput.value) || 0;
                const upgradeLevel = parseInt(attackInput.value) || 0;

                if (quantity > 0) {
                    units.push({
                        name: unitName,
                        quantity: quantity,
                        upgradeLevel: upgradeLevel
                    });
                }
            });
            return units;
        };

        const createSideUnits = (unitInputs, prefix, hephaestusLevel = 0) => {
            const units = [];
            unitInputs.forEach(uInput => {
                for (let i = 0; i < uInput.quantity; i++) {
                    const unit = UnitFactory.createUnit(uInput.name, `${prefix}-${uInput.name}-${i}`);
                    unit.upgradeLevel = uInput.upgradeLevel;
                    unit.hephaestusLevel = hephaestusLevel;
                    units.push(unit);
                }
            });
            return units;
        };

        // Get unit inputs from grids
        const attackerInputs = getUnitsFromGrid('attacker-grid');
        const defenderInputs = getUnitsFromGrid('defender-grid');

        // Get Hephaestus levels
        const attackerHephaestus = parseInt(document.getElementById('attacker-hephaestus')?.value) || 0;
        const defenderHephaestus = parseInt(document.getElementById('defender-hephaestus')?.value) || 0;

        // Create unit objects
        const attackerUnits = createSideUnits(attackerInputs, 'attacker', attackerHephaestus);
        const defenderUnits = createSideUnits(defenderInputs, 'defender', defenderHephaestus);

        // Distribute units if any exist
        if (attackerUnits.length > 0 || defenderUnits.length > 0) {
            BattlefieldFactory.distributeUnits(battlefield, attackerUnits, defenderUnits);
        }

        // Initialize and render matrices
        if (this.battlefieldMatrix) {
            this.battlefieldMatrix.initialize(
                battleType,
                battlefield.effectiveLevel,
                battlefield.attackerLines,
                battlefield.defenderLines
            );

            // Render previews for both sides
            this.battlefieldMatrix.renderPreview(
                'attacker-matrix',
                battlefield.attackerLines,
                'attacker',
                battleType === BattleType.Maritime ? 'Maritima' : 'Terrestre',
                battlefield.garrisonLimit
            );
            this.battlefieldMatrix.renderPreview(
                'defender-matrix',
                battlefield.defenderLines,
                'defender',
                battleType === BattleType.Maritime ? 'Maritima' : 'Terrestre',
                battlefield.garrisonLimit
            );
        }

        // Update reserves
        this.renderReserves('attacker-reserves', battlefield.attackerLines);
        this.renderReserves('defender-reserves', battlefield.defenderLines);
    }

    renderReserves(containerId, lines) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const reserves = {};
        lines.forEach(line => {
            line.reserves.forEach(unit => {
                if (!reserves[unit.name]) reserves[unit.name] = 0;
                reserves[unit.name]++;
            });
        });

        container.innerHTML = Object.entries(reserves).map(([name, count]) => `
            <div class="reserve-slot">
                <div class="unit-img-container" style="width:32px; height:32px;">
                    <img src="assets/units/${name}.png" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <span class="reserve-count">${count}</span>
            </div>
        `).join('');
    }

    buildBattleConfiguration() {
        const battleType = this.currentBattleType === 'maritime' ? BattleType.Maritime : BattleType.Terrestrial;

        // Helper to get units from a grid container
        const getUnitsFromGrid = (gridId) => {
            const grid = document.getElementById(gridId);
            const cards = grid.querySelectorAll('.unit-card');
            const units = [];

            cards.forEach(card => {
                const unitName = card.dataset.unit;
                const quantityInput = card.querySelector('.quantity-input');
                const attackInput = card.querySelector('.attack-upgrade');
                // const defenseInput = card.querySelector('.defense-upgrade'); // TODO: Support defense upgrade in domain

                const quantity = parseInt(quantityInput.value) || 0;
                const upgradeLevel = parseInt(attackInput.value) || 0;

                if (quantity > 0) {
                    units.push({
                        name: unitName,
                        quantity: quantity,
                        upgradeLevel: upgradeLevel
                    });
                }
            });
            return units;
        };

        const attackerUnits = getUnitsFromGrid('attacker-grid');
        const defenderUnits = getUnitsFromGrid('defender-grid');

        if (attackerUnits.length === 0 || defenderUnits.length === 0) {
            alert('Both sides need at least one unit!');
            return null;
        }

        let level1, level2;
        if (battleType === BattleType.Terrestrial) {
            level1 = parseInt(document.getElementById('townHallLevel').value) || 0;
            level2 = parseInt(document.getElementById('wallLevel').value) || 0;
        } else {
            level1 = parseInt(document.getElementById('portLevel').value) || 0;
            level2 = 0;
        }

        return {
            battleType,
            level1,
            level2,
            attacker: {
                units: attackerUnits,
                hephaestusLevel: parseInt(document.getElementById('attacker-hephaestus').value) || 0
            },
            defender: {
                units: defenderUnits,
                hephaestusLevel: parseInt(document.getElementById('defender-hephaestus').value) || 0
            }
        };
    }

    showNotification(message) {
        const toast = document.getElementById('notification-toast');
        const messageSpan = document.getElementById('toast-message');

        messageSpan.textContent = message;
        toast.classList.remove('hidden');

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }

    // Save Config Modal Methods
    saveConfig() {
        const modal = document.getElementById('save-modal');
        const input = document.getElementById('config-name');
        input.value = '';
        modal.classList.remove('hidden');
        input.focus();
    }

    closeSaveModal() {
        const modal = document.getElementById('save-modal');
        modal.classList.add('hidden');
    }

    confirmSaveConfig() {
        const nameInput = document.getElementById('config-name');
        const name = nameInput.value.trim();

        if (!name) {
            this.showNotification('⚠ Debes ingresar un nombre');
            return;
        }

        const config = {
            name: name,
            date: new Date().toISOString(),
            battleType: this.currentBattleType,
            townHall: document.getElementById('townHallLevel').value,
            wall: document.getElementById('wallLevel').value,
            port: document.getElementById('portLevel').value,
            attackerHephaestus: document.getElementById('attacker-hephaestus').value,
            defenderHephaestus: document.getElementById('defender-hephaestus').value,
            attacker: this.getGridState('attacker-grid'),
            defender: this.getGridState('defender-grid')
        };

        // Get existing configs
        const configs = this.getSavedConfigs();
        configs.push(config);
        localStorage.setItem('battleConfigs', JSON.stringify(configs));

        this.closeSaveModal();
        this.showNotification(`✓ Configuración "${name}" guardada`);
    }

    getSavedConfigs() {
        const saved = localStorage.getItem('battleConfigs');
        return saved ? JSON.parse(saved) : [];
    }

    getGridState(gridId) {
        const grid = document.getElementById(gridId);
        const cards = grid.querySelectorAll('.unit-card');
        const state = {};
        cards.forEach(card => {
            const unit = card.dataset.unit;
            const qty = card.querySelector('.quantity-input').value;
            const upg = card.querySelector('.attack-upgrade').value;
            if (parseInt(qty) > 0 || parseInt(upg) > 0) {
                state[unit] = { qty, upg };
            }
        });
        return state;
    }

    // Load Config Modal Methods
    loadConfig() {
        const configs = this.getSavedConfigs();
        if (configs.length === 0) {
            this.showNotification('⚠ No hay configuraciones guardadas');
            return;
        }

        const modal = document.getElementById('load-modal');
        const list = document.getElementById('config-list');

        list.innerHTML = configs.map((config, index) => {
            const date = new Date(config.date);
            const dateStr = date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="config-item">
                    <div class="config-item-info">
                        <div class="config-item-name">${config.name}</div>
                        <div class="config-item-date">${dateStr} - ${config.battleType === 'terrestrial' ? 'Terrestre' : 'Marítima'}</div>
                    </div>
                    <div class="config-item-actions">
                        <button type="button" class="config-item-btn" onclick="app.applyConfig(${index})">Cargar</button>
                        <button type="button" class="config-item-btn delete" onclick="app.deleteConfig(${index}, event)">Eliminar</button>
                    </div>
                </div>
            `;
        }).join('');

        modal.classList.remove('hidden');
    }

    closeLoadModal() {
        const modal = document.getElementById('load-modal');
        modal.classList.add('hidden');
    }

    applyConfig(index) {
        const configs = this.getSavedConfigs();
        const config = configs[index];

        if (!config) return;

        this.setBattleType(config.battleType);
        document.getElementById('townHallLevel').value = config.townHall || 25;
        document.getElementById('wallLevel').value = config.wall || 0;
        document.getElementById('portLevel').value = config.port || 20;

        if (config.attackerHephaestus !== undefined) {
            document.getElementById('attacker-hephaestus').value = config.attackerHephaestus;
        }
        if (config.defenderHephaestus !== undefined) {
            document.getElementById('defender-hephaestus').value = config.defenderHephaestus;
        }

        this.loadGridState('attacker-grid', config.attacker);
        this.loadGridState('defender-grid', config.defender);

        this.updateMatrixPreview();
        this.closeLoadModal();
        this.showNotification(`✓ Configuración "${config.name}" cargada`);
    }

    deleteConfig(index, event) {
        event.stopPropagation();

        const configs = this.getSavedConfigs();
        const configName = configs[index].name;

        if (confirm(`¿Eliminar la configuración "${configName}"?`)) {
            configs.splice(index, 1);
            localStorage.setItem('battleConfigs', JSON.stringify(configs));
            this.showNotification(`✓ Configuración "${configName}" eliminada`);

            // Refresh the list
            this.closeLoadModal();
            if (configs.length > 0) {
                setTimeout(() => this.loadConfig(), 100);
            }
        }
    }

    loadGridState(gridId, state) {
        if (!state) return;
        const grid = document.getElementById(gridId);
        const cards = grid.querySelectorAll('.unit-card');
        cards.forEach(card => {
            const unit = card.dataset.unit;
            if (state[unit]) {
                card.querySelector('.quantity-input').value = state[unit].qty;
                card.querySelector('.attack-upgrade').value = state[unit].upg;
            } else {
                card.querySelector('.quantity-input').value = 0;
                card.querySelector('.attack-upgrade').value = 0;
            }
        });
    }

    runSimulation() {
        const config = this.buildBattleConfiguration();
        if (!config) return;

        console.log('Starting simulation with config:', config);
        // Implementation for full battle simulation (can be added later or linked to existing use case)
        const report = this.useCase.execute(config);
        console.log('Battle Report:', report);
        alert('Battle simulation complete! Check console for report.');
    }

    startStepMode() {
        const config = this.buildBattleConfiguration();
        if (!config) return;

        this.stepMode = true;
        this.stepUseCase.startBattle(config);

        // Initialize battlefield matrix
        const battlefield = this.stepUseCase.getBattlefield();
        if (battlefield) {
            this.battlefieldMatrix.initialize(
                config.battleType,
                battlefield.effectiveLevel,
                battlefield.attackerLines,
                battlefield.defenderLines
            );
            this.battlefieldMatrix.render('attacker-matrix'); // Render to attacker matrix for now
            // TODO: We need to decide how to render both matrices or just one shared one in step mode
            // For now, let's render to the attacker's matrix container as a placeholder
        }

        // Hide config screen elements if needed, or overlay step controls
        document.querySelector('.step-controls').style.display = 'block';
        document.querySelector('.next-round-button').disabled = false;
        document.querySelector('.reset-button').disabled = false;

        this.updateRoundDisplay(0, 'Ready');
        this.executeNextRound();
    }

    executeNextRound() {
        if (!this.stepMode || !this.stepUseCase.isInitialized()) return;

        const result = this.stepUseCase.nextRound();
        this.currentReport = result.report;
        this.updateRoundDisplay(result.currentRound, result.status);

        const battlefield = this.stepUseCase.getBattlefield();
        if (battlefield) {
            this.battlefieldMatrix.update(battlefield.attackerLines, battlefield.defenderLines);
        }

        if (result.completed) {
            document.querySelector('.next-round-button').disabled = true;
        }
    }

    updateRoundDisplay(round, status) {
        const roundEl = document.getElementById('current-round');
        const statusEl = document.getElementById('battle-status');
        if (roundEl) roundEl.textContent = round;
        if (statusEl) statusEl.textContent = status;
    }

    resetBattle() {
        this.stepMode = false;
        this.stepUseCase.reset();
        document.querySelector('.step-controls').style.display = 'none';

        // Reset matrix?
    }
}

// Initialize App
window.app = new BattleSimulatorApp();
