import Chart from 'chart.js/auto';

// === CONFIGURACIÓN DEL JUEGO ===
const LEVELS = {
  1: {
    title: "Primer Paso: ¿Qué es un gradiente?",
    explanation: "El gradiente es la pendiente de una función. Nos dice qué tan rápido cambia el valor cuando nos movemos en una dirección. Si queremos encontrar el punto más bajo (mínimo), debemos ir en dirección opuesta al gradiente.",
    func: x => 0.5 * x * x + 1,
    derivative: x => x,
    range: [-4, 4],
    target: 0,
    tolerance: 0.2,
    maxSteps: 15,
    difficulty: 1,
    hints: [
      "El gradiente en x=2 es 2, así que debemos movernos hacia la izquierda",
      "Mientras más lejos del centro, mayor es el gradiente",
      "El mínimo está en x=0 donde el gradiente es 0"
    ]
  },
  2: {
    title: "Dirección Correcta: Siguiendo la pendiente",
    explanation: "Para minimizar una función, siempre nos movemos en dirección OPUESTA al gradiente. Si el gradiente es positivo, vamos hacia la izquierda. Si es negativo, vamos hacia la derecha.",
    func: x => 0.3 * (x - 1) * (x - 1) + 0.5,
    derivative: x => 0.6 * (x - 1),
    range: [-3, 5],
    target: 1,
    tolerance: 0.15,
    maxSteps: 20,
    difficulty: 2,
    hints: [
      "El mínimo no siempre está en x=0",
      "Observa hacia dónde apunta el gradiente y ve en dirección opuesta",
      "Cuando el gradiente es positivo, necesitas ir hacia la izquierda"
    ]
  },
  3: {
    title: "Velocidad Óptima: Learning rate perfecto",
    explanation: "El learning rate controla qué tan grandes son nuestros pasos. Muy alto y nos pasaremos, muy bajo y tardaremos mucho. Encuentra el equilibrio perfecto.",
    func: x => 0.2 * x * x * x * x + 0.1 * x * x + 0.5,
    derivative: x => 0.8 * x * x * x + 0.2 * x,
    range: [-2.5, 2.5],
    target: 0,
    tolerance: 0.1,
    maxSteps: 25,
    difficulty: 3,
    hints: [
      "Esta función es más compleja, necesitas ajustar el learning rate",
      "Si oscila mucho, reduce el learning rate",
      "Si avanza muy lento, aumenta el learning rate"
    ]
  },
  4: {
    title: "Múltiples Caminos: Funciones complejas",
    explanation: "Las funciones reales pueden tener múltiples mínimos locales. Tu punto de inicio determina a cuál llegarás. Este es uno de los desafíos del machine learning.",
    func: x => Math.sin(x) + 0.1 * x * x,
    derivative: x => Math.cos(x) + 0.2 * x,
    range: [-6, 4],
    target: -1.42755,
    tolerance: 0.2,
    maxSteps: 40,
    difficulty: 4,
    hints: [
      "Hay múltiples valles en esta función",
      "El punto de inicio importa mucho",
      "Experimenta con diferentes posiciones iniciales"
    ]
  }
};

// === ESTADO DEL JUEGO ===
class GameState {
  constructor() {
    this.currentLevel = 1;
    this.unlockedLevels = new Set([1]);
    this.levelProgress = {};
    this.currentX = 0;
    this.learningRate = 0.1;
    this.steps = 0;
    this.score = 0;
    this.isRunning = false;
    this.pathHistory = [];
    this.chart = null;
    
    this.loadProgress();
  }
  
  saveProgress() {
    const progress = {
      unlockedLevels: Array.from(this.unlockedLevels),
      levelProgress: this.levelProgress
    };
    localStorage.setItem('linearquest_progress', JSON.stringify(progress));
  }
  
  loadProgress() {
    const saved = localStorage.getItem('linearquest_progress');
    if (saved) {
      const progress = JSON.parse(saved);
      this.unlockedLevels = new Set(progress.unlockedLevels || [1]);
      this.levelProgress = progress.levelProgress || {};
    }
  }
  
