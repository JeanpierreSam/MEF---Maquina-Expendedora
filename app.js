const products = {
  'A1': { name: 'Agua Cielo', icon: '', price: 2.50, desc: '625 ml', image: 'imagenes/Agua/cielo-sin-gas2.png' },
  'A2': { name: 'Jugo Durazno', icon: '', price: 2.50, desc: '300 ml', image: 'imagenes/Agua/durazno-600x600.png' },
  'A3': { name: 'Jugo Mango', icon: '', price: 2.50, desc: '300 ml', image: 'imagenes/Agua/mango-2-600x600.png' },
  'A4': { name: 'Jugo Naranja', icon: '', price: 2.50, desc: '300 ml', image: 'imagenes/Agua/naranja-600x600.png' },
  'B1': { name: 'Galleta Coco', icon: '', price: 5.00, desc: '6 u', image: 'imagenes/Galletas/Galleta-coco-1-600x600.png' },
  'B2': { name: 'Galleta Kiwicha', icon: '', price: 5.00, desc: '6 u', image: 'imagenes/Galletas/Galleta-kiwicha-int-600x600.png' },
  'B3': { name: 'Galleta Naranja', icon: '', price: 5.00, desc: '6 u', image: 'imagenes/Galletas/Galleta-naranja-1-600x600.png' },
  'B4': { name: 'Pan Integral', icon: '', price: 5.00, desc: 'Mediano', image: 'imagenes/Galletas/Pan-integ-mediano-600x600.png' },
  'C1': { name: 'Palitos Clasicos', icon: '', price: 3.00, desc: '60 g', image: 'imagenes/Snaks/Palitos-clasicos-600x600.png' },
  'C2': { name: 'Palitos Especias', icon: '', price: 3.00, desc: '60 g', image: 'imagenes/Snaks/Palitos-de-Especias-600x600.png' },
  'C3': { name: 'Tostada Blanca', icon: '', price: 4.00, desc: '6 u', image: 'imagenes/Snaks/Tosatada-blanca-600x600.png' },
  'C4': { name: 'Tostada Integral', icon: '', price: 4.00, desc: '6 u', image: 'imagenes/Snaks/Tosatada-integ-600x600.png' }
};

const coins = [0.10, 0.20, 0.50, 1, 2, 5];

let state = {
  credit: 0,
  selectedProduct: null,
  selectedCode: null,
  codeBuffer: '',
  completed: false
};

let zoom = 1;
let currentTab = 'graph';

function getDeliveryThreshold() {
  if (state.selectedProduct) return state.selectedProduct.price;
  return 2.00;
}

function makePannable(wrapper) {
  const inner = wrapper.querySelector('.graph-pan-inner');
  let dragging = false, startX, startY, tx = 0, ty = 0;

  function onStart(e) {
    dragging = true;
    const point = e.touches ? e.touches[0] : e;
    startX = point.clientX - tx;
    startY = point.clientY - ty;
    wrapper.style.cursor = 'grabbing';
    e.preventDefault();
  }

  function onMove(e) {
    if (!dragging) return;
    const point = e.touches ? e.touches[0] : e;
    tx = point.clientX - startX;
    ty = point.clientY - startY;
    inner.style.transform = 'translate(' + tx + 'px, ' + ty + 'px)';
  }

  function onEnd() {
    dragging = false;
    wrapper.style.cursor = 'grab';
  }

  wrapper.addEventListener('mousedown', onStart);
  wrapper.addEventListener('touchstart', onStart, { passive: false });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onEnd);
  window.addEventListener('touchend', onEnd);
}

function init() {
  updateDisplay();
  drawGraph();
  updateTime();
  setInterval(updateTime, 1000);
  const panMain = document.getElementById('panMain');
  if (panMain) makePannable(panMain);
}

function updateTime() {
  const now = new Date();
  document.getElementById('displayTime').textContent = now.toLocaleTimeString();
}

function pressKey(key) {
  if (state.codeBuffer.length < 2) {
    state.codeBuffer += key;
    document.getElementById('displayCode').textContent = 'Codigo: ' + state.codeBuffer;
  }
}

function clearCode() {
  state.codeBuffer = '';
  document.getElementById('displayCode').textContent = 'Codigo: --';
}

function confirmCode() {
  if (state.codeBuffer.length === 2) {
    selectByCode(state.codeBuffer);
    clearCode();
  } else {
    document.getElementById('displayMessage').textContent = 'Ingrese codigo de 2 caracteres (ej: A1)';
  }
}

