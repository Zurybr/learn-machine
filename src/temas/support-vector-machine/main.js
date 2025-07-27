import Chart from 'https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.esm.js';

// === DATOS DE ENTRENAMIENTO ===
const datos = [
  { x: -2, y: -1 },
  { x: -1.5, y: -1 },
  { x: -1, y: -1 },
  { x: 1, y: 1 },
  { x: 1.5, y: 1 },
  { x: 2, y: 1 }
];

let peso = 0;
let sesgo = 0;
let tasaAprendizaje = 0.1;
let animacionId;

const ctx = document.getElementById('chart');
const chart = new Chart(ctx, {
  type: 'scatter',
  data: {
    datasets: [
      {
        label: 'Clase +1',
        data: datos.filter(d => d.y === 1),
        backgroundColor: '#00d4ff'
      },
      {
        label: 'Clase -1',
        data: datos.filter(d => d.y === -1),
        backgroundColor: '#ff6b6b'
      },
      {
        label: 'Modelo',
        data: [],
        type: 'line',
        borderColor: '#ffffff',
        borderWidth: 2,
        fill: false
      }
    ]
  },
  options: {
    animation: false,
    scales: {
      x: { min: -3, max: 3 },
      y: { min: -2, max: 2 }
    }
  }
});

const actualizaModelo = () => {
  const puntos = [];
  for (let x = -3; x <= 3; x += 0.1) {
    puntos.push({ x, y: peso * x + sesgo });
  }
  chart.data.datasets[2].data = puntos;
  chart.update();
};

const calculaGradiente = () => {
  let dw = 0;
  let db = 0;
  for (const { x, y } of datos) {
    const margen = y * (peso * x + sesgo);
    if (margen < 1) {
      dw += -y * x;
      db += -y;
    }
  }
  dw /= datos.length;
  db /= datos.length;
  return { dw, db };
};

const pasoEntrenamiento = () => {
  const { dw, db } = calculaGradiente();
  peso -= tasaAprendizaje * dw;
  sesgo -= tasaAprendizaje * db;
  actualizaModelo();
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

actualizaModelo();