  unlockLevel(level) {
    this.unlockedLevels.add(level);
    this.saveProgress();
  }
  
  completeLevel(level, steps, score) {
    const stars = this.calculateStars(level, steps);
    const existing = this.levelProgress[level];
    
    if (!existing || existing.stars < stars) {
      this.levelProgress[level] = { steps, score, stars };
      this.saveProgress();
    }
    
    // Desbloquear siguiente nivel
    if (level + 1 <= Object.keys(LEVELS).length) {
      this.unlockLevel(level + 1);
    }
    
    return stars;
  }
  
  calculateStars(level, steps) {
    const config = LEVELS[level];
    const efficiency = Math.max(0, (config.maxSteps - steps) / config.maxSteps);
    
    if (efficiency >= 0.8) return 3;
    if (efficiency >= 0.5) return 2;
    return 1;
  }
}

// === GESTIÓN DE PANTALLAS ===
class ScreenManager {
  constructor() {
    this.screens = {
      intro: document.getElementById('intro-screen'),
      menu: document.getElementById('main-menu'),
      levelSelect: document.getElementById('level-select'),
      game: document.getElementById('game-screen'),
      victory: document.getElementById('victory-screen')
    };
    this.currentScreen = 'intro';
  }
  
  showScreen(screenName) {
    Object.values(this.screens).forEach(screen => {
      screen.classList.remove('active');
    });
    this.screens[screenName].classList.add('active');
    this.currentScreen = screenName;
  }
}

// === VISUALIZACIÓN ===
class VisualizationEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.chart = null;
    this.sprite = document.getElementById('player-sprite');
  }
  
  createChart(level) {
    const config = LEVELS[level];
    const dataPoints = [];
    
    // Generar puntos de la función
    for (let x = config.range[0]; x <= config.range[1]; x += 0.1) {
      dataPoints.push({x: x, y: config.func(x)});
    }
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    this.chart = new Chart(this.canvas, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Función de Costo',
          data: dataPoints,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointRadius: 0
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
            type: 'linear',
            grid: { color: '#414868' },
            ticks: { color: '#9aa5ce' }
          },
          y: {
            grid: { color: '#414868' },
            ticks: { color: '#9aa5ce' }
          }
        },
        animation: { duration: 0 }
      }
    });
    
    return this.chart;
  }
  
  updatePlayerPosition(x, y) {
    if (!this.chart) return;
    
    const chartArea = this.chart.chartArea;
    const xPixel = this.chart.scales.x.getPixelForValue(x);
    const yPixel = this.chart.scales.y.getPixelForValue(y);
    
    // Posicionar sprite
    this.sprite.style.left = `${xPixel - 12}px`;
    this.sprite.style.top = `${yPixel - 12}px`;
  }
  
  drawPath(pathHistory) {
    if (!this.chart || pathHistory.length < 2) return;
    
    // Agregar dataset del camino
    const pathData = pathHistory.map(point => ({x: point.x, y: point.y}));
    
    this.chart.data.datasets[1] = {
      label: 'Camino',
      data: pathData,
      borderColor: '#f59e0b',
      backgroundColor: 'transparent',
      borderWidth: 3,
      pointRadius: 4,
      pointBackgroundColor: '#f59e0b',
      tension: 0.1,
      fill: false
    };
    
    this.chart.update('none');
  }
}

// === MOTOR DEL JUEGO ===
class GameEngine {
  constructor() {
    this.animationId = null;
    this.stepInterval = 800; // ms entre pasos
    this.lastStepTime = 0;
  }
  
  start() {
    if (gameState.isRunning) return;
    
    gameState.isRunning = true;
    gameState.steps = 0;
    gameState.pathHistory = [{x: gameState.currentX, y: LEVELS[gameState.currentLevel].func(gameState.currentX)}];
    
    // Actualizar UI
    document.getElementById('start-btn').disabled = true;
    document.getElementById('start-btn').textContent = 'Ejecutando...';
    
    this.gameLoop();
  }
  