function selectByCode(code) {
  if (!products[code]) {
    document.getElementById('displayMessage').textContent = 'Codigo ' + code + ' no existe';
    return;
  }

  if (state.completed) {
    document.getElementById('displayMessage').textContent = 'Recoja su vuelto primero';
    return;
  }

  const product = products[code];

  document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('prod-' + code).classList.add('selected');

  state.selectedProduct = product;
  state.selectedCode = code;

  document.getElementById('displayCode').textContent = 'Codigo: ' + code;

  if (state.credit >= product.price) {
    dispenseProduct();
  } else {
    const falta = product.price - state.credit;
    document.getElementById('displayMessage').textContent = product.name + ' - Falta: S/ ' + falta.toFixed(2);
  }

  updateDisplay();
  drawGraph();
}

function insertCoin(value) {
  if (state.completed) {
    document.getElementById('displayMessage').textContent = 'Recoja su vuelto primero';
    return;
  }

  state.credit += value;
  updateDisplay();

  if (state.selectedProduct && state.credit >= state.selectedProduct.price) {
    dispenseProduct();
  } else {
    const msg = state.selectedProduct
      ? state.selectedProduct.name + ' - Falta: S/ ' + (state.selectedProduct.price - state.credit).toFixed(2)
      : 'Depositado: S/ ' + state.credit.toFixed(2);
    document.getElementById('displayMessage').textContent = msg;
  }

  drawGraph();
}

function dispenseProduct() {
  if (!state.selectedProduct) return;

  const change = state.credit - state.selectedProduct.price;
  state.completed = true;

  document.getElementById('displayMessage').textContent = state.selectedProduct.name + ' entregado!';

  document.getElementById('changeDisplay').classList.add('active');
  document.getElementById('changeAmount').textContent = 'S/ ' + change.toFixed(2);
  document.getElementById('collectBtn').classList.add('active');
  document.getElementById('displayMessage').textContent += ' | Recoja su vuelto y producto';

  updateDisplay();
  drawGraph();
}

function updateDisplay() {
  document.getElementById('displayState').textContent = 'S/ ' + state.credit.toFixed(2);
}

function returnCoins() {
  if (state.credit === 0) {
    document.getElementById('displayMessage').textContent = 'No hay monedas';
    return;
  }

  state.completed = true;
  document.getElementById('changeDisplay').classList.add('active');
  document.getElementById('changeAmount').textContent = 'S/ ' + state.credit.toFixed(2);
  document.getElementById('collectBtn').classList.add('active');
  document.getElementById('displayMessage').textContent = 'Recoja su devolucion';

  updateDisplay();
  drawGraph();
}

function collectChange() {
  document.getElementById('collectBtn').classList.remove('active');
  resetMachine();
}

function resetMachine() {
  state = {
    credit: 0,
    selectedProduct: null,
    selectedCode: null,
    codeBuffer: '',
    completed: false
  };

  document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('changeDisplay').classList.remove('active');
  document.getElementById('collectBtn').classList.remove('active');
  document.getElementById('displayCode').textContent = 'Codigo: --';
  document.getElementById('displayMessage').textContent = 'Inserte monedas o ingrese codigo';

  updateDisplay();
  drawGraph();
}

function toggleGraph() {
  const container = document.getElementById('mainContainer');
  const panel = document.getElementById('graphPanel');
  container.classList.toggle('show-graph');
  panel.classList.toggle('visible');
  setTimeout(drawGraph, 100);
}

function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  renderTabContent();
}

function renderTabContent() {
  const tabGraph = document.getElementById('tabGraph');
  const tabTable = document.getElementById('tabTable');
  const tabFormal = document.getElementById('tabFormal');

  tabGraph.style.display = currentTab === 'graph' ? 'block' : 'none';
  tabTable.style.display = currentTab === 'table' ? 'block' : 'none';
  tabFormal.style.display = currentTab === 'formal' ? 'block' : 'none';

  if (currentTab === 'graph') {
    setTimeout(drawGraph, 50);
  } else if (currentTab === 'table') {
    renderTransitionTable();
  } else if (currentTab === 'formal') {
    renderFormalDef();
  }
}

