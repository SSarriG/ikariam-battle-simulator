// Main UI Controller
console.log('Bundle execution started');
import { BattleSimulationUseCase } from '../../src/application/BattleSimulationUseCase';
import { StepBattleSimulationUseCase } from '../../src/application/StepBattleSimulationUseCase';
import { LocalStorageRepository } from '../../src/infrastructure/LocalStorageRepository';
import { BattleType } from '../../src/domain/enums';

console.log('Imports completed');

const TERRESTRIAL_UNITS = [
    { value: 'hoplita', label: 'Hoplita' },
    { value: 'espadachin', label: 'Espadachín' },
    { value: 'lancero', label: 'Lancero' },
    { value: 'arquero', label: 'Arquero' },
    { value: 'hondero', label: 'Hondero' },
    { value: 'fusilero', label: 'Fusilero' },
    { value: 'catapulta', label: 'Catapulta' },
    { value: 'mortero', label: 'Mortero' },
    { value: 'ariete', label: 'Ariete' },
    { value: 'gigante-vapor', label: 'Gigante a Vapor' },
    { value: 'girocoptero', label: 'Girocóptero' },
    { value: 'bombardero', label: 'Bombardero' },
    { value: 'cocinero', label: 'Cocinero' },
    { value: 'medico', label: 'Médico' },
    // Unidades Bárbaras Terrestres
    { value: 'agitador-hachas-barbaro', label: 'Agitador de Hachas Bárbaro' },
    { value: 'aporreador-barbaro', label: 'Aporreador Bárbaro' },
    { value: 'unidad-guerra-barbara', label: 'Unidad de Guerra Bárbara' },
    { value: 'clava-cuchillos-barbaro', label: 'Clava y Cuchillos Bárbaro' },
    { value: 'lanzahachas-barbaro', label: 'Lanzahachas Bárbaro' },
    { value: 'ariete-barbaro', label: 'Ariete Bárbaro' },
    { value: 'catapulta-barbara', label: 'Catapulta Bárbara' },
    { value: 'dirigible-barbaro', label: 'Dirigible Bárbaro' },
    { value: 'caza-barbaro', label: 'Caza Bárbaro' }
];

const MARITIME_UNITS = [
    { value: 'barco-espolon-comun', label: 'Barco Espolón' },
    { value: 'barco-lanzallamas', label: 'Barco Lanzallamas' },
    { value: 'barco-espolon-vapor', label: 'Barco Espolón a Vapor' },
    { value: 'barco-ballesta', label: 'Barco Ballesta' },
    { value: 'barco-catapulta', label: 'Barco Catapulta' },
    { value: 'barco-mortero', label: 'Barco Mortero' },
    { value: 'barco-lanzamisiles', label: 'Barco Lanzamisiles' },
    { value: 'submarino', label: 'Submarino' },
    { value: 'lancha-palas', label: 'Lancha de Palas' },
    { value: 'barco-portaglobos', label: 'Portaglobos' },
    // Unidades Bárbaras Marítimas
    { value: 'rompelanchas', label: 'Rompelanchas' },
    { value: 'rajavelas', label: 'Rajavelas' },
    { value: 'pirobarco', label: 'Pirobarco' },
    { value: 'tiraguijarros', label: 'Tiraguijarros' },
    { value: 'cuña', label: 'Cuña' },
    { value: 'catapulta-polvora', label: 'Catapulta de Pólvora' },
    { value: 'terror-profundidades-marinas', label: 'Terror de las Profundidades' },
    { value: 'fuego-dragon', label: 'Fuego de Dragón' },
    { value: 'encendedor-zepelin', label: 'Encendedor de Zepelín' },
    { value: 'Nido-barbaros', label: 'Nido de Bárbaros' }
];

