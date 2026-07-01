// THE CORRUPTED DEPTHS - Game Script
let autoInterval = null;
let isAutoRunning = false;
let currentState = null;
let soundEnabled = true;
let audioCtx = null;
let soundInitialized = false;

// DOM Elements
const gridElement = document.getElementById('grid');
const gridWrapper = document.getElementById('grid-wrapper');
const emptyState = document.getElementById('empty-state');
const messageText = document.getElementById('message-text');
const headerStatus = document.getElementById('header-status');
const statusDot = document.getElementById('status-dot');
const worldContainer = document.getElementById('world-container');

// Metrics
const mInference = document.getElementById('m-inference');
const mVisited = document.getElementById('m-visited');
const mClauses = document.getElementById('m-clauses');
const mResCalls = document.getElementById('m-res-calls');
const mResSteps = document.getElementById('m-res-steps');
const mSteps = document.getElementById('m-steps');
const mScore = document.getElementById('m-score');

const perceptsDisplay = document.getElementById('percepts-display');
const btnNew = document.getElementById('btn-new');
const btnStep = document.getElementById('btn-step');
const btnAuto = document.getElementById('btn-auto');
const btnStop = document.getElementById('btn-stop');
const inputRows = document.getElementById('input-rows');
const inputCols = document.getElementById('input-cols');
const inputPits = document.getElementById('input-pits');

const CELL_SIZE = 75;

// ─── SOUND SYSTEM ────────────────────────────────────────────────

const SOUNDS = {
    step: { type: 'sine', notes: [440], duration: 0.06, volume: 0.08 },
    step2: { type: 'sine', notes: [550], duration: 0.06, volume: 0.08 },
    victory: { type: 'square', notes: [523, 659, 784, 1047, 784, 659, 523], duration: 0.15, volume: 0.1 },
    death: { type: 'sawtooth', notes: [300, 250, 200, 150], duration: 0.3, volume: 0.12 },
    wumpus: { type: 'sawtooth', notes: [120, 100, 80], duration: 0.4, volume: 0.15 },
    gold: { type: 'sine', notes: [880, 1108, 1318], duration: 0.1, volume: 0.08 },
    rift: { type: 'sawtooth', notes: [200, 150], duration: 0.3, volume: 0.1 }
};

let stepCounter = 0;

function initAudio() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🎵 Audio context created');
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
            console.log('🎵 Audio context resumed');
        }
        soundInitialized = true;
        return true;
    } catch (e) {
        console.warn('❌ Audio not supported:', e);
        return false;
    }
}

function playTone(frequency, duration, type, volume) {
    try {
        if (!soundInitialized && !initAudio()) return;
        if (!audioCtx) return;
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = type || 'sine';
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(volume || 0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);
        
        return true;
    } catch (e) {
        console.warn('Sound play error:', e);
        return false;
    }
}

function playSound(soundName) {
    console.log('🔊 Playing sound:', soundName);
    
    if (!soundEnabled) {
        console.log('🔇 Sound disabled');
        return false;
    }
    
    try {
        const sound = SOUNDS[soundName];
        if (!sound) {
            console.warn('⚠️ Sound not found:', soundName);
            return false;
        }
        
        initAudio();
        if (!audioCtx) return false;
        
        const notes = sound.notes;
        const duration = sound.duration;
        const type = sound.type;
        const volume = sound.volume || 0.1;
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                playTone(freq, duration, type, volume);
            }, index * 60);
        });
        
        return true;
    } catch (e) {
        console.warn('Sound error:', e);
        return false;
    }
}

// ─── TEST SOUND ───────────────────────────────────────────────────

function testSound() {
    console.log('🔊 Testing sound...');
    initAudio();
    if (!audioCtx) {
        console.error('❌ Audio context not initialized!');
        updateMessageBar('❌ Audio not available!', 'error');
        return;
    }
    console.log('✅ Audio context state:', audioCtx.state);
    
    updateMessageBar('🔊 Testing sounds...', 'info');
    
    setTimeout(() => {
        console.log('🔔 Playing gold...');
        playSound('gold');
    }, 100);
    
    setTimeout(() => {
        console.log('🔔 Playing step...');
        playSound('step');
    }, 400);
    
    setTimeout(() => {
        console.log('🔔 Playing victory...');
        playSound('victory');
    }, 700);
    
    setTimeout(() => {
        console.log('🔔 Playing death...');
        playSound('death');
    }, 1000);
    
    setTimeout(() => {
        updateMessageBar('✅ Sound test complete!', 'success');
    }, 1300);
}

// ─── KEYBOARD SHORTCUTS ──────────────────────────────────────────

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.key) {
        case 'n': case 'N': e.preventDefault(); newEpisode(); break;
        case 's': case 'S': e.preventDefault(); stepAgent(); break;
        case ' ': case 'a': case 'A': e.preventDefault(); toggleAuto(); break;
        case 'Escape': e.preventDefault(); stopAuto(); break;
    }
});

