import Chart from 'chart.js/auto';

// === CONFIGURACIÓN DEL JUEGO ===
const GAME_CONFIG = {
    levels: {
        tutorial: {
            name: "Tutorial",
            description: "Aprende los fundamentos del descenso de gradiente",
            func: (x) => (x - 2) * (x - 2) + 1,
            derivative: (x) => 2 * (x - 2),
            range: [-2, 6],
            target: 2,
            tolerance: 0.2,
            maxSteps: 50,
            hints: [
                "El gradiente te dice en qué dirección subir más rápido",
                "Para encontrar el mínimo, ve en dirección opuesta al gradiente",
                "Un learning rate muy alto puede hacer que te pases del objetivo",
                "Un learning rate muy bajo hará que tardes mucho en llegar"
            ]
        },
        1: {
            name: "Valle Simple",
            description: "Una función cuadrática básica",
            func: (x) => x * x + 0.5,
            derivative: (x) => 2 * x,
            range: [-5, 5],
            target: 0,
            tolerance: 0.1,
            maxSteps: 30,
            hints: [
                "Esta es una parábola simple con mínimo en x=0",
                "El gradiente es proporcional a la distancia del mínimo"
            ]
        },
        2: {
            name: "Colinas Onduladas",
            description: "Función con múltiples mínimos locales",
            func: (x) => Math.sin(x) + 0.1 * x * x,
            derivative: (x) => Math.cos(x) + 0.2 * x,
            range: [-8, 8],
            target: -1.42755,
            tolerance: 0.15,
            maxSteps: 100,
            hints: [
                "¡Cuidado! Hay múltiples mínimos locales",
                "El punto de inicio puede determinar a qué mínimo llegas",
                "Experimenta con diferentes learning rates"
            ]
        },
        3: {
            name: "Volcán Traicionero",
            description: "Función compleja con ruido",
            func: (x) => Math.sin(x * 0.5) * Math.cos(x * 0.3) + 0.05 * x * x + Math.sin(x * 3) * 0.1,
            derivative: (x) => 0.5 * Math.cos(x * 0.5) * Math.cos(x * 0.3) - 0.3 * Math.sin(x * 0.5) * Math.sin(x * 0.3) + 0.1 * x + 0.3 * Math.cos(x * 3),
            range: [-10, 10],
            target: 0,
            tolerance: 0.3,
            maxSteps: 150,
            hints: [
                "Esta función tiene mucho ruido y múltiples mínimos",
                "Requiere paciencia y experimentación",
                "El mínimo global está cerca del centro"
            ]
        }
    }
};

// === ESTADO DEL JUEGO ===
class GameState {
    constructor() {
        this.currentScreen = 'mainMenu';
        this.currentLevel = 'tutorial';
        this.unlockedLevels = new Set(['tutorial']);
        this.levelProgress = {};
        this.totalScore = 0;
        this.totalStars = 0;
        
        // Estado del nivel actual
        this.isRunning = false;
        this.isPaused = false;
        this.currentX = 0;
        this.learningRate = 0.1;
        this.steps = 0;
        this.startTime = 0;
        this.pathHistory = [];
        this.chart = null;
        
        this.loadProgress();
    }
    
    saveProgress() {
        const progress = {
            unlockedLevels: Array.from(this.unlockedLevels),
            levelProgress: this.levelProgress,
            totalScore: this.totalScore,
            totalStars: this.totalStars
        };
        localStorage.setItem('gradientQuest_progress', JSON.stringify(progress));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('gradientQuest_progress');
        if (saved) {
            const progress = JSON.parse(saved);
            this.unlockedLevels = new Set(progress.unlockedLevels || ['tutorial']);
            this.levelProgress = progress.levelProgress || {};
            this.totalScore = progress.totalScore || 0;
            this.totalStars = progress.totalStars || 0;
        }
    }
    
    unlockLevel(levelId) {
        this.unlockedLevels.add(levelId);
        this.saveProgress();
    }
    