class BattleSimulatorApp {
    constructor() {
        console.log('BattleSimulatorApp constructor started');
        try {
            this.useCase = new BattleSimulationUseCase();
            console.log('BattleSimulationUseCase initialized');
            this.stepUseCase = new StepBattleSimulationUseCase();
            console.log('StepBattleSimulationUseCase initialized');
            this.repository = new LocalStorageRepository();
            this.currentReport = null;
            this.stepMode = false; // Track if we're in step-by-step mode

            if (window.BattlefieldMatrix) {
                this.battlefieldMatrix = new window.BattlefieldMatrix(); // Battlefield visualization
                console.log('BattlefieldMatrix initialized');
            } else {
                console.error('window.BattlefieldMatrix is undefined');
            }
        } catch (e) {
            console.error('Error in constructor:', e);
        }

        this.attackerUnits = [];
        this.defenderUnits = [];
        this.currentSide = null; // Track which side we're adding to

        // Bind methods to ensure 'this' context is correct
        this.updateUnitOptions = this.updateUnitOptions.bind(this);
        this.handleBattleTypeChange = this.handleBattleTypeChange.bind(this);
        this.addUnit = this.addUnit.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.confirmAddUnit = this.confirmAddUnit.bind(this);

        // Setup  event listeners
        this.setupEventListeners();

        // Initialize unit options based on default battle type
        this.updateUnitOptions();
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        // Battle Type Change
        const battleTypeSelect = document.getElementById('battleType');
        if (battleTypeSelect) {
            console.log('Found battleType select');
            battleTypeSelect.addEventListener('change', this.handleBattleTypeChange);
        } else {
            console.error('battleType select NOT found');
        }

        // Full battle button
        const startButton = document.querySelector('.start-button');
        if (startButton) {
            startButton.addEventListener('click', () => this.runSimulation());
        }

        // Step mode start button
        const stepStartButton = document.querySelector('.step-start-button');
        if (stepStartButton) {
            stepStartButton.addEventListener('click', () => this.startStepMode());
        }

        // Next round button
        const nextRoundButton = document.querySelector('.next-round-button');
        if (nextRoundButton) {
            nextRoundButton.addEventListener('click', () => this.executeNextRound());
        }

        // Reset button
        const resetButton = document.querySelector('.reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetBattle());
        }

        // Add Unit buttons
        const addAttackerUnitBtn = document.getElementById('addAttackerUnitBtn');
        if (addAttackerUnitBtn) {
            console.log('Found addAttackerUnitBtn');
            addAttackerUnitBtn.addEventListener('click', () => {
                console.log('Clicked addAttackerUnitBtn');
                this.addUnit('attacker');
            });
        } else {
            console.error('addAttackerUnitBtn NOT found');
        }

        const addDefenderUnitBtn = document.getElementById('addDefenderUnitBtn');
        if (addDefenderUnitBtn) {
            console.log('Found addDefenderUnitBtn');
            addDefenderUnitBtn.addEventListener('click', () => {
                console.log('Clicked addDefenderUnitBtn');
                this.addUnit('defender');
            });
        } else {
            console.error('addDefenderUnitBtn NOT found');
        }

        // Modal close button
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        // Modal cancel button
        const modalCancel = document.getElementById('modalCancel');
        if (modalCancel) {
            modalCancel.addEventListener('click', () => this.closeModal());
        }

        // Modal confirm button
        const modalConfirm = document.getElementById('modalConfirm');
        if (modalConfirm) {
            modalConfirm.addEventListener('click', () => this.confirmAddUnit());
        }
    }

    handleBattleTypeChange() {
        const battleType = document.getElementById('battleType').value;
        const terrestrialConfig = document.getElementById('terrestrial-config');
        const maritimeConfig = document.getElementById('maritime-config');

        if (battleType === 'terrestrial') {
            terrestrialConfig.style.display = 'block';
            maritimeConfig.style.display = 'none';
        } else {
            terrestrialConfig.style.display = 'none';
            maritimeConfig.style.display = 'block';
        }

        // Clear existing units as they might be incompatible
        this.attackerUnits = [];
        this.defenderUnits = [];
        this.renderUnits('attacker');
        this.renderUnits('defender');

        // Update dropdown options
        this.updateUnitOptions();
    }

    updateUnitOptions() {
        const battleType = document.getElementById('battleType').value;
        const unitSelect = document.getElementById('modalUnitName');
        const units = battleType === 'maritime' ? MARITIME_UNITS : TERRESTRIAL_UNITS;

        unitSelect.innerHTML = units.map(unit =>
            `<option value="${unit.value}">${unit.label}</option>`
        ).join('');
    }