  stop() {
    gameState.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    document.getElementById('start-btn').disabled = false;
    document.getElementById('start-btn').textContent = 'Comenzar';
  }
  
  reset() {
    this.stop();
    gameState.steps = 0;
    gameState.pathHistory = [];
    gameState.currentX = parseFloat(document.getElementById('start-position').value);
    
    this.updateDisplay();
    visualizer.updatePlayerPosition(gameState.currentX, LEVELS[gameState.currentLevel].func(gameState.currentX));
  }
  
  gameLoop(timestamp = 0) {
    if (!gameState.isRunning) return;
    
    if (timestamp - this.lastStepTime >= this.stepInterval) {
      this.performStep();
      this.lastStepTime = timestamp;
    }
    
    this.animationId = requestAnimationFrame(ts => this.gameLoop(ts));
  }
  
  performStep() {
    const config = LEVELS[gameState.currentLevel];
    
    // Calcular gradiente
    const gradient = config.derivative(gameState.currentX);
    
    // Nuevo paso
    const newX = gameState.currentX - gameState.learningRate * gradient;
    const newY = config.func(newX);
    
    // Actualizar estado
    gameState.currentX = newX;
    gameState.steps++;
    gameState.pathHistory.push({x: newX, y: newY});
    
    // Actualizar visualización
    visualizer.updatePlayerPosition(newX, newY);
    visualizer.drawPath(gameState.pathHistory);
    this.updateDisplay();
    
    // Verificar condiciones de fin
    this.checkGameEnd();
  }
  
  checkGameEnd() {
    const config = LEVELS[gameState.currentLevel];
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
    
    const score = Math.max(100, 1000 - gameState.steps * 50);
    const stars = gameState.completeLevel(gameState.currentLevel, gameState.steps, score);
    
    // Mostrar pantalla de victoria
    document.getElementById('final-steps').textContent = gameState.steps;
    document.getElementById('final-score').textContent = score;
    
    // Actualizar estrellas
    const starsContainer = document.getElementById('stars-earned');
    const starElements = starsContainer.querySelectorAll('.star');
    starElements.forEach((star, index) => {
      star.textContent = index < stars ? '⭐' : '☆';
    });
    
    // Configurar botón siguiente nivel
    const nextBtn = document.getElementById('next-level-btn');
    if (gameState.currentLevel < Object.keys(LEVELS).length) {
      nextBtn.style.display = 'block';
    } else {
      nextBtn.style.display = 'none';
    }
    
    screenManager.showScreen('victory');
  }
  
  defeat() {
    this.stop();
    alert('¡Inténtalo de nuevo! Ajusta el learning rate o la posición inicial.');
  }
  
  updateDisplay() {
    const config = LEVELS[gameState.currentLevel];
    
    document.getElementById('step-counter').textContent = gameState.steps;
    document.getElementById('lr-value').textContent = gameState.learningRate.toFixed(2);
    document.getElementById('pos-value').textContent = gameState.currentX.toFixed(1);
    
    // Actualizar barra de progreso
    const progress = Math.min(100, (gameState.steps / config.maxSteps) * 100);
    document.getElementById('level-progress').style.width = `${progress}%`;
  }
  
  showHint() {
    const config = LEVELS[gameState.currentLevel];
    const randomHint = config.hints[Math.floor(Math.random() * config.hints.length)];
    alert(`💡 Pista: ${randomHint}`);
  }
}

// === INICIALIZACIÓN ===
const gameState = new GameState();
const screenManager = new ScreenManager();
const visualizer = new VisualizationEngine();
const gameEngine = new GameEngine();

