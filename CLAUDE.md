# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start Vite development server (default: http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- No test framework is configured

## Project Architecture

### Structure
This is an interactive educational course project built with Vite and vanilla JavaScript, designed to teach gradient descent concepts through gamification. The project uses a modular structure where each topic has its own self-contained directory.

### Key Components

**Main Application (`index.html`, `src/main.js`)**
- Entry point loads the gradient descent game directly
- Vite-based ES module setup with Chart.js for visualization

**Topic-Based Modules (`src/temas/[topic]/`)**
- Each topic is self-contained with its own HTML, JS, and CSS
- Current implementation: `descenso-de-gradiente/` (gradient descent game)
- Each module can be run independently or integrated into the main application

**Gradient Descent Game (`src/temas/descenso-de-gradiente/`)**
- Game-based learning with pixel art knight character
- Multi-level progression system with local storage persistence
- Real-time Chart.js visualization of cost functions and gradient descent paths
- Class-based architecture: `GameState`, `ScreenManager`, `ChartManager`, `GameEngine`

### Technical Implementation

**State Management**
- `GameState` class handles game progression, level unlocking, and score tracking
- Uses localStorage for progress persistence across sessions
- Manages multiple game levels with different cost functions and difficulty

**Visualization System**
- `ChartManager` creates Chart.js instances for each level's cost function
- Real-time knight positioning using pixel coordinates mapped to chart data
- Dynamic path trail visualization during gradient descent simulation

**Game Loop**
- `GameEngine` runs animation-based game loop using `requestAnimationFrame`
- Implements gradient descent algorithm with configurable learning rates
- Victory/defeat conditions based on convergence tolerance and step limits

### Dependencies
- **Chart.js 4.5.0**: Primary visualization library for cost function graphs
- **Vite 7.0.4**: Build tool and development server
- No additional frameworks - uses vanilla JavaScript with ES6+ features

### Level Configuration
Levels are defined in `GAME_CONFIG.levels` with mathematical functions, derivatives, and game parameters. Each level includes custom cost functions, gradient calculations, and educational hints for different difficulty levels.