    startStepMode() {
        const config = this.buildBattleConfiguration();
        if (!config) return;

        this.stepMode = true;
        this.stepUseCase.startBattle(config);

        // Initialize battlefield matrix
        const battlefield = this.stepUseCase.getBattlefield();
        if (battlefield) {
            // Pass effectiveLevel to initialize
            this.battlefieldMatrix.initialize(
                config.battleType,
                battlefield.effectiveLevel,
                battlefield.attackerLines,
                battlefield.defenderLines
            );
            this.battlefieldMatrix.render('battlefield-matrix-container');
        }

        // Hide config screen, show battle controls
        document.getElementById('config-screen').classList.add('hidden');
        document.querySelector('.step-controls').style.display = 'block';

        // Enable next round button
        document.querySelector('.next-round-button').disabled = false;
        document.querySelector('.reset-button').disabled = false;

        // Update status and show initial state
        this.updateRoundDisplay(0, 'Ready');
        this.updateLiveStatus();

        // Auto-execute first round
        this.executeNextRound();
    }

    executeNextRound() {
        if (!this.stepMode || !this.stepUseCase.isInitialized()) {
            console.error('Step mode not initialized');
            return;
        }

        const result = this.stepUseCase.nextRound();

        // Store the report (even if partial) so updateLiveStatus can use it
        if (result.report) {
            this.currentReport = result.report;
        }

        // Update round display
        this.updateRoundDisplay(result.currentRound, result.status);

        // Update live battlefield status
        this.updateLiveStatus();

        // Update battlefield matrix visualization
        const battlefield = this.stepUseCase.getBattlefield();
        if (battlefield) {
            this.battlefieldMatrix.update(battlefield.attackerLines, battlefield.defenderLines);
        }

        // If battle is complete, show final report
        if (result.completed && result.report) {
            this.displayReport(result.report);
            document.querySelector('.next-round-button').disabled = true;
        }
    }

    updateRoundDisplay(round, status) {
        document.getElementById('current-round').textContent = round;
        document.getElementById('battle-status').textContent = status;
    }

    updateLiveStatus() {
        const battlefield = this.stepUseCase.getBattlefield();
        // Use the stored report if available, otherwise don't call getReport() as it might execute a round
        const report = this.currentReport;

        // Count alive units for each side (Active + Reserves)
        let attackerActive = 0;
        let attackerReserves = 0;
        let defenderActive = 0;
        let defenderReserves = 0;

        battlefield.attackerLines.forEach(line => {
            attackerActive += line.getAllAliveUnits().length;
            attackerReserves += line.reserves.length;
        });

        battlefield.defenderLines.forEach(line => {
            defenderActive += line.getAllAliveUnits().length;
            defenderReserves += line.reserves.length;
        });

        const attackerTotalAlive = attackerActive + attackerReserves;
        const defenderTotalAlive = defenderActive + defenderReserves;

        // Get initial counts from configuration
        const attackerInitial = this.attackerUnits.reduce((sum, u) => sum + u.quantity, 0);
        const defenderInitial = this.defenderUnits.reduce((sum, u) => sum + u.quantity, 0);

        // Calculate Generals Lost
        let attackerGeneralsLost = 0;
        let defenderGeneralsLost = 0;

        if (this.currentReport) {
            this.currentReport.attackerUnits.forEach(u => {
                if (!u.isAlive) {
                    attackerGeneralsLost += this.getUnitCost(u.name);
                }
            });

            this.currentReport.defenderUnits.forEach(u => {
                if (!u.isAlive) {
                    defenderGeneralsLost += this.getUnitCost(u.name);
                }
            });
        }

        // Update display
        // Attacker
        document.getElementById('live-attacker-alive').textContent = `${attackerActive} (+${attackerReserves} Res)`;
        document.getElementById('live-attacker-casualties').textContent = attackerInitial - attackerTotalAlive;

        // Add Generals Lost to Attacker Display
        const attackerDamageElem = document.getElementById('live-attacker-damage');
        attackerDamageElem.innerHTML = `${this.currentReport ? Math.floor(this.currentReport.attackerTotalDamage) : 0}<br><span class="generals-lost" style="font-size: 0.9em; color: #d32f2f;">Generals Lost: ${attackerGeneralsLost.toFixed(1)}</span>`;

        // Defender
        document.getElementById('live-defender-alive').textContent = `${defenderActive} (+${defenderReserves} Res)`;
        document.getElementById('live-defender-casualties').textContent = defenderInitial - defenderTotalAlive;

        // Add Generals Lost to Defender Display
        const defenderDamageElem = document.getElementById('live-defender-damage');
        defenderDamageElem.innerHTML = `${this.currentReport ? Math.floor(this.currentReport.defenderTotalDamage) : 0}<br><span class="generals-lost" style="font-size: 0.9em; color: #d32f2f;">Generals Lost: ${defenderGeneralsLost.toFixed(1)}</span>`;
    }

