/**
 * Battlefield Matrix Visualization
 * Displays a 3x13 grid showing unit positions, HP/ammo bars, and casualties
 */

class BattlefieldMatrix {
    constructor() {
        this.fieldConfig = null;
        this.attackerData = null;
        this.defenderData = null;
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
     * Load field configuration from campos.json
     */
    loadFieldConfig(battleType, cityLevel) {
        // This will be populated from campos.json
        // For now, using the largest config (level 25+)
        this.fieldConfig = {
            'primera-linea': { numSlots: 7, capacity: 50 },
            'luchadores-distancia': { numSlots: 7, capacity: 50 },
            'flancos': { numSlots: 6, capacity: 40 },
            'artilleria': { numSlots: 5, capacity: 30 },
            'bombarderos': { numSlots: 2, capacity: 30 },
            'anti-aerea': { numSlots: 2, capacity: 30 }
        };
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

        switch (lineType) {
            case 'primera-linea':
                // Row 2, centered (columns 3-9 for 7 slots)
                return {
                    row: 2,
                    col: 3 + slotIndex
                };

            case 'luchadores-distancia':
                // Row 1, centered (columns 3-9 for 7 slots)
                return {
                    row: 1,
                    col: 3 + slotIndex
                };

            case 'flancos':
                // Row 2, split left (0-2) and right (10-12)
                // First 3 slots on left, next 3 on right
                if (slotIndex < 3) {
                    return { row: 2, col: slotIndex };
                } else {
                    return { row: 2, col: 10 + (slotIndex - 3) };
                }

            case 'artilleria':
                // Row 0, centered (columns 4-8 for 5 slots)
                return {
                    row: 0,
                    col: 4 + slotIndex
                };

            case 'bombarderos':
                // Row 0, left side (columns 0-1)
                return {
                    row: 0,
                    col: slotIndex
                };

            case 'anti-aerea':
                // Row 0, right side (columns 11-12)
                return {
                    row: 0,
                    col: 11 + slotIndex
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

        // Show empty slot with death count if there were casualties
        if (units.length === 0) {
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
            return;
        }

        // Get first unit for image and stats
        const firstUnit = units[0];
        const unitName = firstUnit.name;
        const upgradeLevel = firstUnit.upgradeLevel || 0;

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