    completeLevel(levelId, score, steps, time) {
        const stars = this.calculateStars(levelId, steps, time);
        
        if (!this.levelProgress[levelId] || this.levelProgress[levelId].stars < stars) {
            const oldStars = this.levelProgress[levelId]?.stars || 0;
            this.levelProgress[levelId] = { score, steps, time, stars };
            this.totalStars += (stars - oldStars);
            this.totalScore += score;
        }
        
        // Desbloquear siguiente nivel
        const levelKeys = Object.keys(GAME_CONFIG.levels);
        const currentIndex = levelKeys.indexOf(levelId);
        if (currentIndex < levelKeys.length - 1) {
            this.unlockLevel(levelKeys[currentIndex + 1]);
        }
        
        this.saveProgress();
        return stars;
    }
    
    calculateStars(levelId, steps, time) {
        const config = GAME_CONFIG.levels[levelId];
        const efficiency = Math.max(0, (config.maxSteps - steps) / config.maxSteps);
        const timeBonus = Math.max(0, (60 - time) / 60);
        const score = (efficiency + timeBonus) / 2;
        
        if (score >= 0.8) return 3;
        if (score >= 0.5) return 2;
        return 1;
    }
}

// === GESTIÓN DE PANTALLAS ===
class ScreenManager {
    constructor() {
        this.screens = {
            mainMenu: document.getElementById('mainMenu'),
            gameScreen: document.getElementById('gameScreen'),
            victoryScreen: document.getElementById('victoryScreen')
        };
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        this.screens[screenName].classList.add('active');
        gameState.currentScreen = screenName;
    }
}

// === GESTIÓN DEL GRÁFICO ===
class ChartManager {
    constructor() {
        this.canvas = document.getElementById('gradientChart');
        this.chart = null;
    }
    
    createChart(levelId) {
        const config = GAME_CONFIG.levels[levelId];
        const dataPoints = [];
        
        // Crear puntos de datos más densos para mejor visualización
        for (let i = config.range[0]; i <= config.range[1]; i += 0.1) {
            dataPoints.push({x: i, y: config.func(i)});
        }
        
        const chartConfig = {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Función de Costo',
                    data: dataPoints,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: {
                        grid: { 
                            color: '#2a2a3e',
                            lineWidth: 1
                        },
                        ticks: { 
                            color: '#a0a0a0',
                            font: { family: 'JetBrains Mono' }
                        }
                    },
                    y: {
                        grid: { 
                            color: '#2a2a3e',
                            lineWidth: 1
                        },
                        ticks: { 
                            color: '#a0a0a0',
                            font: { family: 'JetBrains Mono' }
                        }
                    }
                },
                animation: {
                    duration: 0
                },
                interaction: {
                    intersect: false
                }
            }
        };
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(this.canvas, chartConfig);
        gameState.chart = this.chart;
        
        return this.chart;
    }
    
    updateKnightPosition(x, y) {
        if (!this.chart || !this.chart.chartArea) return;
        
        const chartArea = this.chart.chartArea;
        const xPixel = this.chart.scales.x.getPixelForValue(x);
        const yPixel = this.chart.scales.y.getPixelForValue(y);
        
        const knight = document.getElementById('gradient-knight');
        const clampedX = Math.max(chartArea.left, Math.min(xPixel, chartArea.right));
        const clampedY = Math.max(chartArea.top, Math.min(yPixel, chartArea.bottom));
        
        knight.style.left = `${clampedX - 12}px`;
        knight.style.top = `${clampedY - 12}px`;
    }
    
    updateTargetPosition(levelId) {
        if (!this.chart || !this.chart.chartArea) return;
        
        const config = GAME_CONFIG.levels[levelId];
        const target = document.getElementById('target-indicator');
        
        const xPixel = this.chart.scales.x.getPixelForValue(config.target);
        const yPixel = this.chart.scales.y.getPixelForValue(config.func(config.target));
        
        target.style.left = `${xPixel - 8}px`;
        target.style.top = `${yPixel - 8}px`;
        target.style.display = 'block';
    }
    
    addPathPoint(x, y) {
        if (!this.chart || !this.chart.chartArea) return;
        
        const chartArea = this.chart.chartArea;
        const xPixel = this.chart.scales.x.getPixelForValue(x);
        const yPixel = this.chart.scales.y.getPixelForValue(y);
        
        const pathTrail = document.getElementById('path-trail');
        const point = document.createElement('div');
        point.className = 'path-point';
        point.style.left = `${xPixel - 2}px`;
        point.style.top = `${yPixel - 2}px`;
        
        pathTrail.appendChild(point);
        
        // Limpiar puntos antiguos
        setTimeout(() => {
            if (point.parentNode) {
                point.parentNode.removeChild(point);
            }
        }, 3000);
    }
}

