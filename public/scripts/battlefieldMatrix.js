/**
 * Battlefield Matrix Visualization
 * Displays a 3x13 grid showing unit positions, HP/ammo bars, and casualties
 */

class BattlefieldMatrix {
    constructor() {
        this.fieldConfig = null;
        this.attackerData = null;
        this.defenderData = null;
        // Cache to remember last unit in each slot
        // Format: { 'attacker-primera-linea-0': { name: 'hoplita', upgradeLevel: 2 }, ... }
        this.slotHistory = {};
    }

    /**
     * Initialize with battlefield configuration
     */
    initialize(battleType, cityLevel, attackerLines, defenderLines) {
        this.loadFieldConfig(battleType, cityLevel);
        this.attackerData = this.extractLineData(attackerLines);
        this.defenderData = this.extractLineData(defenderLines);
    }

    /**
     * Load field configuration from embedded data (matching campos.json)
     */
    loadFieldConfig(battleType, cityLevel) {
        // Embedded campos.json data
        const camposData = {
            "terrestre": [
                { min: 1, max: 4, config: { "primera-linea": 3, "luchadores-distancia": 3, "flancos": 0, "artilleria": 1, "bombarderos": 1, "anti-aerea": 1 } },
                { min: 5, max: 9, config: { "primera-linea": 5, "luchadores-distancia": 5, "flancos": 2, "artilleria": 2, "bombarderos": 1, "anti-aerea": 1 } },
                { min: 10, max: 16, config: { "primera-linea": 7, "luchadores-distancia": 7, "flancos": 4, "artilleria": 3, "bombarderos": 1, "anti-aerea": 1 } },
                { min: 17, max: 24, config: { "primera-linea": 7, "luchadores-distancia": 7, "flancos": 6, "artilleria": 4, "bombarderos": 2, "anti-aerea": 2 } },
                { min: 25, max: 100, config: { "primera-linea": 7, "luchadores-distancia": 7, "flancos": 6, "artilleria": 5, "bombarderos": 2, "anti-aerea": 2 } }
            ],
            "maritima": [
                { min: 0, max: 7, config: { "primera-linea": 3, "luchadores-distancia": 3, "flancos": 0, "artilleria": 1, "bombarderos": 1, "anti-aerea": 1 } },
                { min: 8, max: 14, config: { "primera-linea": 5, "luchadores-distancia": 5, "flancos": 2, "artilleria": 2, "bombarderos": 1, "anti-aerea": 1 } },
                { min: 15, max: 21, config: { "primera-linea": 7, "luchadores-distancia": 7, "flancos": 4, "artilleria": 3, "bombarderos": 1, "anti-aerea": 1 } },
                { min: 22, max: 28, config: { "primera-linea": 7, "luchadores-distancia": 7, "flancos": 6, "artilleria": 4, "bombarderos": 2, "anti-aerea": 2 } },
                { min: 29, max: 100, config: { "primera-linea": 7, "luchadores-distancia": 7, "flancos": 6, "artilleria": 5, "bombarderos": 2, "anti-aerea": 2 } }
            ]
        };

        const typeData = camposData[battleType] || camposData['terrestre'];
        const levelConfig = typeData.find(c => cityLevel >= c.min && cityLevel <= c.max) || typeData[typeData.length - 1];

        // Transform to expected format
        this.fieldConfig = {};
        for (const [key, num] of Object.entries(levelConfig.config)) {
            this.fieldConfig[key] = { numSlots: num };
        }
    }

    /**
     * Extract data from BattleLines
     */
    extractLineData(lines) {
        const data = {};
        for (const [lineType, line] of lines.entries()) {
            data[lineType] = {
                slots: line.slots.map(slot => {
                    const aliveUnits = slot.getAliveUnits();
                    const allUnits = slot.units;
                    const deadUnits = slot.deadUnitsThisRound || [];
                    const deathsCount = deadUnits.length || (slot.deathsThisRound || 0); // Fallback

                    return {
                        units: aliveUnits,
                        totalUnits: allUnits.length,
                        aliveCount: aliveUnits.length,
                        deadCount: allUnits.length - aliveUnits.length,
                        deathsThisRound: deathsCount,
                        deadUnitsThisRound: deadUnits, // Pass full objects
                        capacity: slot.capacity
                    };
                })
            };
        }
        return data;
    }

