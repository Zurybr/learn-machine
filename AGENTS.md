# Agent Guidelines for IA Interactive Course

## Build/Test Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- No test framework configured

## Project Structure
- Vite-based vanilla JavaScript project with ES modules
- Main entry: `index.html` → `src/main.js`
- Topic-specific modules in `src/temas/[topic]/` with own HTML/JS/CSS

## Code Style
- Use ES6+ modules with `import`/`export`
- Prefer `const`/`let` over `var`
- Use template literals for HTML strings
- Spanish comments and variable names for educational content
- camelCase for JavaScript variables, kebab-case for CSS/HTML IDs
- Use Chart.js for data visualization
- Organize code with clear section comments (e.g., `// === SECTION ===`)
- Use object destructuring for DOM elements and configuration
- Prefer arrow functions for callbacks and short functions
- Use `requestAnimationFrame` for smooth animations

## Error Handling
- Add safety limits for loops/iterations
- Validate chart existence before operations
- Use optional chaining when accessing nested properties