// === LÓGICA DEL JUEGO ===
class GameEngine {
    constructor() {
        this.animationId = null;
        this.lastStepTime = 0;
        this.stepInterval = 100; // ms entre pasos
    }
    
    start() {
        if (gameState.isRunning) return;
        
        gameState.isRunning = true;
        gameState.isPaused = false;
        gameState.startTime = Date.now();
        gameState.steps = 0;
        gameState.pathHistory = [];
        
        // Limpiar trail anterior
        document.getElementById('path-trail').innerHTML = '';
        
        // Actualizar UI
        document.getElementById('startButton').disabled = true;
        document.getElementById('pauseButton').disabled = false;
        document.getElementById('gradient-knight').className = 'knight running';
        
        this.gameLoop();
    }
    
    pause() {
        gameState.isPaused = !gameState.isPaused;
        const pauseBtn = document.getElementById('pauseButton');
        pauseBtn.textContent = gameState.isPaused ? '▶️ Continuar' : '⏸️ Pausar';
        
        if (!gameState.isPaused) {
            this.gameLoop();
        }
    }
    
    reset() {
        this.stop();
        
        const config = GAME_CONFIG.levels[gameState.currentLevel];
        gameState.currentX = parseFloat(document.getElementById('startPoint').value);
        gameState.steps = 0;
        gameState.pathHistory = [];
        
        // Limpiar trail
        document.getElementById('path-trail').innerHTML = '';
        
        // Actualizar posiciones
        chartManager.updateKnightPosition(gameState.currentX, config.func(gameState.currentX));
        
        this.updateDisplay();
    }
    
    stop() {
        gameState.isRunning = false;
        gameState.isPaused = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Actualizar UI
        document.getElementById('startButton').disabled = false;
        document.getElementById('pauseButton').disabled = true;
        document.getElementById('pauseButton').textContent = '⏸️ Pausar';
        document.getElementById('gradient-knight').className = 'knight idle';
    }
    