    /**
     * Calculate grid position for a slot
     * Returns {row, col} in 3x13 grid
     */
    getSlotPosition(lineType, slotIndex) {
        // Row assignment (from attacker's perspective):
        // Row 0 (top, farthest): Bombers + Artillery + AntiAir
        // Row 1 (middle): Ranged
        // Row 2 (bottom, closest to defender): Flanks + FirstLine

        const config = this.fieldConfig[lineType];
        if (!config) return null;

        const numSlots = config.numSlots;
        const centerCol = 6;

        switch (lineType) {
            case 'primera-linea':
                // Row 2, centered
                // Start col = center - floor(numSlots/2)
                return {
                    row: 2,
                    col: (centerCol - Math.floor(numSlots / 2)) + slotIndex
                };

            case 'luchadores-distancia':
                // Row 1, centered
                return {
                    row: 1,
                    col: (centerCol - Math.floor(numSlots / 2)) + slotIndex
                };

            case 'artilleria':
                // Row 0, centered
                return {
                    row: 0,
                    col: (centerCol - Math.floor(numSlots / 2)) + slotIndex
                };

            case 'flancos':
                // Row 2, alternating extremes
                // Even indices (0, 2...) -> Left side: 0, 1, 2...
                // Odd indices (1, 3...) -> Right side: 12, 11, 10...
                if (slotIndex % 2 === 0) {
                    return { row: 2, col: 0 + (slotIndex / 2) };
                } else {
                    return { row: 2, col: 12 - Math.floor(slotIndex / 2) };
                }

            case 'bombarderos':
                // Row 0, left side (0, 1...)
                return {
                    row: 0,
                    col: slotIndex
                };

            case 'anti-aerea':
                // Row 0, right side (12, 11...)
                // Since filling order is Right->Left (0=Right, 1=Left relative to group),
                // and we want them at the far right of the grid.
                // Slot 0 (Rightmost) -> Col 12
                // Slot 1 (Left of Rightmost) -> Col 11
                return {
                    row: 0,
                    col: 12 - slotIndex
                };

            default:
                return null;
        }
    }

    /**
     * Render the battlefield matrix
     */
    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="battlefield-matrix">
                <h3>⚔️ Attacker</h3>
                <div class="grid attacker-grid" id="attacker-grid"></div>
                
                <div class="battlefield-divider"></div>
                
