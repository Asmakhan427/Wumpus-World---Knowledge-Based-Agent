// script.js - Wumpus World Knowledge-Based Agent Frontend

let autoInterval = null;
let isAutoRunning = false;
let currentState = null;

// DOM Elements
const gridElement = document.getElementById('grid');
const gridWrapper = document.getElementById('grid-wrapper');
const emptyState = document.getElementById('empty-state');
const messageText = document.getElementById('message-text');
const headerStatus = document.getElementById('header-status');
const statusDot = document.getElementById('status-dot');

// Metrics elements
const mInference = document.getElementById('m-inference');
const mVisited = document.getElementById('m-visited');
const mClauses = document.getElementById('m-clauses');
const mResCalls = document.getElementById('m-res-calls');
const mResSteps = document.getElementById('m-res-steps');
const mSteps = document.getElementById('m-steps');
const mScore = document.getElementById('m-score');

// Percepts display
const perceptsDisplay = document.getElementById('percepts-display');

// Buttons
const btnNew = document.getElementById('btn-new');
const btnStep = document.getElementById('btn-step');
const btnAuto = document.getElementById('btn-auto');
const btnStop = document.getElementById('btn-stop');

// Inputs
const inputRows = document.getElementById('input-rows');
const inputCols = document.getElementById('input-cols');
const inputPits = document.getElementById('input-pits');

function updateMetrics(state) {
    if (mInference) mInference.textContent = state.inference_steps || 0;
    if (mVisited) mVisited.textContent = state.visited_count || 0;
    if (mClauses) mClauses.textContent = state.kb_clauses || 0;
    if (mResCalls) mResCalls.textContent = state.resolution_calls || 0;
    if (mResSteps) mResSteps.textContent = state.resolution_steps || 0;
    if (mSteps) mSteps.textContent = state.steps_taken || 0;
    if (mScore) mScore.textContent = state.score || 0;
}

function updatePerceptsDisplay(percepts) {
    if (!perceptsDisplay) return;
    
    if (!percepts || percepts.length === 0) {
        perceptsDisplay.innerHTML = '<span class="no-percept">current percepts: none</span>';
        return;
    }
    
    perceptsDisplay.innerHTML = percepts.map(p => 
        `<span class="percept-tag percept-${p}">${p}</span>`
    ).join('');
}