// === MANEJO DE EVENTOS ===
function initializeEvents() {
  // Pantalla de intro
  document.addEventListener('keydown', () => {
    if (screenManager.currentScreen === 'intro') {
      screenManager.showScreen('menu');
    }
  });
  
  // Menú principal
  document.getElementById('play-btn').addEventListener('click', () => {
    screenManager.showScreen('levelSelect');
    updateLevelSelect();
  });
  
  document.getElementById('tutorial-btn').addEventListener('click', () => {
    gameState.currentLevel = 1;
    startGame();
  });
  
  // Selector de niveles
  document.getElementById('back-to-menu').addEventListener('click', () => {
    screenManager.showScreen('menu');
  });
  
  // Eventos de nivel
  document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', () => {
      const level = parseInt(card.dataset.level);
      if (gameState.unlockedLevels.has(level)) {
        gameState.currentLevel = level;
        startGame();
      }
    });
  });
  
  // Controles del juego
  document.getElementById('start-btn').addEventListener('click', () => gameEngine.start());
  document.getElementById('reset-btn').addEventListener('click', () => gameEngine.reset());
  document.getElementById('hint-btn').addEventListener('click', () => gameEngine.showHint());
  
  document.getElementById('learning-rate').addEventListener('input', (e) => {
    gameState.learningRate = parseFloat(e.target.value);
    gameEngine.updateDisplay();
  });
  
  document.getElementById('start-position').addEventListener('input', (e) => {
    if (!gameState.isRunning) {
      gameState.currentX = parseFloat(e.target.value);
      visualizer.updatePlayerPosition(gameState.currentX, LEVELS[gameState.currentLevel].func(gameState.currentX));
      gameEngine.updateDisplay();
    }
  });
  
  // Pantalla de victoria
  document.getElementById('next-level-btn').addEventListener('click', () => {
    gameState.currentLevel++;
    startGame();
  });
  
  document.getElementById('retry-level-btn').addEventListener('click', () => {
    startGame();
  });
  
  document.getElementById('back-to-levels-btn').addEventListener('click', () => {
    screenManager.showScreen('levelSelect');
    updateLevelSelect();
  });
}

function updateLevelSelect() {
  document.querySelectorAll('.level-card').forEach(card => {
    const level = parseInt(card.dataset.level);
    const isUnlocked = gameState.unlockedLevels.has(level);
    card.querySelector('.diff-value').textContent = LEVELS[level].difficulty;
    const bestScoreEl = card.querySelector('.score-value');
    const progress = gameState.levelProgress[level];

    if (progress) {
      bestScoreEl.textContent = progress.score;
    } else {
      bestScoreEl.textContent = '--';
    }

    if (isUnlocked) {
      card.classList.remove('locked');
      card.classList.add('unlocked');

      // Mostrar estrellas si completado
      if (progress) {
        const stars = card.querySelectorAll('.star');
        stars.forEach((star, index) => {
          star.textContent = index < progress.stars ? '⭐' : '☆';
        });
      }
    } else {
      card.classList.remove('unlocked');
      card.classList.add('locked');
    }
  });
}

function startGame() {
  const config = LEVELS[gameState.currentLevel];
  
  // Configurar UI
  document.getElementById('current-level-name').textContent = config.title;
  document.getElementById('lesson-title').textContent = config.title.split(': ')[1];
  document.getElementById('lesson-text').textContent = config.explanation;
  
  // Configurar controles
  const posSlider = document.getElementById('start-position');
  posSlider.min = config.range[0];
  posSlider.max = config.range[1];
  posSlider.value = config.range[0] + (config.range[1] - config.range[0]) * 0.7;
  
  gameState.currentX = parseFloat(posSlider.value);
  gameState.learningRate = 0.1;
  document.getElementById('learning-rate').value = 0.1;
  
  // Crear visualización
  visualizer.createChart(gameState.currentLevel);
  visualizer.updatePlayerPosition(gameState.currentX, config.func(gameState.currentX));
  
  gameEngine.reset();
  screenManager.showScreen('game');
}

// Inicializar aplicación
function init() {
  initializeEvents();
  screenManager.showScreen('intro');
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}