                <h3>🛡️ Defender</h3>
                <div class="grid defender-grid" id="defender-grid"></div>
            </div>
        `;

        this.renderGrid('attacker-grid', this.attackerData, false);
        this.renderGrid('defender-grid', this.defenderData, true);
    }

    /**
     * Render a single grid (attacker or defender)
     */
    renderGrid(gridId, lineData, isDefender) {
        const grid = document.getElementById(gridId);
        if (!grid) return;

        // Create 3x13 grid
        const gridHTML = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 13; col++) {
                gridHTML.push(`<div class="grid-cell" data-row="${row}" data-col="${col}"></div>`);
            }
        }
        grid.innerHTML = gridHTML.join('');

        // Populate slots
        for (const [lineType, line] of Object.entries(lineData)) {
            line.slots.forEach((slot, slotIndex) => {
                const pos = this.getSlotPosition(lineType, slotIndex);
                if (!pos) return;

                // Mirror defender grid vertically
                const actualRow = isDefender ? (2 - pos.row) : pos.row;
                const cell = grid.querySelector(`[data-row="${actualRow}"][data-col="${pos.col}"]`);

                if (cell) {
                    this.renderSlot(cell, slot, lineType, slotIndex, isDefender);
                }
            });
        }
    }

    /**
     * Render a single slot
     */
    renderSlot(cell, slotData, lineType, slotIndex, isDefender) {
        const units = slotData.units;
        const deathsThisRound = slotData.deathsThisRound || 0;

        // Create unique key for this slot
        const side = isDefender ? 'defender' : 'attacker';
        const slotKey = `${side}-${lineType}-${slotIndex}`;

        // Show slot with last unit image if units just died this round
        if (units.length === 0) {
            // If there were deaths this round and we have history, show the last known unit
            const lastUnit = this.slotHistory[slotKey];
            if (deathsThisRound > 0 && lastUnit) {
                const unitName = lastUnit.name;
                const upgradeLevel = lastUnit.upgradeLevel || 0;

                const tooltipContent = `
                    <strong>${unitName}</strong><br>
                    Eliminadas todas las unidades<br>
                    Nivel de mejora: ${upgradeLevel}
                `.trim();

                cell.innerHTML = `
                    <div class="slot-container eliminated">
                        <div class="slot-upper">
                            <div class="slot-visual" style="background-image: url('/assets/units/${unitName}.png'); opacity: 1.0;"></div>
                            <div class="bars-container">
                                <div class="bar-vertical hp">
                                    <div class="fill" style="height: 0%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="counter-tag dead-only">0 <span class="deaths-round">(-${deathsThisRound})</span></div>
                        <div class="tooltip">${tooltipContent}</div>
                    </div>
                `;
            } else {
                // Regular empty slot
                cell.innerHTML = `
                    <div class="slot-container empty-slot">
                        <div class="slot-upper">
                            <div class="slot-visual"></div>
                        </div>
                        ${(slotData.deadCount > 0 || deathsThisRound > 0) ?
                        `<div class="counter-tag dead-only">0${deathsThisRound > 0 ? ` (-${deathsThisRound})` : ''}</div>`
                        : ''}
                    </div>
                `;
            }
            return;
        }

        // Get first unit for image and stats
        const firstUnit = units[0];
        const unitName = firstUnit.name;
        const upgradeLevel = firstUnit.upgradeLevel || 0;

        // Store in history cache for later use when slot becomes empty
        this.slotHistory[slotKey] = {
            name: unitName,
            upgradeLevel: upgradeLevel
        };

        // Calculate aggregate stats
        const totalHP = units.reduce((sum, u) => sum + u.currentHP, 0);
        const maxHP = units.reduce((sum, u) => sum + u.stats.baseHP, 0);
        const hpPercent = Math.max(0, Math.min(100, (totalHP / maxHP) * 100));

        // Check if units have ammunition
        const hasAmmo = firstUnit.stats.ammunition !== null;
        let ammoPercent = 100;
        let ammoText = '';
        if (hasAmmo) {
            const totalAmmo = units.reduce((sum, u) => sum + (u.currentAmmunition || 0), 0);
            const maxAmmo = units.reduce((sum, u) => sum + (u.stats.ammunition || 0), 0);
            ammoPercent = maxAmmo > 0 ? Math.max(0, Math.min(100, (totalAmmo / maxAmmo) * 100)) : 0;
            ammoText = `Munición: ${Math.round(ammoPercent)}%`;
        }

        const aliveCount = slotData.aliveCount;

        // Build tooltip content
        const tooltipContent = `
            <strong>${unitName}</strong><br>
            Vida del slot: ${Math.round(hpPercent)}%<br>
            Nivel de mejora: ${upgradeLevel}${hasAmmo ? `<br>${ammoText}` : ''}
        `.trim();

        // Debug image path
        // console.log(`Rendering unit: ${unitName}, src: /assets/units/${unitName}.png`);

        cell.innerHTML = `
            <div class="slot-container">
                <div class="slot-upper">
                    <div class="slot-visual" style="background-image: url('/assets/units/${unitName}.png')"></div>
                    <div class="bars-container">
                        <div class="bar-vertical hp">
                            <div class="fill" style="height: ${hpPercent}%"></div>
                        </div>
                        ${hasAmmo ? `
                            <div class="bar-vertical ammo">
                                <div class="fill" style="height: ${ammoPercent}%"></div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="counter-tag">${aliveCount}${deathsThisRound > 0 ? ` <span class="deaths-round">(-${deathsThisRound})</span>` : ''}</div>
                <div class="tooltip">${tooltipContent}</div>
            </div>
        `;
    }

    /**
     * Update the matrix with new round data
     */
    update(attackerLines, defenderLines) {
        // Extract new data
        this.attackerData = this.extractLineData(attackerLines);
        this.defenderData = this.extractLineData(defenderLines);

        // Re-render grids
        this.renderGrid('attacker-grid', this.attackerData, false);
        this.renderGrid('defender-grid', this.defenderData, true);

        // Render unit summary
        this.renderUnitSummary(attackerLines, defenderLines);
    }