function updatePerceptsSidebar(state) {
    const content = document.getElementById('percepts-sidebar-content');
    if (!content) return;
    
    if (!state || !state.grid || state.visited_count === 0) {
        content.innerHTML = '<div class="no-percept">No cells visited</div>';
        return;
    }
    
    const visitedWithPercepts = [];
    
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            const cell = state.grid[r][c];
            if (cell.visited && cell.percepts && cell.percepts.length > 0) {
                visitedWithPercepts.push({
                    coords: `(${r},${c})`,
                    percepts: cell.percepts
                });
            }
        }
    }
    
    if (visitedWithPercepts.length === 0) {
        content.innerHTML = '<div class="no-percept">No percepts detected</div>';
        return;
    }
    
    content.innerHTML = visitedWithPercepts.map(item => `
        <div class="percept-cell-info">
            <div class="percept-cell-coords">${item.coords}</div>
            <div class="percept-cell-list">
                ${item.percepts.map(p => `<span class="percept-sidebar-item percept-${p}">${p}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function updateHeaderStatus(state) {
    if (!state) {
        headerStatus.textContent = 'AWAITING INIT';
        statusDot.className = 'status-dot';
        return;
    }
    
    if (state.game_over) {
        if (state.won) {
            headerStatus.textContent = 'VICTORY!';
            statusDot.className = 'status-dot won';
        } else if (state.dead) {
            headerStatus.textContent = 'GAME OVER';
            statusDot.className = 'status-dot dead';
        } else {
            headerStatus.textContent = 'GAME OVER';
            statusDot.className = 'status-dot dead';
        }
    } else {
        headerStatus.textContent = 'AGENT ACTIVE';
        statusDot.className = 'status-dot active';
    }
}

function updateMessageBar(message, type = 'info') {
    if (!messageText) return;
    messageText.textContent = message;
    const messageBar = document.querySelector('.message-bar');
    if (!messageBar) return;
    
    messageBar.classList.remove('msg-warning', 'msg-error', 'msg-success');
    if (type === 'warning') messageBar.classList.add('msg-warning');
    else if (type === 'error') messageBar.classList.add('msg-error');
    else if (type === 'success') messageBar.classList.add('msg-success');
}

function getCellClass(cell) {
    if (cell.is_agent) return 'cell-agent';
    if (cell.is_pit) return 'cell-pit';
    if (cell.is_wumpus) return 'cell-wumpus';
    if (cell.kb_safe && !cell.visited) return 'cell-kb-safe';
    if (cell.in_frontier && !cell.visited) return 'cell-frontier';
    if (cell.visited) return 'cell-visited';
    return 'cell-unknown';
}

function getCellIcon(cell) {
    if (cell.is_agent) return 'A';
    if (cell.is_pit) return 'O';
    if (cell.is_wumpus) return 'W';
    if (cell.visited) return ' ';
    if (cell.kb_safe) return 'S';
    if (cell.in_frontier) return '?';
    return ' ';
}

function getPerceptIcons(cell) {
    if (!cell.percepts || cell.percepts.length === 0) return '';
    const icons = [];
    if (cell.percepts.includes('BREEZE')) icons.push('B');
    if (cell.percepts.includes('STENCH')) icons.push('S');
    return icons.join('');
}

function renderGrid(state) {
    if (!state || !state.grid || state.grid.length === 0) {
        if (gridWrapper) gridWrapper.classList.remove('visible');
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    if (gridWrapper) gridWrapper.classList.add('visible');
    if (emptyState) emptyState.style.display = 'none';
    
    const rows = state.rows;
    const cols = state.cols;
    
    // Set grid template
    gridElement.style.display = 'grid';
    gridElement.style.gridTemplateColumns = `repeat(${cols}, 55px)`;
    gridElement.style.gap = '3px';
    
    // Clear and rebuild grid
    gridElement.innerHTML = '';
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = state.grid[r][c];
            const cellDiv = document.createElement('div');
            cellDiv.className = `cell ${getCellClass(cell)}`;
            cellDiv.setAttribute('data-row', r);
            cellDiv.setAttribute('data-col', c);
            
            const iconSpan = document.createElement('div');
            iconSpan.className = 'cell-icon';
            iconSpan.textContent = getCellIcon(cell);
            
            const coordsSpan = document.createElement('div');
            coordsSpan.className = 'cell-coords';
            coordsSpan.textContent = `${r},${c}`;
            
            const perceptSpan = document.createElement('div');
            perceptSpan.className = 'cell-percept-icons';
            perceptSpan.textContent = getPerceptIcons(cell);
            
            cellDiv.appendChild(iconSpan);
            cellDiv.appendChild(coordsSpan);
            cellDiv.appendChild(perceptSpan);
            
            gridElement.appendChild(cellDiv);
        }
    }
}

function checkGameOverOverlay(state) {
    const existingOverlay = document.querySelector('.game-over-overlay');
    if (existingOverlay) existingOverlay.remove();
    
    if (state && state.game_over) {
        const container = document.getElementById('world-container');
        if (!container) return;
        
        const overlay = document.createElement('div');
        overlay.className = `game-over-overlay ${state.won ? 'win-overlay' : 'dead-overlay'}`;
        
        const content = document.createElement('div');
        content.className = 'overlay-content';
        
        const title = document.createElement('div');
        title.className = 'overlay-title';
        title.textContent = state.won ? 'VICTORY!' : 'GAME OVER';
        
        const subtitle = document.createElement('div');
        subtitle.className = 'overlay-sub';
        subtitle.textContent = state.won ? 'Mission Complete' : 'Agent Eliminated';
        
        content.appendChild(title);
        content.appendChild(subtitle);
        overlay.appendChild(content);
        
        container.style.position = 'relative';
        container.appendChild(overlay);
        
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
        }, 3000);
    }
}