// ─── UI FUNCTIONS ────────────────────────────────────────────────

function flashMetric(el) {
    if (!el) return;
    const row = el.closest('.metric-row');
    if (!row) return;
    row.classList.remove('flash');
    void row.offsetWidth;
    row.classList.add('flash');
    setTimeout(() => row.classList.remove('flash'), 400);
}

function setMetric(el, value) {
    if (!el) return;
    const next = String(value || 0);
    if (el.textContent !== next) {
        el.textContent = next;
        flashMetric(el);
    }
}

function updateMetrics(state) {
    setMetric(mInference, state.inference_steps);
    setMetric(mVisited, state.visited_count);
    setMetric(mClauses, state.kb_clauses);
    setMetric(mResCalls, state.resolution_calls);
    setMetric(mResSteps, state.resolution_steps);
    setMetric(mSteps, state.steps_taken);
    setMetric(mScore, state.score);
}

function updatePerceptsDisplay(percepts) {
    if (!perceptsDisplay) return;
    if (!percepts || percepts.length === 0) {
        perceptsDisplay.innerHTML = '<span class="no-percept">🔮 Current Percepts: None</span>';
        return;
    }
    perceptsDisplay.innerHTML = percepts.map(p =>
        `<span class="percept-tag percept-${p}">${p.replace('_', ' ')}</span>`
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
                visitedWithPercepts.push({ coords: `(${r},${c})`, percepts: cell.percepts });
            }
        }
    }

    if (visitedWithPercepts.length === 0) {
        content.innerHTML = '<div class="no-percept">No percepts detected</div>';
        return;
    }

    content.innerHTML = visitedWithPercepts.map(item => `
        <div class="percept-cell-info">
            <div class="percept-cell-coords">📍 ${item.coords}</div>
            <div class="percept-cell-list">
                ${item.percepts.map(p => `<span class="percept-sidebar-item percept-${p}">${p.replace('_', ' ')}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function updateHeaderStatus(state) {
    if (!state) {
        headerStatus.textContent = '⚔️ Awaiting Init';
        statusDot.className = 'status-dot';
        return;
    }
    if (state.game_over) {
        if (state.won) {
            headerStatus.textContent = '🏆 Victory!';
            statusDot.className = 'status-dot won';
        } else {
            headerStatus.textContent = '☠️ Game Over';
            statusDot.className = 'status-dot dead';
        }
    } else {
        headerStatus.textContent = '⚔️ Hero Active';
        statusDot.className = 'status-dot active';
    }
}

function updateMessageBar(message, type = 'info') {
    if (!messageText) return;
    messageText.textContent = message;
    const messageBar = document.querySelector('.message-bar');
    if (!messageBar) return;
    messageBar.className = 'message-bar';
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
    if (cell.is_agent) return '⚔️';
    if (cell.is_pit) return '💀';
    if (cell.is_wumpus) return '🐉';
    if (cell.visited) return '·';
    if (cell.kb_safe) return '🛡️';
    if (cell.in_frontier) return '❓';
    return ' ';
}

function getPerceptIcons(cell) {
    if (!cell.percepts || cell.percepts.length === 0) return '';
    const icons = [];
    if (cell.percepts.includes('CORRUPTION_AURA')) icons.push('🌀');
    if (cell.percepts.includes('PUTRID_DECAY')) icons.push('☠️');
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

    gridElement.style.display = 'grid';
    gridElement.style.gridTemplateColumns = `repeat(${cols}, ${CELL_SIZE}px)`;
    gridElement.style.gridTemplateRows = `repeat(${rows}, ${CELL_SIZE}px)`;
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
        const container = worldContainer;
        if (!container) return;

        const overlay = document.createElement('div');
        overlay.className = `game-over-overlay ${state.won ? 'win-overlay' : 'dead-overlay'}`;

        const content = document.createElement('div');
        content.className = 'overlay-content';

        const title = document.createElement('div');
        title.className = 'overlay-title';
        title.textContent = state.won ? '🏆 Victory!' : '☠️ Game Over';

        const subtitle = document.createElement('div');
        subtitle.className = 'overlay-sub';
        subtitle.textContent = state.won ? 'The Dungeon is Purified' : 'The Corruption Consumed You';

        content.appendChild(title);
        content.appendChild(subtitle);
        overlay.appendChild(content);

        container.style.position = 'relative';
        container.appendChild(overlay);

        if (state.won) {
            setTimeout(() => playSound('victory'), 200);
            setTimeout(() => playSound('gold'), 600);
        } else {
            setTimeout(() => playSound('death'), 200);
            container.classList.add('shake');
            setTimeout(() => container.classList.remove('shake'), 500);
        }

        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
        }, 3500);
    }
}