    getUnitCost(unitName) {
        const costs = {
            'hoplita': 1.4,
            'gigante-vapor': 6.2,
            'lancero': 0.6,
            'espadachin': 1.2,
            'hondero': 0.4,
            'arquero': 1.1,
            'fusilero': 4,
            'ariete': 4.4,
            'catapulta': 11.2,
            'mortero': 31,
            'girocoptero': 2.5,
            'bombardero': 5.8,
            'barco-lanzallamas': 6.2,
            'barco-espolon-vapor': 24,
            'barco-espolon-comun': 5,
            'barco-ballesta': 6.8,
            'barco-catapulta': 6.4,
            'barco-mortero': 22.4,
            'submarino': 20.2,
            'barco-lanzamisiles': 28,
            'lancha-palas': 6.4,
            'barco-portaglobos': 28,
            'medico': 10, // Assumption
            'cocinero': 10 // Assumption
        };
        return costs[unitName] || 0;
    }

    resetBattle() {
        this.stepMode = false;
        this.stepUseCase.reset();

        // Hide step controls and report
        const stepControls = document.querySelector('.step-controls');
        if (stepControls) {
            stepControls.style.display = 'none';
        }
        document.getElementById('report-screen').classList.add('hidden');

        // Show config screen
        document.getElementById('config-screen').classList.remove('hidden');

        // Reset display
        this.updateRoundDisplay(0, 'Not Started');
        const nextRoundBtn = document.querySelector('.next-round-button');
        const resetBtn = document.querySelector('.reset-button');
        if (nextRoundBtn) nextRoundBtn.disabled = true;
        if (resetBtn) resetBtn.disabled = true;
    }

    buildBattleConfiguration() {
        if (this.attackerUnits.length === 0 || this.defenderUnits.length === 0) {
            alert('Both sides need at least one unit!');
            return null;
        }

        const battleTypeValue = document.getElementById('battleType').value;
        const battleType = battleTypeValue === 'maritime' ? BattleType.Maritime : BattleType.Terrestrial;

        let level1, level2;

        if (battleType === BattleType.Terrestrial) {
            level1 = parseInt(document.getElementById('townHallLevel').value);
            level2 = parseInt(document.getElementById('wallLevel').value);
        } else {
            level1 = parseInt(document.getElementById('portLevel').value);
            level2 = 0; // No wall in maritime
        }

        return {
            battleType,
            level1, // Town Hall or Port
            level2, // Wall
            attacker: {
                units: this.attackerUnits,
                hephaestusLevel: parseInt(document.getElementById('attackerHephaestus').value)
            },
            defender: {
                units: this.defenderUnits,
                hephaestusLevel: parseInt(document.getElementById('defenderHephaestus').value)
            }
        };
    }