function updateUI(newState) {
    if (!newState) return;
    
    renderGrid(newState);
    updateMetrics(newState);
    updatePerceptsDisplay(newState.last_percepts);
    updatePerceptsSidebar(newState);
    updateHeaderStatus(newState);
    updateMessageBar(newState.message || 'Agent ready.');
    checkGameOverOverlay(newState);
    
    // Show/hide info sidebar
    const infoSidebar = document.querySelector('.info-sidebar');
    if (infoSidebar) {
        if (newState.grid && newState.visited_count > 0) {
            infoSidebar.classList.add('visible');
        } else {
            infoSidebar.classList.remove('visible');
        }
    }
    
    if (newState.game_over) {
        if (btnStep) btnStep.disabled = true;
        if (btnAuto) btnAuto.disabled = true;
        if (btnStop) btnStop.disabled = true;
        stopAuto();
    } else {
        if (!isAutoRunning) {
            if (btnStep) btnStep.disabled = false;
            if (btnAuto) btnAuto.disabled = false;
            if (btnStop) btnStop.disabled = false;
        }
    }
}

// API Calls
async function newEpisode() {
    stopAuto();
    
    const rows = parseInt(inputRows.value) || 4;
    const cols = parseInt(inputCols.value) || 4;
    const pits = parseInt(inputPits.value) || 3;
    
    updateMessageBar('Creating new world...', 'info');
    
    try {
        const response = await fetch('/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows, cols, pits })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to initialize world');
        }
        
        currentState = await response.json();
        updateUI(currentState);
        
        if (btnStep) btnStep.disabled = false;
        if (btnAuto) btnAuto.disabled = false;
        if (btnStop) btnStop.disabled = false;
        
        updateMessageBar('World created. Click STEP to begin exploring.', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        updateMessageBar('Failed to initialize world. Check server connection.', 'error');
    }
}

async function stepAgent() {
    if (isAutoRunning) return;
    
    try {
        const response = await fetch('/step', { method: 'POST' });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Step failed');
        }
        
        currentState = await response.json();
        updateUI(currentState);
        
        if (currentState.game_over) {
            stopAuto();
            if (currentState.won) {
                updateMessageBar(`Victory! Final score: ${currentState.score}`, 'success');
            } else if (currentState.dead) {
                updateMessageBar(`Game Over! Score: ${currentState.score}`, 'error');
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
        updateMessageBar(error.message || 'Step failed. Try NEW EPISODE.', 'error');
    }
}

async function fetchState() {
    try {
        const response = await fetch('/state');
        if (response.ok) {
            currentState = await response.json();
            updateUI(currentState);
        }
    } catch (error) {
        console.error('Error fetching state:', error);
    }
}

// Auto Mode
function toggleAuto() {
    if (isAutoRunning) {
        stopAuto();
    } else {
        startAuto();
    }
}

function startAuto() {
    if (isAutoRunning) return;
    if (currentState && currentState.game_over) {
        updateMessageBar('Game over. Start a new episode first.', 'warning');
        return;
    }
    
    isAutoRunning = true;
    if (btnAuto) btnAuto.textContent = 'PAUSE';
    if (btnStep) btnStep.disabled = true;
    
    autoInterval = setInterval(async () => {
        if (!isAutoRunning) return;
        
        try {
            const response = await fetch('/step', { method: 'POST' });
            if (!response.ok) {
                stopAuto();
                return;
            }
            
            currentState = await response.json();
            updateUI(currentState);
            
            if (currentState.game_over) {
                stopAuto();
                if (currentState.won) {
                    updateMessageBar(`Victory! Final score: ${currentState.score}`, 'success');
                } else if (currentState.dead) {
                    updateMessageBar(`Game Over! Score: ${currentState.score}`, 'error');
                }
            }
            
        } catch (error) {
            console.error('Auto step error:', error);
            stopAuto();
            updateMessageBar('Auto mode stopped due to error.', 'error');
        }
    }, 500);
}

function stopAuto() {
    if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
    }
    isAutoRunning = false;
    if (btnAuto) btnAuto.textContent = 'AUTO';
    if (currentState && !currentState.game_over && btnStep) {
        btnStep.disabled = false;
    }
}

// Clear log function (removed - no longer needed but keep for compatibility)
function clearLog() {
    // Function removed as KB Log section is gone
}

// Make functions global
window.newEpisode = newEpisode;
window.stepAgent = stepAgent;
window.toggleAuto = toggleAuto;
window.stopAuto = stopAuto;
window.clearLog = clearLog;

// Initial fetch on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchState();
    // Set initial button states
    if (btnStep) btnStep.disabled = true;
    if (btnAuto) btnAuto.disabled = true;
    if (btnStop) btnStop.disabled = true;
});
