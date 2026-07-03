const products = {
  'A1': { name: 'Agua Cielo', icon: '', price: 2.50, desc: '625 ml', image: 'imagenes/Agua/cielo-sin-gas2.png' },
  'A2': { name: 'Jugo Durazno', icon: '', price: 2.80, desc: '300 ml', image: 'imagenes/Agua/durazno-600x600.png' },
  'A3': { name: 'Jugo Mango', icon: '', price: 2.80, desc: '300 ml', image: 'imagenes/Agua/mango-2-600x600.png' },
  'A4': { name: 'Jugo Naranja', icon: '', price: 2.80, desc: '300 ml', image: 'imagenes/Agua/naranja-600x600.png' },
  'B1': { name: 'Galleta Coco', icon: '', price: 4.60, desc: '6 u', image: 'imagenes/Galletas/Galleta-coco-1-600x600.png' },
  'B2': { name: 'Galleta Kiwicha', icon: '', price: 4.60, desc: '6 u', image: 'imagenes/Galletas/Galleta-kiwicha-int-600x600.png' },
  'B3': { name: 'Galleta Naranja', icon: '', price: 4.60, desc: '6 u', image: 'imagenes/Galletas/Galleta-naranja-1-600x600.png' },
  'B4': { name: 'Pan Integral', icon: '', price: 5.00, desc: 'Mediano', image: 'imagenes/Galletas/Pan-integ-mediano-600x600.png' },
  'C1': { name: 'Palitos Clasicos', icon: '', price: 3.00, desc: '60 g', image: 'imagenes/Snaks/Palitos-clasicos-600x600.png' },
  'C2': { name: 'Palitos Especias', icon: '', price: 3.70, desc: '60 g', image: 'imagenes/Snaks/Palitos-de-Especias-600x600.png' },
  'C3': { name: 'Tostada Blanca', icon: '', price: 3.70, desc: '6 u', image: 'imagenes/Snaks/Tosatada-blanca-600x600.png' },
  'C4': { name: 'Tostada Integral', icon: '', price: 4.00, desc: '6 u', image: 'imagenes/Snaks/Tosatada-integ-600x600.png' }
};

const coins = [0.10, 0.20, 0.50, 1, 2, 5];

let state = {
  credit: 0,
  selectedProduct: null,
  selectedCode: null,
  codeBuffer: '',
  completed: false,
  history: []
};

let zoom = 1;
let currentTab = 'graph';

function getDeliveryThreshold() {
  if (state.selectedProduct) return state.selectedProduct.price;
  return 2.50;
}