    gameLoop(timestamp = 0) {
        if (!gameState.isRunning || gameState.isPaused) return;
        
        // Controlar velocidad de pasos
        if (timestamp - this.lastStepTime >= this.stepInterval) {
            this.performStep();
            this.lastStepTime = timestamp;
        }
        
        this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    performStep() {
        const config = GAME_CONFIG.levels[gameState.currentLevel];
        
        // Calcular gradiente y nuevo paso
        const gradient = config.derivative(gameState.currentX);
        const newX = gameState.currentX - gameState.learningRate * gradient;
        
        // Añadir punto al trail
        chartManager.addPathPoint(gameState.currentX, config.func(gameState.currentX));
        
        // Actualizar posición
        gameState.currentX = newX;
        gameState.steps++;
        gameState.pathHistory.push({x: newX, y: config.func(newX), gradient});
        
        // Actualizar visualización
        chartManager.updateKnightPosition(gameState.currentX, config.func(gameState.currentX));
        this.updateDisplay();
        
        // Verificar condiciones de victoria o derrota
        this.checkGameEnd();
    }
    
    checkGameEnd() {
        const config = GAME_CONFIG.levels[gameState.currentLevel];
        const distance = Math.abs(gameState.currentX - config.target);
        
        // Victoria
        if (distance < config.tolerance) {
            this.victory();
            return;
        }
        
        // Derrota por exceso de pasos
        if (gameState.steps >= config.maxSteps) {
            this.defeat();
            return;
        }
        
        // Derrota por salirse del rango
        if (gameState.currentX < config.range[0] || gameState.currentX > config.range[1]) {
            this.defeat();
            return;
        }
    }
    
    victory() {
        this.stop();
        
        const elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
        const score = Math.max(100, 1000 - gameState.steps * 10 - elapsedTime);
        const stars = gameState.completeLevel(gameState.currentLevel, score, gameState.steps, elapsedTime);
        
        // Actualizar knight
        document.getElementById('gradient-knight').className = 'knight victory';
        
        // Mostrar pantalla de victoria
        this.showVictoryScreen(score, stars, gameState.steps, elapsedTime);
        
        // Efectos de celebración
        this.createCelebrationEffect();
    }
    
    defeat() {
        this.stop();
        
        // Mostrar mensaje de derrota
        const tutorialText = document.getElementById('tutorialText');
        tutorialText.textContent = '¡Inténtalo de nuevo! Ajusta el learning rate o el punto de inicio.';
        tutorialText.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #fa5252 100%)';
        
        setTimeout(() => {
            tutorialText.style.background = '';
            this.updateTutorialText();
        }, 3000);
    }
    
    showVictoryScreen(score, stars, steps, time) {
        // Actualizar elementos de la pantalla de victoria
        document.getElementById('finalScore').textContent = score;
        document.getElementById('finalSteps').textContent = steps;
        document.getElementById('finalTime').textContent = `${time}s`;
        document.getElementById('efficiency').textContent = `${Math.round((1 - steps / GAME_CONFIG.levels[gameState.currentLevel].maxSteps) * 100)}%`;
        
        // Mostrar estrellas
        const starsContainer = document.getElementById('starsEarned');
        const starElements = starsContainer.querySelectorAll('.star');
        starElements.forEach((star, index) => {
            star.classList.toggle('earned', index < stars);
        });
        
        // Configurar botón de siguiente nivel
        const nextBtn = document.getElementById('nextLevelButton');
        const levelKeys = Object.keys(GAME_CONFIG.levels);
        const currentIndex = levelKeys.indexOf(gameState.currentLevel);
        
        if (currentIndex < levelKeys.length - 1) {
            const nextLevel = levelKeys[currentIndex + 1];
            nextBtn.style.display = gameState.unlockedLevels.has(nextLevel) ? 'block' : 'none';
        } else {
            nextBtn.style.display = 'none';
        }
        
        screenManager.showScreen('victoryScreen');
    }
    
    createCelebrationEffect() {
        const container = document.querySelector('.chart-container');
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.top = `${Math.random() * 100}%`;
                particle.style.background = ['#ffd43b', '#51cf66', '#00d4ff'][Math.floor(Math.random() * 3)];
                
                container.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 3000);
            }, i * 100);
        }
    }
    
    updateDisplay() {
        const config = GAME_CONFIG.levels[gameState.currentLevel];
        
        document.getElementById('currentPosition').textContent = gameState.currentX.toFixed(2);
        document.getElementById('currentCost').textContent = config.func(gameState.currentX).toFixed(2);
        document.getElementById('currentGradient').textContent = config.derivative(gameState.currentX).toFixed(2);
        document.getElementById('stepCount').textContent = gameState.steps;
        
        if (gameState.isRunning) {
            const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
            document.getElementById('timeElapsed').textContent = `${elapsed}s`;
        }
        
        // Actualizar valores de controles
        document.getElementById('learningRateValue').textContent = gameState.learningRate.toFixed(2);
        document.getElementById('startPointValue').textContent = document.getElementById('startPoint').value;
        
        // Actualizar mejor puntuación
        const levelProgress = gameState.levelProgress[gameState.currentLevel];
        document.getElementById('bestScore').textContent = levelProgress ? levelProgress.score : '---';
    }
    
    updateTutorialText() {
        const config = GAME_CONFIG.levels[gameState.currentLevel];
        const tutorialText = document.getElementById('tutorialText');
        
        if (config.hints && config.hints.length > 0) {
            const randomHint = config.hints[Math.floor(Math.random() * config.hints.length)];
            tutorialText.textContent = randomHint;
        }
    }
}

// === INICIALIZACIÓN ===
const gameState = new GameState();
const screenManager = new ScreenManager();
const chartManager = new ChartManager();
const gameEngine = new GameEngine();