    /**
     * Render unit summary table showing remaining units, casualties, and generals lost
     */
    renderUnitSummary(attackerLines, defenderLines) {
        const summaryContainer = document.getElementById('unit-summary-container');
        const summaryTable = document.getElementById('unit-summary-table');

        if (!summaryContainer || !summaryTable) return;

        // Show container
        summaryContainer.style.display = 'block';

        // Aggregate units by name for each side
        const attackerUnits = this.aggregateUnitsByName(attackerLines);
        const defenderUnits = this.aggregateUnitsByName(defenderLines);

        // Get all unique unit names
        const allUnitNames = new Set([
            ...Object.keys(attackerUnits),
            ...Object.keys(defenderUnits)
        ]);

        // Build table HTML
        let html = '<div class="unit-summary-table">';

        let totalAttackerDeaths = 0;
        let totalDefenderDeaths = 0;
        let totalAttackerGenerals = 0;
        let totalDefenderGenerals = 0;

        for (const unitName of allUnitNames) {
            const attackerData = attackerUnits[unitName] || { alive: 0, deaths: 0, generalsLost: 0 };
            const defenderData = defenderUnits[unitName] || { alive: 0, deaths: 0, generalsLost: 0 };

            // Skip if both sides have 0
            if (attackerData.alive === 0 && defenderData.alive === 0 &&
                attackerData.deaths === 0 && defenderData.deaths === 0) {
                continue;
            }

            // Accumulate totals
            totalAttackerDeaths += attackerData.deaths;
            totalDefenderDeaths += defenderData.deaths;
            totalAttackerGenerals += attackerData.generalsLost;
            totalDefenderGenerals += defenderData.generalsLost;

            html += '<div class="unit-row">';

            // Attacker column
            html += '<div class="unit-cell attacker">';
            if (attackerData.alive > 0 || attackerData.deaths > 0) {
                html += attackerData.alive;
                if (attackerData.deaths > 0) {
                    html += ` <span class="casualties">(-${attackerData.deaths})</span>`;
                    html += `<br><span class="generals-lost">-${attackerData.generalsLost.toFixed(1)} Gen.</span>`;
                }
            }
            html += '</div>';

            // Unit name column
            html += `<div class="unit-cell unit-name">${this.formatUnitName(unitName)}</div>`;

            // Defender column
            html += '<div class="unit-cell defender">';
            if (defenderData.alive > 0 || defenderData.deaths > 0) {
                html += defenderData.alive;
                if (defenderData.deaths > 0) {
                    html += ` <span class="casualties">(-${defenderData.deaths})</span>`;
                    html += `<br><span class="generals-lost">-${defenderData.generalsLost.toFixed(1)} Gen.</span>`;
                }
            }
            html += '</div>';

            html += '</div>';
        }

        // Totals Row
        html += '<div class="unit-row totals-row">';

        // Attacker Totals
        html += '<div class="unit-cell attacker">';
        if (totalAttackerDeaths > 0) {
            html += `<span class="casualties">Total: -${totalAttackerDeaths}</span>`;
            html += `<br><span class="generals-lost">Total: -${totalAttackerGenerals.toFixed(1)} Gen.</span>`;
        }
        html += '</div>';

        // Label
        html += '<div class="unit-cell unit-name">TOTALS</div>';

        // Defender Totals
        html += '<div class="unit-cell defender">';
        if (totalDefenderDeaths > 0) {
            html += `<span class="casualties">Total: -${totalDefenderDeaths}</span>`;
            html += `<br><span class="generals-lost">Total: -${totalDefenderGenerals.toFixed(1)} Gen.</span>`;
        }
        html += '</div>';

        html += '</div>'; // End totals row

        html += '</div>';
        summaryTable.innerHTML = html;
    }

    /**
     * Aggregate units by name, counting alive units, deaths this round, and generals lost
     */
    aggregateUnitsByName(lines) {
        const units = {};

        for (const [lineType, line] of lines.entries()) {
            // Count units in slots
            line.slots.forEach(slot => {
                slot.units.forEach(unit => {
                    if (!units[unit.name]) {
                        units[unit.name] = { alive: 0, deaths: 0, generalsLost: 0 };
                    }
                    if (unit.isAlive()) {
                        units[unit.name].alive++;
                    }
                });

                // Add deaths from this round
                const deadUnits = slot.deadUnitsThisRound || [];

                if (deadUnits.length > 0) {
                    deadUnits.forEach(deadUnit => {
                        const unitName = deadUnit.name;
                        if (!units[unitName]) {
                            units[unitName] = { alive: 0, deaths: 0, generalsLost: 0 };
                        }
                        units[unitName].deaths++;
                        units[unitName].generalsLost += (deadUnit.stats.generalsCost || 0);
                    });
                } else if (slot.deathsThisRound > 0) {
                    // Fallback for backward compatibility if deadUnitsThisRound is missing
                    const aliveInSlot = slot.getAliveUnits();
                    if (aliveInSlot.length > 0) {
                        const unit = aliveInSlot[0];
                        const unitName = unit.name;
                        if (!units[unitName]) {
                            units[unitName] = { alive: 0, deaths: 0, generalsLost: 0 };
                        }
                        const deaths = slot.deathsThisRound || 0;
                        units[unitName].deaths += deaths;
                        units[unitName].generalsLost += deaths * (unit.stats.generalsCost || 0);
                    }
                }
            });

            // Count units in reserves
            if (line.reserves && line.reserves.length > 0) {
                line.reserves.forEach(unit => {
                    if (!units[unit.name]) {
                        units[unit.name] = { alive: 0, deaths: 0, generalsLost: 0 };
                    }
                    if (unit.isAlive()) {
                        units[unit.name].alive++;
                    }
                });
            }
        }

        return units;
    }

    /**
     * Format unit name for display (capitalize first letter)
     */
    formatUnitName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
    }
}

// Export for use in main.js
window.BattlefieldMatrix = BattlefieldMatrix;