function makePanZoom(wrapper, options) {
  const inner = wrapper.querySelector('.graph-pan-inner');
  const state = {
    tx: 0,
    ty: 0,
    scale: 1,
    minScale: 0.25,
    maxScale: 3,
    factor: 1.15
  };
  if (options) {
    Object.assign(state, options);
  }

  let dragging = false, startX, startY;
  let pinch = null;

  function update() {
    inner.style.transform = 'translate(' + state.tx.toFixed(2) + 'px, ' + state.ty.toFixed(2) + 'px) scale(' + state.scale.toFixed(3) + ')';
  }

  function setScale(newScale, px, py) {
    newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
    if (Math.abs(newScale - state.scale) < 0.001) return;
    if (px == null || py == null) {
      const rect = inner.getBoundingClientRect();
      px = rect.width / 2;
      py = rect.height / 2;
    }
    state.tx = px - (px - state.tx) * newScale / state.scale;
    state.ty = py - (py - state.ty) * newScale / state.scale;
    state.scale = newScale;
    update();
  }

  function onStart(e) {
    if (e.touches && e.touches.length === 2) return;
    dragging = true;
    const point = e.touches ? e.touches[0] : e;
    startX = point.clientX - state.tx;
    startY = point.clientY - state.ty;
    wrapper.style.cursor = 'grabbing';
    e.preventDefault();
  }

  function onMove(e) {
    if (!dragging) return;
    const point = e.touches ? e.touches[0] : e;
    state.tx = point.clientX - startX;
    state.ty = point.clientY - startY;
    update();
  }

  function onEnd() {
    dragging = false;
    wrapper.style.cursor = 'grab';
  }

  function onWheel(e) {
    e.preventDefault();
    const rect = inner.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const dir = e.deltaY < 0 ? 1 : -1;
    const newScale = state.scale * (dir > 0 ? state.factor : 1 / state.factor);
    setScale(newScale, px, py);
  }

  function onTouchStart(e) {
    if (e.touches.length === 2) {
      const p1 = e.touches[0];
      const p2 = e.touches[1];
      pinch = {
        dist: Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY),
        scale: state.scale,
        mx: (p1.clientX + p2.clientX) / 2,
        my: (p1.clientY + p2.clientY) / 2,
        tx: state.tx,
        ty: state.ty
      };
      e.preventDefault();
    }
  }

  function onTouchMove(e) {
    if (!pinch || e.touches.length !== 2) return;
    e.preventDefault();
    const p1 = e.touches[0];
    const p2 = e.touches[1];
    const dist = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
    const newScale = pinch.scale * (dist / pinch.dist);
    const rect = inner.getBoundingClientRect();
    const px = pinch.mx - rect.left;
    const py = pinch.my - rect.top;
    state.tx = px - (px - pinch.tx) * newScale / pinch.scale;
    state.ty = py - (py - pinch.ty) * newScale / pinch.scale;
    state.scale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
    update();
  }

  function onTouchEnd(e) {
    if (e.touches.length < 2) pinch = null;
  }

  wrapper.addEventListener('mousedown', onStart);
  wrapper.addEventListener('touchstart', onTouchStart, { passive: false });
  wrapper.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('mouseup', onEnd);
  window.addEventListener('touchend', onTouchEnd);

  const api = {
    zoomIn: function() {
      const rect = inner.getBoundingClientRect();
      setScale(state.scale * state.factor, rect.width / 2, rect.height / 2);
    },
    zoomOut: function() {
      const rect = inner.getBoundingClientRect();
      setScale(state.scale / state.factor, rect.width / 2, rect.height / 2);
    },
    center: function() {
      state.tx = 0;
      state.ty = 0;
      state.scale = 1;
      update();
    },
    fit: function() {
      const cw = parseFloat(inner.dataset.contentWidth || inner.offsetWidth);
      const ch = parseFloat(inner.dataset.contentHeight || inner.offsetHeight);
      const rect = wrapper.getBoundingClientRect();
      const scale = Math.min(rect.width / cw, rect.height / ch, 1);
      state.scale = Math.max(state.minScale, scale);
      state.tx = (rect.width - cw * state.scale) / 2;
      state.ty = (rect.height - ch * state.scale) / 2;
      update();
    }
  };

  wrapper.panZoomApi = api;
  return api;
}

function init() {
  updateDisplay();
  drawGraph();
  updateTime();
  setInterval(updateTime, 1000);
  const panMain = document.getElementById('panMain');
  if (panMain) window.mainGraphPanzoom = makePanZoom(panMain);
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

  const prevCredit = state.credit;
  state.credit = Math.round((state.credit + value) * 100) / 100;
  
  if (!state.history) state.history = [];
  state.history.push({
    from: prevCredit,
    coin: value,
    to: state.credit
  });

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
    completed: false,
    history: []
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
  const productName = state.selectedProduct ? state.selectedProduct.name : 'producto (S/ 2.50)';

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
    '<p><strong>F (Estados aceptables):</strong> {q en Q | q >= S/ ' + threshold.toFixed(2) + (state.selectedProduct ? ' (precio ' + state.selectedProduct.name + ')' : ' (minimo S/ 2.50)') + '}</p>' +
    '<br>' +
    '<p><strong>Salida:</strong> Producto + Vuelto (si q > precio)</p>' +
    '</div>';
}