function initializeMenuScreen() {
    // Actualizar progreso en menú
    document.getElementById('totalStars').textContent = gameState.totalStars;
    document.getElementById('totalScore').textContent = gameState.totalScore;
    
    // Configurar tarjetas de nivel
    document.querySelectorAll('.level-card').forEach(card => {
        const levelId = card.dataset.level;
        const isUnlocked = gameState.unlockedLevels.has(levelId);
        const statusElement = card.querySelector('.level-status');
        
        if (isUnlocked) {
            statusElement.textContent = 'Disponible';
            statusElement.className = 'level-status unlocked';
            card.style.opacity = '1';
            card.style.cursor = 'pointer';
            
            // Mostrar estrellas si el nivel está completado
            const progress = gameState.levelProgress[levelId];
            if (progress) {
                const stars = '⭐'.repeat(progress.stars) + '☆'.repeat(3 - progress.stars);
                statusElement.textContent = stars;
            }
        } else {
            statusElement.textContent = 'Bloqueado';
            statusElement.className = 'level-status locked';
            card.style.opacity = '0.5';
            card.style.cursor = 'not-allowed';
        }
        
        card.addEventListener('click', () => {
            if (isUnlocked) {
                startLevel(levelId);
            }
        });
    });
}

function startLevel(levelId) {
    gameState.currentLevel = levelId;
    const config = GAME_CONFIG.levels[levelId];
    
    // Configurar UI del juego
    document.getElementById('currentLevelName').textContent = config.name;
    
    // Configurar controles
    const startPointSlider = document.getElementById('startPoint');
    startPointSlider.min = config.range[0];
    startPointSlider.max = config.range[1];
    startPointSlider.value = config.range[0] + (config.range[1] - config.range[0]) * 0.8;
    
    gameState.currentX = parseFloat(startPointSlider.value);
    gameState.learningRate = 0.1;
    
    // Crear gráfico
    chartManager.createChart(levelId);
    chartManager.updateKnightPosition(gameState.currentX, config.func(gameState.currentX));
    chartManager.updateTargetPosition(levelId);
    
    // Actualizar display
    gameEngine.updateDisplay();
    gameEngine.updateTutorialText();
    
    screenManager.showScreen('gameScreen');
}

function initializeGameScreen() {
    // Botones de control
    document.getElementById('startButton').addEventListener('click', () => gameEngine.start());
    document.getElementById('pauseButton').addEventListener('click', () => gameEngine.pause());
    document.getElementById('resetButton').addEventListener('click', () => gameEngine.reset());
    document.getElementById('backToMenu').addEventListener('click', () => {
        gameEngine.stop();
        screenManager.showScreen('mainMenu');
        initializeMenuScreen();
    });
    
    // Controles
    document.getElementById('learningRate').addEventListener('input', (e) => {
        gameState.learningRate = parseFloat(e.target.value);
        gameEngine.updateDisplay();
    });
    
    document.getElementById('startPoint').addEventListener('input', (e) => {
        if (!gameState.isRunning) {
            gameState.currentX = parseFloat(e.target.value);
            const config = GAME_CONFIG.levels[gameState.currentLevel];
            chartManager.updateKnightPosition(gameState.currentX, config.func(gameState.currentX));
            gameEngine.updateDisplay();
        }
    });
}

function initializeVictoryScreen() {
    document.getElementById('nextLevelButton').addEventListener('click', () => {
        const levelKeys = Object.keys(GAME_CONFIG.levels);
        const currentIndex = levelKeys.indexOf(gameState.currentLevel);
        if (currentIndex < levelKeys.length - 1) {
            startLevel(levelKeys[currentIndex + 1]);
        }
    });
    
    document.getElementById('retryButton').addEventListener('click', () => {
        startLevel(gameState.currentLevel);
    });
    
    document.getElementById('backToMenuFromVictory').addEventListener('click', () => {
        screenManager.showScreen('mainMenu');
        initializeMenuScreen();
    });
}

// Inicializar aplicación
function init() {
    initializeMenuScreen();
    initializeGameScreen();
    initializeVictoryScreen();
    
    // Mostrar pantalla inicial
    screenManager.showScreen('mainMenu');
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}