function updateUI(newState) {
    if (!newState) return;

    renderGrid(newState);
    updateMetrics(newState);
    updatePerceptsDisplay(newState.last_percepts);
    updatePerceptsSidebar(newState);
    updateHeaderStatus(newState);
    updateMessageBar(newState.message || '⚔️ Hero ready.');
    checkGameOverOverlay(newState);

    if (newState.game_over) {
        // Sound played in checkGameOverOverlay
    } else if (newState.sound_event === 'step') {
        stepCounter++;
        playSound(stepCounter % 2 === 0 ? 'step' : 'step2');
    }

    if (newState.game_over) {
        if (btnStep) btnStep.disabled = true;
        if (btnAuto) btnAuto.disabled = true;
        if (btnStop) btnStop.disabled = true;
        stopAuto();
    } else if (!isAutoRunning) {
        if (btnStep) btnStep.disabled = false;
        if (btnAuto) btnAuto.disabled = false;
        if (btnStop) btnStop.disabled = false;
    }
}

// ─── API CALLS ────────────────────────────────────────────────────

async function newEpisode() {
    stopAuto();

    const rows = parseInt(inputRows.value, 10) || 6;
    const cols = parseInt(inputCols.value, 10) || 6;
    const pits = parseInt(inputPits.value, 10) || 4;

    updateMessageBar('⚔️ Summoning the dungeon...', 'info');
    initAudio();

    try {
        const response = await fetch('/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows, cols, pits })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to initialize dungeon');
        }

        currentState = await response.json();
        updateUI(currentState);

        if (btnStep) btnStep.disabled = false;
        if (btnAuto) btnAuto.disabled = false;
        if (btnStop) btnStop.disabled = false;

        updateMessageBar('⚔️ The Corrupted Depths await! Click STEP to begin exploring.', 'success');
        setTimeout(() => playSound('gold'), 300);

    } catch (error) {
        console.error('Error:', error);
        updateMessageBar('☠️ Failed to summon dungeon. Check server connection.', 'error');
    }
}

async function stepAgent() {
    if (isAutoRunning) return;

    initAudio();

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
                updateMessageBar(`🏆 Victory! The dungeon is purified! Final score: ${currentState.score}`, 'success');
            } else if (currentState.dead) {
                updateMessageBar(`☠️ Game Over! The corruption consumed you! Score: ${currentState.score}`, 'error');
            }
        }

    } catch (error) {
        console.error('Error:', error);
        updateMessageBar('☠️ Step failed. Try NEW EPISODE.', 'error');
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

// ─── AUTO MODE ────────────────────────────────────────────────────

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
        updateMessageBar('☠️ Dungeon is lost. Start a new episode first.', 'warning');
        return;
    }

    isAutoRunning = true;
    if (btnAuto) btnAuto.textContent = '⏸ Pause';
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
                    updateMessageBar(`🏆 Victory! The dungeon is purified! Final score: ${currentState.score}`, 'success');
                } else if (currentState.dead) {
                    updateMessageBar(`☠️ Game Over! The corruption consumed you! Score: ${currentState.score}`, 'error');
                }
            }

        } catch (error) {
            console.error('Auto step error:', error);
            stopAuto();
            updateMessageBar('☠️ Auto mode stopped due to error.', 'error');
        }
    }, 500);
}

function stopAuto() {
    if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
    }
    isAutoRunning = false;
    if (btnAuto) btnAuto.textContent = '🤖 Auto';
    if (currentState && !currentState.game_over && btnStep) {
        btnStep.disabled = false;
    }
}

// ─── SOUND TOGGLE ─────────────────────────────────────────────────

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('btn-sound');
    if (btn) {
        btn.textContent = soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
    }
    if (soundEnabled) {
        initAudio();
        setTimeout(() => {
            playSound('gold');
            setTimeout(() => playSound('step'), 200);
        }, 100);
        updateMessageBar('🔊 Sound enabled!', 'success');
    } else {
        updateMessageBar('🔇 Sound disabled', 'warning');
    }
}

// ─── EXPOSE GLOBALLY ──────────────────────────────────────────────
window.newEpisode = newEpisode;
window.stepAgent = stepAgent;
window.toggleAuto = toggleAuto;
window.stopAuto = stopAuto;
window.toggleSound = toggleSound;
window.testSound = testSound;
window.playSound = playSound;
window.initAudio = initAudio;
window.soundEnabled = soundEnabled;
window.audioCtx = audioCtx;

// ─── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    fetchState();
    if (btnStep) btnStep.disabled = true;
    if (btnAuto) btnAuto.disabled = true;
    if (btnStop) btnStop.disabled = true;
    
    // Pre-initialize audio on any click
    document.addEventListener('click', () => {
        if (!soundInitialized) {
            initAudio();
        }
    }, { once: true });
});