function drawGraph() {
  const canvas = document.getElementById('graphCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;

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

  // BFS to find all states up to threshold
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

  // Calculate positions for all normal nodes
  columnas.forEach((columna, nivel) => {
    const alturaColumna = (columna.length - 1) * separacionY;
    const baseY = margenY + 40 * zoom;
    const inicioY = baseY + Math.max(0, (500 * zoom - alturaColumna) / 2);
    columna.forEach((estado, fila) => {
      puntos.set(estado, {
        estado: estado,
        x: margenX + nivel * separacionX,
        y: inicioY + fila * separacionY
      });
    });
  });

  // Calculate ENTREGA node position (one column to the right)
  const entregaX = margenX + (maxNivel + 1) * separacionX;
  let entregaCenterY = margenY + 200 * zoom;
  // Place ENTREGA at the center of the threshold nodes
  const thresholdPunto = puntos.get(threshold);
  if (thresholdPunto) {
    entregaCenterY = thresholdPunto.y;
  }

  // Calculate VUELTO node position
  const hasChange = state.completed && state.selectedProduct && (currentCredit - state.selectedProduct.price) > 0.005;
  const changeAmount = hasChange ? Math.round((currentCredit - state.selectedProduct.price) * 100) / 100 : 0;
  const vueltoX = entregaX + separacionX;
  const vueltoCenterY = entregaCenterY + 80 * zoom;

  // Calculate q0 return target for arrows
  const q0Punto = puntos.get(0);

  // Now compute canvas size based on all node positions
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  puntos.forEach(function(p) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });
  // Include ENTREGA node
  maxX = Math.max(maxX, entregaX);
  maxY = Math.max(maxY, entregaCenterY);
  minX = Math.min(minX, entregaX);
  minY = Math.min(minY, entregaCenterY);
  // Include VUELTO node if applicable
  if (hasChange) {
    maxX = Math.max(maxX, vueltoX);
    maxY = Math.max(maxY, vueltoCenterY);
  }

  const pad = 60 * zoom;
  const graphWidth = maxX + pad + 60 * zoom;
  const graphHeight = maxY + pad + 40 * zoom;

  // Size canvas to fit content OR container, whichever is larger
  canvas.width = Math.max(container.offsetWidth, graphWidth);
  canvas.height = Math.max(container.offsetHeight, graphHeight);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set content dimensions for pan/zoom fit()
  container.dataset.contentWidth = graphWidth.toString();
  container.dataset.contentHeight = graphHeight.toString();

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
  const isCompleted = state.completed;

  // ===== DRAW NORMAL ARROWS =====
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

      // Check if this transition was traversed in state.history
      const tramoAlcanzado = state.history && state.history.some(step => {
        const matchesFrom = Math.abs(step.from - estado) < 0.005;
        const matchesCoin = Math.abs(step.coin - moneda) < 0.005;
        const matchesTo = Math.abs(step.to - destino) < 0.005;
        return matchesFrom && matchesCoin && matchesTo;
      });
      const llegaAceptacion = destino >= threshold;
      const color = tramoAlcanzado ? '#f97316' : llegaAceptacion ? '#16a34a' : coinColors[moneda];

      // Attenuate non-traversed arrows when completed
      ctx.save();
      if (isCompleted && !tramoAlcanzado) {
        ctx.globalAlpha = 0.2;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = tramoAlcanzado ? 3.2 : 2;
      ctx.beginPath();
      ctx.moveTo(inicioX, inicioY);
      ctx.quadraticCurveTo(medioX, medioY, finX, finY);
      ctx.stroke();
      drawArrowhead(finX, finY, Math.atan2(finY - medioY, finX - medioX), color, 11 * zoom);
      ctx.restore();
    });
  });

  // ===== DRAW ARROWS TO ENTREGA NODE =====
  // Find all states that can reach threshold with one coin (these arrow to ENTREGA)
  const entregaRadius = 30 * zoom;
  estados.forEach((estado) => {
    coins.forEach((moneda, indiceMoneda) => {
      const destino = Math.round(Math.min(estado + moneda, threshold) * 100) / 100;
      if (destino < threshold) return;
      if (destino === estado) return;
      const origen = puntos.get(estado);
      if (!origen) return;

      const dx = entregaX - origen.x;
      const dy = entregaCenterY - origen.y;
      const distancia = Math.hypot(dx, dy) || 1;
      const nx = dx / distancia;
      const ny = dy / distancia;
      const inicioX = origen.x + nx * (nodeRadius + 2);
      const inicioY = origen.y + ny * (nodeRadius + 2);
      const finX = entregaX - nx * (entregaRadius + 4);
      const finY = entregaCenterY - ny * (entregaRadius + 4);

      const normalX = -ny;
      const normalY = nx;
      const curva = ((indiceMoneda % 3) - 1) * 14 * zoom;
      const medioX = (inicioX + finX) / 2 + normalX * curva;
      const medioY = (inicioY + finY) / 2 + normalY * curva;

      // Check if this transition was traversed in state.history and reached threshold
      const tramoAlcanzado = isCompleted && state.history && state.history.some(step => {
        const matchesFrom = Math.abs(step.from - estado) < 0.005;
        const matchesCoin = Math.abs(step.coin - moneda) < 0.005;
        const matchesTo = step.to >= threshold - 0.005;
        return matchesFrom && matchesCoin && matchesTo;
      });
      const color = tramoAlcanzado ? '#f97316' : '#16a34a';

      ctx.save();
      if (isCompleted && !tramoAlcanzado) {
        ctx.globalAlpha = 0.2;
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = tramoAlcanzado ? 3.2 : 2;
      ctx.beginPath();
      ctx.moveTo(inicioX, inicioY);
      ctx.quadraticCurveTo(medioX, medioY, finX, finY);
      ctx.stroke();
      drawArrowhead(finX, finY, Math.atan2(finY - medioY, finX - medioX), color, 11 * zoom);
      ctx.restore();
    });
  });

  // ===== DRAW GOLDEN DASHED ARROWS (ENTREGA → VUELTO → q0  OR  ENTREGA → q0) =====
  if (isCompleted) {
    ctx.save();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3 * zoom;
    ctx.setLineDash([8 * zoom, 5 * zoom]);

    if (hasChange) {
      // Arrow: ENTREGA → VUELTO
      const dxEV = vueltoX - entregaX;
      const dyEV = vueltoCenterY - entregaCenterY;
      const distEV = Math.hypot(dxEV, dyEV) || 1;
      const nxEV = dxEV / distEV;
      const nyEV = dyEV / distEV;
      const startEVx = entregaX + nxEV * (entregaRadius + 2);
      const startEVy = entregaCenterY + nyEV * (entregaRadius + 2);
      const endEVx = vueltoX - nxEV * (entregaRadius + 4);
      const endEVy = vueltoCenterY - nyEV * (entregaRadius + 4);

      ctx.beginPath();
      ctx.moveTo(startEVx, startEVy);
      ctx.lineTo(endEVx, endEVy);
      ctx.stroke();
      ctx.setLineDash([]);
      drawArrowhead(endEVx, endEVy, Math.atan2(dyEV, dxEV), '#ffd700', 13 * zoom);
      ctx.setLineDash([8 * zoom, 5 * zoom]);

      // Arrow: VUELTO → q0 (curved)
      if (q0Punto) {
        const dxVQ = q0Punto.x - vueltoX;
        const dyVQ = q0Punto.y - vueltoCenterY;
        const distVQ = Math.hypot(dxVQ, dyVQ) || 1;
        const nxVQ = dxVQ / distVQ;
        const nyVQ = dyVQ / distVQ;
        const startVQx = vueltoX + nxVQ * (entregaRadius + 2);
        const startVQy = vueltoCenterY + nyVQ * (entregaRadius + 2);
        const endVQx = q0Punto.x - nxVQ * (nodeRadius + 4);
        const endVQy = q0Punto.y - nyVQ * (nodeRadius + 4);

        // Curve the return arrow below
        const curvaMidX = (startVQx + endVQx) / 2;
        const curvaMidY = Math.max(startVQy, endVQy) + 80 * zoom;

        ctx.beginPath();
        ctx.moveTo(startVQx, startVQy);
        ctx.quadraticCurveTo(curvaMidX, curvaMidY, endVQx, endVQy);
        ctx.stroke();
        ctx.setLineDash([]);
        drawArrowhead(endVQx, endVQy, Math.atan2(endVQy - curvaMidY, endVQx - curvaMidX), '#ffd700', 13 * zoom);
      }
    } else {
      // Exact payment: ENTREGA → q0 directly (curved)
      if (q0Punto) {
        const dxEQ = q0Punto.x - entregaX;
        const dyEQ = q0Punto.y - entregaCenterY;
        const distEQ = Math.hypot(dxEQ, dyEQ) || 1;
        const nxEQ = dxEQ / distEQ;
        const nyEQ = dyEQ / distEQ;
        const startEQx = entregaX + nxEQ * (entregaRadius + 2);
        const startEQy = entregaCenterY + nyEQ * (entregaRadius + 2);
        const endEQx = q0Punto.x - nxEQ * (nodeRadius + 4);
        const endEQy = q0Punto.y - nyEQ * (nodeRadius + 4);

        const curvaMidX = (startEQx + endEQx) / 2;
        const curvaMidY = Math.max(startEQy, endEQy) + 100 * zoom;

        ctx.beginPath();
        ctx.moveTo(startEQx, startEQy);
        ctx.quadraticCurveTo(curvaMidX, curvaMidY, endEQx, endEQy);
        ctx.stroke();
        ctx.setLineDash([]);
        drawArrowhead(endEQx, endEQy, Math.atan2(endEQy - curvaMidY, endEQx - curvaMidX), '#ffd700', 13 * zoom);
      }
    }
    ctx.restore();
  }

  // ===== DRAW NORMAL NODES =====
  puntos.forEach((punto) => {
    const aceptacion = punto.estado >= threshold;
    const activo = Math.abs(punto.estado - currentCredit) < 0.01 && !isCompleted;
    const visitado = (punto.estado === 0) || (state.history && state.history.some(step => Math.abs(step.to - punto.estado) < 0.005 || Math.abs(step.from - punto.estado) < 0.005));
    const radio = aceptacion ? 27 * zoom : 24 * zoom;

    ctx.save();
    if (isCompleted && !visitado && !aceptacion) {
      ctx.globalAlpha = 0.2;
    }

    if (aceptacion) {
      ctx.fillStyle = '#ecfdf5';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(punto.x, punto.y, radio + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = activo ? '#fef3c7' : visitado ? '#ffedd5' : aceptacion ? '#dcfce7' : '#ffffff';
    ctx.strokeStyle = activo ? '#f97316' : visitado ? '#f97316' : aceptacion ? '#16a34a' : '#0f766e';
    ctx.lineWidth = activo ? 4 : visitado ? 3 : 2.5;
    ctx.beginPath();
    ctx.arc(punto.x, punto.y, radio, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = activo ? '#9a3412' : visitado ? '#c2410c' : '#134e4a';
    ctx.font = 'bold ' + (12 * zoom) + 'px Arial';
    ctx.fillText('q' + Math.round(punto.estado * 100), punto.x, punto.y - 6);
    ctx.font = (9 * zoom) + 'px Arial';
    ctx.fillStyle = '#64748b';
    ctx.fillText('S/' + punto.estado.toFixed(2), punto.x, punto.y + 9);
    ctx.restore();
  });

  // ===== DRAW ENTREGA NODE =====
  ctx.save();
  // Glow effect
  if (isCompleted) {
    ctx.shadowColor = '#16a34a';
    ctx.shadowBlur = 20 * zoom;
  }
  // Outer ring (double border)
  ctx.fillStyle = '#ecfdf5';
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(entregaX, entregaCenterY, entregaRadius + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Inner circle
  ctx.fillStyle = isCompleted ? '#bbf7d0' : '#dcfce7';
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(entregaX, entregaCenterY, entregaRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Label
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#166534';
  ctx.font = 'bold ' + (11 * zoom) + 'px Arial';
  ctx.fillText('ENTREGA', entregaX, entregaCenterY - 5);
  ctx.font = (9 * zoom) + 'px Arial';
  ctx.fillStyle = '#16a34a';
  ctx.fillText('✓ Producto', entregaX, entregaCenterY + 10);
  ctx.restore();

  // ===== DRAW VUELTO NODE (only when there's change) =====
  if (hasChange) {
    ctx.save();
    if (isCompleted) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 20 * zoom;
    }
    // Outer ring
    ctx.fillStyle = '#fefce8';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(vueltoX, vueltoCenterY, entregaRadius + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Inner circle
    ctx.fillStyle = isCompleted ? '#fef08a' : '#fefce8';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(vueltoX, vueltoCenterY, entregaRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold ' + (11 * zoom) + 'px Arial';
    ctx.fillText('VUELTO', vueltoX, vueltoCenterY - 5);
    ctx.font = 'bold ' + (10 * zoom) + 'px Arial';
    ctx.fillStyle = '#b45309';
    ctx.fillText('S/ ' + changeAmount.toFixed(2), vueltoX, vueltoCenterY + 10);
    ctx.restore();
  }

  // ===== DRAW INITIAL ARROW =====
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

  // ===== HEADER TEXT =====
  ctx.fillStyle = '#475569';
  ctx.font = (11 * zoom) + 'px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Objetivo: q' + targetState + ' (S/' + threshold.toFixed(2) + ')', 16, 24);
  ctx.fillStyle = '#64748b';
  ctx.font = (10 * zoom) + 'px Arial';
  ctx.fillText('Grafo por niveles: cada flecha muestra una moneda de entrada.', 16, 42);

  // ===== LEGEND TEXT =====
  const leyendaY = canvas.height - 18;
  ctx.fillStyle = '#475569';
  ctx.font = (10 * zoom) + 'px Arial';
  if (isCompleted) {
    ctx.fillText('Naranja = recorrido | Verde = aceptación | Dorado = entrega/vuelto', 16, leyendaY);
  } else {
    ctx.fillText('Naranja = tramo recorrido | Verde = llega a aceptación', 16, leyendaY);
  }
}

function zoomIn() {
  if (window.mainGraphPanzoom) window.mainGraphPanzoom.zoomIn();
}

function zoomOut() {
  if (window.mainGraphPanzoom) window.mainGraphPanzoom.zoomOut();
}

function centerGraph() {
  if (window.mainGraphPanzoom) window.mainGraphPanzoom.center();
}

function fitGraph() {
  if (window.mainGraphPanzoom) window.mainGraphPanzoom.fit();
}

window.onload = init;
window.onresize = function() { if (currentTab === 'graph') drawGraph(); };
