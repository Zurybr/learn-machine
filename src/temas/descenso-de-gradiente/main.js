import Chart from 'https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.esm.js';

// === CONFIGURACIÓN DEL JUEGO ===
const GAME_CONFIG = {
    levels: {
        1: { name: "Valle Sereno", func: (x) => x * x, derivative: (x) => 2 * x, range: [-10, 10], target: 0 },
        2: { name: "Colinas Engañosas", func: (x) => Math.sin(x) + 0.1 * x * x, derivative: (x) => Math.cos(x) + 0.2 * x, range: [-10, 10], target: -1.42755 },
    },
    achievements: {
        'first_step': { title: 'Primer Paso', unlocked: false },
        'level_one_clear': { title: 'Nivel 1 Superado', unlocked: false },
    }
};

// === ELEMENTOS DEL DOM ===
const elements = {
    knight: document.getElementById('gradient-knight'),
    chartCanvas: document.getElementById('gradientChart'),
    startButton: document.getElementById('startButton'),
    resetButton: document.getElementById('resetButton'),
    learningRateSlider: document.getElementById('learningRate'),
    startPointSlider: document.getElementById('startPoint'),
    learningRateValue: document.getElementById('learningRateValue'),
    startPointValue: document.getElementById('startPointValue'),
    totalScore: document.getElementById('totalScore'),
    currentLevel: document.getElementById('currentLevel'),
    iterationCount: document.getElementById('iterationCount'),
    costValue: document.getElementById('costValue'),
    achievementsList: document.getElementById('achievementsList'),
};

// === ESTADO DEL JUEGO ===
let gameState = {
    currentLevel: 1,
    score: 0,
    chart: null,
    isRunning: false,
    currentX: 8,
    learningRate: 0.1,
    iterations: 0,
};

// === LÓGICA DEL PERSONAJE ===
function setKnightState(state) {
    elements.knight.className = state;
}

function updateKnightPosition() {
    if (!gameState.chart || !gameState.chart.chartArea) {
        // Si el gráfico no está listo, reintenta en un momento.
        requestAnimationFrame(updateKnightPosition);
        return;
    }
    const levelConfig = GAME_CONFIG.levels[gameState.currentLevel];
    const chartArea = gameState.chart.chartArea;

    const xPixel = gameState.chart.scales.x.getPixelForValue(gameState.currentX);
    const yPixel = gameState.chart.scales.y.getPixelForValue(levelConfig.func(gameState.currentX));

    // Asegurarse de que el caballero no se salga del área del gráfico
    const clampedX = Math.max(chartArea.left, Math.min(xPixel, chartArea.right));
    const clampedY = Math.max(chartArea.top, Math.min(yPixel, chartArea.bottom));

    elements.knight.style.left = `${clampedX - 16}px`;
    elements.knight.style.top = `${clampedY - 32}px`;
}


// === LÓGICA DEL GRÁFICO ===
function createOrUpdateChart() {
    const levelConfig = GAME_CONFIG.levels[gameState.currentLevel];
    const dataPoints = [];
    for (let i = levelConfig.range[0]; i <= levelConfig.range[1]; i += 0.5) {
        dataPoints.push({x: i, y: levelConfig.func(i)});
    }

    const config = {
        type: 'line',
        data: {
            datasets: [{
                label: 'Función de Costo',
                data: dataPoints,
                borderColor: '#e9a6a6',
                backgroundColor: 'transparent',
                borderWidth: 4,
                stepped: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: '#3d2c8d' }, ticks: { fontFamily: "'Press Start 2P'" } },
                y: { grid: { color: '#3d2c8d' }, ticks: { fontFamily: "'Press Start 2P'" } }
            },
            animation: {
                onComplete: () => {
                    // Asegurarse de que el caballero se actualice después de que el gráfico se dibuje
                    updateKnightPosition();
                }
            }
        }
    };

    if (gameState.chart) {
        gameState.chart.destroy();
    }
    gameState.chart = new Chart(elements.chartCanvas, config);
}

// === LÓGICA DEL JUEGO ===
function startGame() {
    if (gameState.isRunning) return;
    gameState.isRunning = true;
    setKnightState('running');
    unlockAchievement('first_step');
    gameLoop();
}

function resetGame() {
    gameState.isRunning = false;
    gameState.iterations = 0;
    gameState.currentX = parseFloat(elements.startPointSlider.value);
    updateDisplay();
    createOrUpdateChart();
    setKnightState('idle');
}

function gameLoop() {
    if (!gameState.isRunning) return;

    const levelConfig = GAME_CONFIG.levels[gameState.currentLevel];
    const gradient = levelConfig.derivative(gameState.currentX);
    gameState.currentX -= gameState.learningRate * gradient;
    gameState.iterations++;

    updateDisplay();
    updateKnightPosition();

    if (Math.abs(gameState.currentX - levelConfig.target) < 0.1) {
        gameState.isRunning = false;
        setKnightState('victory');
        unlockAchievement('level_one_clear');
        gameState.score += 1000 - gameState.iterations * 10; // Puntuación simple
        updateDisplay();
        return;
    }
    
    if (gameState.iterations > 200) { // Límite de seguridad
        gameState.isRunning = false;
        setKnightState('idle');
        return;
    }

    requestAnimationFrame(gameLoop);
}

function updateDisplay() {
    const levelConfig = GAME_CONFIG.levels[gameState.currentLevel];
    elements.iterationCount.textContent = gameState.iterations;
    elements.costValue.textContent = levelConfig.func(gameState.currentX).toFixed(2);
    elements.totalScore.textContent = gameState.score;
    elements.learningRateValue.textContent = gameState.learningRate.toFixed(2);
    elements.startPointValue.textContent = gameState.currentX.toFixed(2);
    elements.currentLevel.textContent = gameState.currentLevel;
}

// === SISTEMA DE LOGROS ===
function unlockAchievement(id) {
    if (GAME_CONFIG.achievements[id] && !GAME_CONFIG.achievements[id].unlocked) {
        GAME_CONFIG.achievements[id].unlocked = true;
        gameState.score += 100;
        renderAchievements();
    }
}

function renderAchievements() {
    elements.achievementsList.innerHTML = '';
    for (const id in GAME_CONFIG.achievements) {
        const ach = GAME_CONFIG.achievements[id];
        const el = document.createElement('div');
        el.textContent = `🏆 ${ach.title}`;
        el.className = ach.unlocked ? 'achievement-item' : 'achievement-item locked';
        elements.achievementsList.appendChild(el);
    }
}

// === INICIALIZACIÓN ===
function init() {
    elements.startButton.addEventListener('click', startGame);
    elements.resetButton.addEventListener('click', resetGame);
    
    elements.learningRateSlider.addEventListener('input', e => {
        gameState.learningRate = parseFloat(e.target.value);
        updateDisplay();
    });
    
    elements.startPointSlider.addEventListener('input', e => {
        if (!gameState.isRunning) {
            gameState.currentX = parseFloat(e.target.value);
            updateDisplay();
            updateKnightPosition();
        }
    });

    resetGame();
    renderAchievements();
}

init();
