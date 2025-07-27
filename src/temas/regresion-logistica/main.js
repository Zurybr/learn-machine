import Chart from 'https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.esm.js';

// === DATOS DE ENTRENAMIENTO ===
const datos = [
  { x: -3, y: 0 },
  { x: -2, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 3, y: 1 }
];

let peso = 0;
let sesgo = 0;
let tasaAprendizaje = 0.1;
let animacionId;

const sigmoid = z => 1 / (1 + Math.exp(-z));

const ctx = document.getElementById('chart');
const chart = new Chart(ctx, {
  type: 'scatter',
  data: {
    datasets: [
      {
        label: 'Datos',
        data: datos,
        backgroundColor: '#ff6b6b'
      },
      {
        label: 'Modelo',
        data: [],
        type: 'line',
        borderColor: '#00d4ff',
        borderWidth: 2,
        fill: false
      }
    ]
  },
  options: {
    animation: false,
    scales: {
      x: { min: -3, max: 3 },
      y: { min: 0, max: 1 }
    }
  }
});

const actualizaCurva = () => {
  const puntos = [];
  for (let x = -3; x <= 3; x += 0.1) {
    puntos.push({ x, y: sigmoid(peso * x + sesgo) });
  }
  chart.data.datasets[1].data = puntos;
  chart.update();
};

const calculaGradiente = () => {
  let dw = 0;
  let db = 0;
  for (const { x, y } of datos) {
    const pred = sigmoid(peso * x + sesgo);
    dw += (pred - y) * x;
    db += pred - y;
  }
  dw /= datos.length;
  db /= datos.length;
  return { dw, db };
};

const pasoEntrenamiento = () => {
  const { dw, db } = calculaGradiente();
  peso -= tasaAprendizaje * dw;
  sesgo -= tasaAprendizaje * db;
  actualizaCurva();
};

const entrena = () => {
  cancelAnimationFrame(animacionId);
  const ciclo = () => {
    pasoEntrenamiento();
    animacionId = requestAnimationFrame(ciclo);
  };
  ciclo();
};

document.getElementById('train-btn').addEventListener('click', entrena);
document.getElementById('lr').addEventListener('input', e => {
  tasaAprendizaje = parseFloat(e.target.value);
  document.getElementById('lr-value').textContent = tasaAprendizaje.toFixed(2);
});

actualizaCurva();