function renderTransitionTable() {
  const states = [];
  for (let i = 0; i <= 50; i++) {
    states.push(Math.round(i * 0.10 * 100) / 100);
  }
  const container = document.getElementById('tabTable');
  const threshold = getDeliveryThreshold();
  const productName = state.selectedProduct ? state.selectedProduct.name : 'producto (S/ 2.00)';

  let html = '<p style="color:#ffd700;margin-bottom:10px;font-size:0.9em;">Umbral de entrega: <strong>S/ ' + threshold.toFixed(2) + '</strong>' + (state.selectedProduct ? ' (' + productName + ')' : ' (minimo)') + '</p>';
  html += '<div style="overflow-x:auto;"><table class="transition-table"><thead><tr><th>Estado \\ Entrada</th>';
  coins.forEach(c => html += '<th>S/ ' + c.toFixed(2) + '</th>');
  html += '</tr></thead><tbody>';

  states.forEach(s => {
    html += '<tr><td><strong>S/ ' + s.toFixed(2) + '</strong></td>';
    coins.forEach(c => {
      const next = Math.round((s + c) * 100) / 100;
      if (next >= threshold) {
        html += '<td style="background:#e94560;color:white;">ENTREGA' + (next > threshold ? ' + S/ ' + (next - threshold).toFixed(2) : '') + '</td>';
      } else {
        html += '<td>S/ ' + next.toFixed(2) + '</td>';
      }
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function renderFormalDef() {
  const container = document.getElementById('tabFormal');
  const threshold = getDeliveryThreshold();
  container.innerHTML =
    '<div class="formal-def">' +
    '<h3>Definicion Formal de la MEF</h3>' +
    '<p class="math">M = (Q, Sigma, delta, q0, F)</p>' +
    '<br>' +
    '<p><strong>Q (Estados):</strong> {S/ 0.00, S/ 0.10, S/ 0.20, ..., S/ 5.00} -- 51 estados (incrementos de S/ 0.10)</p>' +
    '<br>' +
    '<p><strong>Sigma (Alfabeto de entradas):</strong> {0.10, 0.20, 0.50, 1, 2, 5}</p>' +
    '<br>' +
    '<p><strong>delta (Funcion de transicion):</strong> delta(q, moneda) = min(q + moneda, S/ 5.00)</p>' +
    '<br>' +
    '<p><strong>q0 (Estado inicial):</strong> S/ 0.00</p>' +
    '<br>' +
    '<p><strong>F (Estados aceptables):</strong> {q en Q | q >= S/ ' + threshold.toFixed(2) + (state.selectedProduct ? ' (precio ' + state.selectedProduct.name + ')' : ' (minimo S/ 2.00)') + '}</p>' +
    '<br>' +
    '<p><strong>Salida:</strong> Producto + Vuelto (si q > precio)</p>' +
    '</div>';
}

function drawGraph() {
  const canvas = document.getElementById('graphCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const threshold = getDeliveryThreshold();
  const currentCredit = state.credit;
  const targetState = Math.round(threshold * 100);

  const coinColors = {
    0.10: '#2563eb',
    0.20: '#7c3aed',
    0.50: '#16a34a',
    1: '#db2777',
    2: '#0891b2',
    5: '#ca8a04'
  };

  const niveles = new Map([[0, 0]]);
  const cola = [0];

  while (cola.length > 0) {
    const estado = cola.shift();
    const nivel = niveles.get(estado);
    coins.forEach((moneda) => {
      const destino = Math.round(Math.min(estado + moneda, threshold) * 100) / 100;
      if (!niveles.has(destino)) {
        niveles.set(destino, nivel + 1);
        if (destino < threshold) cola.push(destino);
      }
    });
  }

  const estados = Array.from(niveles.keys()).sort((a, b) => a - b);
  const maxNivel = Math.max(...Array.from(niveles.values()));
  const columnas = Array.from({ length: maxNivel + 1 }, () => []);
  estados.forEach((estado) => {
    columnas[niveles.get(estado)].push(estado);
  });
  columnas.forEach((columna) => columna.sort((a, b) => a - b));

  const margenX = 86 * zoom;
  const margenY = 92 * zoom;
  const separacionX = 180 * zoom;
  const separacionY = 76 * zoom;
  const puntos = new Map();

  columnas.forEach((columna, nivel) => {
    const alturaColumna = (columna.length - 1) * separacionY;
    const inicioY = margenY + Math.max(0, (canvas.height - margenY - 80 * zoom - alturaColumna) / 2);
    columna.forEach((estado, fila) => {
      puntos.set(estado, {
        estado: estado,
        x: margenX + nivel * separacionX,
        y: inicioY + fila * separacionY
      });
    });
  });

  function drawArrowhead(x, y, angle, color, size) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x - size * 0.45 * Math.cos(angle), y - size * 0.45 * Math.sin(angle));
    ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const nodeRadius = 24 * zoom;

  estados.forEach((estado) => {
    coins.forEach((moneda, indiceMoneda) => {
      const destino = Math.round(Math.min(estado + moneda, threshold) * 100) / 100;
      if (destino === estado) return;
      const origen = puntos.get(estado);
      const puntoDestino = puntos.get(destino);
      if (!origen || !puntoDestino) return;

      const dx = puntoDestino.x - origen.x;
      const dy = puntoDestino.y - origen.y;
      const distancia = Math.hypot(dx, dy) || 1;
      const nx = dx / distancia;
      const ny = dy / distancia;
      const inicioX = origen.x + nx * (nodeRadius + 2);
      const inicioY = origen.y + ny * (nodeRadius + 2);
      const finX = puntoDestino.x - nx * (nodeRadius + 4);
      const finY = puntoDestino.y - ny * (nodeRadius + 4);

      const normalX = -ny;
      const normalY = nx;
      const curva = ((indiceMoneda % 3) - 1) * 16 * zoom;
      const medioX = (inicioX + finX) / 2 + normalX * curva;
      const medioY = (inicioY + finY) / 2 + normalY * curva;

      const tramoAlcanzado = currentCredit >= destino;
      const llegaAceptacion = destino >= threshold;
      const color = tramoAlcanzado ? '#f97316' : llegaAceptacion ? '#16a34a' : coinColors[moneda];

      ctx.strokeStyle = color;
      ctx.lineWidth = tramoAlcanzado ? 3.2 : 2;
      ctx.beginPath();
      ctx.moveTo(inicioX, inicioY);
      ctx.quadraticCurveTo(medioX, medioY, finX, finY);
      ctx.stroke();
      drawArrowhead(finX, finY, Math.atan2(finY - medioY, finX - medioX), color, 11 * zoom);
    });
  });

  puntos.forEach((punto) => {
    const aceptacion = punto.estado >= threshold;
    const activo = Math.abs(punto.estado - currentCredit) < 0.01;
    const radio = aceptacion ? 27 * zoom : 24 * zoom;

    if (aceptacion) {
      ctx.fillStyle = '#ecfdf5';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(punto.x, punto.y, radio + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = activo ? '#fef3c7' : aceptacion ? '#dcfce7' : '#ffffff';
    ctx.strokeStyle = activo ? '#f97316' : aceptacion ? '#16a34a' : '#0f766e';
    ctx.lineWidth = activo ? 4 : 2.5;
    ctx.beginPath();
    ctx.arc(punto.x, punto.y, radio, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = activo ? '#9a3412' : '#134e4a';
    ctx.font = 'bold ' + (12 * zoom) + 'px Arial';
    ctx.fillText('q' + Math.round(punto.estado * 100), punto.x, punto.y - 6);
    ctx.font = (9 * zoom) + 'px Arial';
    ctx.fillStyle = '#64748b';
    ctx.fillText('S/' + punto.estado.toFixed(2), punto.x, punto.y + 9);
  });

  const inicio = puntos.get(0);
  if (inicio) {
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(inicio.x - 52 * zoom, inicio.y);
    ctx.lineTo(inicio.x - nodeRadius - 2, inicio.y);
    ctx.stroke();
    drawArrowhead(inicio.x - nodeRadius - 2, inicio.y, 0, '#0ea5e9', 14 * zoom);
    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold ' + (10 * zoom) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('inicio', inicio.x - 58 * zoom, inicio.y + 20);
  }

  ctx.fillStyle = '#475569';
  ctx.font = (11 * zoom) + 'px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Objetivo: q' + targetState + ' (S/' + threshold.toFixed(2) + ')', 16, 24);
  ctx.fillStyle = '#64748b';
  ctx.font = (10 * zoom) + 'px Arial';
  ctx.fillText('Grafo por niveles: cada flecha muestra una moneda de entrada.', 16, 42);

  const leyendaY = canvas.height - 18;
  ctx.fillStyle = '#475569';
  ctx.font = (10 * zoom) + 'px Arial';
  ctx.fillText('Naranja = tramo recorrido | Verde = llega a aceptacion', 16, leyendaY);
}

function zoomIn() {
  zoom = Math.min(zoom + 0.1, 2);
  drawGraph();
}

function zoomOut() {
  zoom = Math.max(zoom - 0.1, 0.5);
  drawGraph();
}

function centerGraph() {
  zoom = 1;
  drawGraph();
}

window.onload = init;
window.onresize = function() { if (currentTab === 'graph') drawGraph(); };