    addUnit(side) {
        this.currentSide = side;
        document.getElementById('addUnitModal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('addUnitModal').classList.add('hidden');
        this.currentSide = null;
    }

    confirmAddUnit() {
        const unitName = document.getElementById('modalUnitName').value;
        const quantity = parseInt(document.getElementById('modalQuantity').value);
        const upgradeLevel = parseInt(document.getElementById('modalUpgradeLevel').value);

        if (isNaN(quantity) || quantity <= 0) {
            alert('Invalid quantity');
            return;
        }

        const unit = { name: unitName, quantity, upgradeLevel };

        if (this.currentSide === 'attacker') {
            this.attackerUnits.push(unit);
            this.renderUnits('attacker');
        } else {
            this.defenderUnits.push(unit);
            this.renderUnits('defender');
        }

        this.closeModal();
    }

    removeUnit(side, index) {
        if (side === 'attacker') {
            this.attackerUnits.splice(index, 1);
            this.renderUnits('attacker');
        } else {
            this.defenderUnits.splice(index, 1);
            this.renderUnits('defender');
        }
    }

    renderUnits(side) {
        const container = document.getElementById(`${side}Units`);
        const units = side === 'attacker' ? this.attackerUnits : this.defenderUnits;

        container.innerHTML = units.map((unit, index) => `
            <div class="card-game unit-card">
                <img src="assets/units/${unit.name}.png" 
                     alt="${unit.name}" 
                     class="unit-icon"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22><rect width=%2232%22 height=%2232%22 fill=%22%23eccf8e%22/><text x=%2216%22 y=%2220%22 text-anchor=%22middle%22 font-size=%2224%22>?</text></svg>'">
                <span class="unit-name">${unit.name}</span>
                <span class="unit-count">x ${unit.quantity}</span>
                <span class="unit-count">(Upgrade ${unit.upgradeLevel})</span>
                <button class="btn-game btn-sm" onclick="app.removeUnit('${side}', ${index})">🗑️</button>
            </div>
        `).join('');
    }

    runSimulation() {
        if (this.attackerUnits.length === 0 || this.defenderUnits.length === 0) {
            alert('Both sides must have at least one unit');
            return;
        }

        const battleTypeValue = document.getElementById('battleType').value;
        const battleType = battleTypeValue === 'terrestrial' ? BattleType.Terrestrial : BattleType.Maritime;

        let level1, level2;

        if (battleType === BattleType.Terrestrial) {
            level1 = parseInt(document.getElementById('townHallLevel').value);
            level2 = parseInt(document.getElementById('wallLevel').value);
        } else {
            level1 = parseInt(document.getElementById('portLevel').value);
            level2 = 0;
        }

        const attackerHephaestus = parseInt(document.getElementById('attackerHephaestus').value);
        const defenderHephaestus = parseInt(document.getElementById('defenderHephaestus').value);

        const config = {
            battleType,
            level1,
            level2,
            attacker: {
                units: this.attackerUnits,
                hephaestusLevel: attackerHephaestus
            },
            defender: {
                units: this.defenderUnits,
                hephaestusLevel: defenderHephaestus
            }
        };

        try {
            this.currentReport = this.useCase.execute(config);
            this.showReport();
        } catch (error) {
            alert(`Error running simulation: ${error.message}`);
            console.error(error);
        }
    }

    showReport() {
        document.getElementById('config-screen').classList.add('hidden');
        document.getElementById('report-screen').classList.remove('hidden');

        const report = this.currentReport;

        // Winner
        document.getElementById('winnerBanner').textContent =
            `🏆 WINNER: ${report.winner.toUpperCase()}`;

        // Stats
        const attackerStats = this.calculateSideStats(report.attackerUnits);
        const defenderStats = this.calculateSideStats(report.defenderUnits);

        document.getElementById('attackerInitial').textContent =
            `Initial: ${attackerStats.initial}`;
        document.getElementById('attackerSurviving').textContent =
            `Surviving: ${attackerStats.surviving} (${attackerStats.survivalRate}%)`;
        document.getElementById('attackerCasualties').textContent =
            `Casualties: ${attackerStats.casualties}`;
        document.getElementById('attackerDamage').textContent =
            `Damage Dealt: ${report.attackerTotalDamage.toFixed(0)}`;

        document.getElementById('defenderInitial').textContent =
            `Initial: ${defenderStats.initial}`;
        document.getElementById('defenderSurviving').textContent =
            `Surviving: ${defenderStats.surviving} (${defenderStats.survivalRate}%)`;
        document.getElementById('defenderCasualties').textContent =
            `Casualties: ${defenderStats.casualties}`;
        document.getElementById('defenderDamage').textContent =
            `Damage Dealt: ${report.defenderTotalDamage.toFixed(0)}`;

        // Unit table
        this.renderUnitTable(report);
    }

    calculateSideStats(units) {
        const initial = units.length;
        const surviving = units.filter(u => u.isAlive).length;
        const casualties = initial - surviving;
        const survivalRate = ((surviving / initial) * 100).toFixed(1);

        return { initial, surviving, casualties, survivalRate };
    }

    renderUnitTable(report) {
        const tbody = document.getElementById('unitStatsTable');
        const allUnits = [...report.attackerUnits, ...report.defenderUnits];

        tbody.innerHTML = allUnits.map(unit => `
            <tr>
                <td>${unit.name}</td>
                <td>${unit.initialHP.toFixed(0)}</td>
                <td>${unit.currentHP.toFixed(0)}</td>
                <td>${unit.isAlive ? 'Alive' : 'Dead'}</td>
                <td>${unit.damageDealt.toFixed(0)}</td>
            </tr>
        `).join('');
    }

    exportJSON() {
        const json = JSON.stringify(this.currentReport, null, 2);
        this.downloadFile(json, 'battle-report.json', 'application/json');
    }

    exportTXT() {
        const txt = this.generateTextReport(this.currentReport);
        this.downloadFile(txt, 'battle-report.txt', 'text/plain');
    }

    generateTextReport(report) {
        return `
=====================================
IKARIAM BATTLE REPORT
=====================================
Winner: ${report.winner.toUpperCase()}
Total Rounds: ${report.totalRounds}

ATTACKER:
  Total Damage: ${report.attackerTotalDamage.toFixed(0)}
  Units Lost: ${report.attackerUnitsLost}

DEFENDER:
  Total Damage: ${report.defenderTotalDamage.toFixed(0)}
  Units Lost: ${report.defenderUnitsLost}

=====================================
        `.trim();
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    saveConfig() {
        const name = prompt('Enter configuration name:');
        if (!name) return;

        const battleTypeValue = document.getElementById('battleType').value;
        let level1, level2;

        if (battleTypeValue === 'terrestrial') {
            level1 = parseInt(document.getElementById('townHallLevel').value);
            level2 = parseInt(document.getElementById('wallLevel').value);
        } else {
            level1 = parseInt(document.getElementById('portLevel').value);
            level2 = 0;
        }

        const config = {
            battleType: battleTypeValue,
            level1,
            level2,
            attacker: {
                units: this.attackerUnits,
                hephaestusLevel: parseInt(document.getElementById('attackerHephaestus').value)
            },
            defender: {
                units: this.defenderUnits,
                hephaestusLevel: parseInt(document.getElementById('defenderHephaestus').value)
            }
        };

        this.repository.saveConfiguration(name, config);
        alert(`Configuration "${name}" saved!`);
    }

    loadConfig() {
        const configs = this.repository.listConfigurations();
        if (configs.length === 0) {
            alert('No saved configurations');
            return;
        }

        const name = prompt(`Available configs:\n${configs.join('\n')}\n\nEnter name to load:`);
        if (!name) return;

        const config = this.repository.loadConfiguration(name);
        if (!config) {
            alert('Configuration not found');
            return;
        }

        // Load config into UI
        document.getElementById('battleType').value = config.battleType;

        // Trigger change event to update UI visibility
        this.handleBattleTypeChange();

        // Set levels based on type
        if (config.battleType === 'terrestrial') {
            document.getElementById('townHallLevel').value = config.level1 || 25;
            document.getElementById('wallLevel').value = config.level2 || 0;
        } else {
            document.getElementById('portLevel').value = config.level1 || 20;
        }

        document.getElementById('attackerHephaestus').value = config.attacker.hephaestusLevel;
        document.getElementById('defenderHephaestus').value = config.defender.hephaestusLevel;

        this.attackerUnits = config.attacker.units;
        this.defenderUnits = config.defender.units;

        this.renderUnits('attacker');
        this.renderUnits('defender');

        // Update unit options based on loaded battle type
        this.updateUnitOptions();

        alert(`Configuration "${name}" loaded!`);
    }

    newBattle() {
        document.getElementById('config-screen').classList.remove('hidden');
        document.getElementById('report-screen').classList.add('hidden');
        this.currentReport = null;
    }

    displayReport(report) {
        // Alias for showReport if needed, or implement if different
        this.currentReport = report;
        this.showReport();
    }
}

// Initialize app
window.app = new BattleSimulatorApp();
