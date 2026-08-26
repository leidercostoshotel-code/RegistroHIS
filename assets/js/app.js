/* ============================================================
   Registro Diario HIS — Medicina
   Lógica de la aplicación (estado, render, exportación a xlsx)
   ============================================================ */

const MAX_PACIENTES = 12;

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
               'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const FINANCIADORES = [
  {code:'1',  label:'1 · Usuario'},
  {code:'2',  label:'2 · Seguro Integral de Salud (SIS)'},
  {code:'3',  label:'3 · EsSalud'},
  {code:'4',  label:'4 · SOAT'},
  {code:'5',  label:'5 · Sanidad FAP'},
  {code:'6',  label:'6 · Sanidad Naval'},
  {code:'10', label:'10 · Otros'},
  {code:'11', label:'11 · Exonerado'},
];

const CONDICION = [
  {code:'N', label:'N · Nuevo (1ª vez en su vida)'},
  {code:'C', label:'C · Continuador en el año'},
  {code:'R', label:'R · Reingreso en el año'},
];

const TIPO_DIAG = [
  {code:'P', label:'P · Presuntivo'},
  {code:'D', label:'D · Definitivo'},
  {code:'R', label:'R · Repetido'},
];


/**
 * Construye el campo "CIE/CPT" de una fila de diagnóstico con menú
 * predictivo: al escribir, sugiere códigos/descripciones del dataset
 * local y, al final de la lista, ofrece un enlace al buscador oficial
 * de MINSA REUNIS para códigos que no estén en el subconjunto local.
 * Al elegir una sugerencia (clic o Enter), o al escribir un código que
 * coincide exactamente con uno del dataset, autocompleta el campo
 * "Diagnóstico" de la misma fila con la descripción correspondiente.
 */
function crearCampoCodigoCieCpt(paciente, n, campoDiagnostico){
  const wrap = document.createElement('div');
  wrap.className = 'diag-cod-wrap';

  const cod = document.createElement('input');
  cod.type = 'text';
  cod.className = 'mono diag-cod';
  cod.placeholder = 'CIE / CPT';
  cod.autocomplete = 'off';
  cod.setAttribute('role', 'combobox');
  cod.setAttribute('aria-autocomplete', 'list');
  cod.value = paciente[`codigo${n}`];

  const lista = document.createElement('ul');
  lista.className = 'ac-list';
  lista.setAttribute('role', 'listbox');

  let resultados = [];
  let indiceActivo = -1;

  function cerrarLista(){
    lista.classList.remove('is-open');
    lista.innerHTML = '';
    resultados = [];
    indiceActivo = -1;
  }

  function elegir(item){
    cod.value = item.c;
    paciente[`codigo${n}`] = item.c;
    if(campoDiagnostico){
      campoDiagnostico.value = item.d;
      paciente[`diag${n}`] = item.d;
    }
    cerrarLista();
  }

  // Busca en el dataset un código cuya escritura sea idéntica al valor
  // dado (ignorando mayúsculas/acentos), para autocompletar sin obligar
  // a elegir de la lista.
  function coincidenciaExacta(valor){
    const v = normalizarTexto(valor);
    if(!v) return null;
    return CIE10_CPT_DATASET.find(item => normalizarTexto(item.c) === v) || null;
  }

  function pintarLista(){
    lista.innerHTML = '';
    if(!resultados.length){
      cerrarLista();
      return;
    }
    resultados.forEach((item, i) => {
      const li = document.createElement('li');
      li.className = 'ac-item' + (i === indiceActivo ? ' is-active' : '');
      li.setAttribute('role', 'option');
      const spanCod = document.createElement('span');
      spanCod.className = 'ac-code';
      spanCod.textContent = item.c;
      const spanDesc = document.createElement('span');
      spanDesc.className = 'ac-desc';
      spanDesc.textContent = item.d;
      li.append(spanCod, spanDesc);
      // mousedown (no click) para elegir antes de que el input pierda foco
      li.addEventListener('mousedown', e => { e.preventDefault(); elegir(item); });
      lista.appendChild(li);
    });
    const pie = document.createElement('li');
    pie.className = 'ac-footer';
    const enlace = document.createElement('a');
    enlace.href = CIE10_CPT_URL;
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    enlace.textContent = 'Buscar más en MINSA REUNIS ↗';
    enlace.addEventListener('mousedown', e => e.stopPropagation());
    pie.appendChild(enlace);
    lista.appendChild(pie);
    lista.classList.add('is-open');
  }

  cod.addEventListener('input', e => {
    const valor = e.target.value;
    paciente[`codigo${n}`] = valor;
    resultados = buscarCie10Cpt(valor);
    indiceActivo = -1;
    pintarLista();
    // Coincidencia exacta mientras se escribe: completa el diagnóstico
    // sin esperar a que el usuario elija de la lista.
    const exacto = coincidenciaExacta(valor);
    if(exacto && campoDiagnostico){
      campoDiagnostico.value = exacto.d;
      paciente[`diag${n}`] = exacto.d;
    }
  });

  cod.addEventListener('focus', () => {
    if(cod.value){
      resultados = buscarCie10Cpt(cod.value);
      indiceActivo = -1;
      pintarLista();
    }
  });

  cod.addEventListener('keydown', e => {
    if(e.key === 'Enter'){
      if(lista.classList.contains('is-open') && indiceActivo >= 0 && resultados[indiceActivo]){
        e.preventDefault();
        elegir(resultados[indiceActivo]);
        return;
      }
      // Enter sin sugerencia resaltada: si lo escrito coincide exacto
      // con un código, igual autocompleta el diagnóstico.
      const exacto = coincidenciaExacta(cod.value);
      if(exacto){
        e.preventDefault();
        elegir(exacto);
      }
      return;
    }
    if(!lista.classList.contains('is-open') || !resultados.length) return;
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      indiceActivo = Math.min(indiceActivo + 1, resultados.length - 1);
      pintarLista();
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      indiceActivo = Math.max(indiceActivo - 1, 0);
      pintarLista();
    } else if(e.key === 'Escape'){
      cerrarLista();
    }
  });

  cod.addEventListener('blur', () => {
    setTimeout(() => {
      // Respaldo final: si al salir del campo el valor es un código
      // exacto (ej. pegado con el portapapeles), completa el diagnóstico.
      const exacto = coincidenciaExacta(cod.value);
      if(exacto && campoDiagnostico && !campoDiagnostico.value){
        campoDiagnostico.value = exacto.d;
        paciente[`diag${n}`] = exacto.d;
      }
      cerrarLista();
    }, 120);
  });

  wrap.append(cod, lista);
  return wrap;
}

const today = new Date();

const state = {
  header: {
    anio: today.getFullYear(),
    mes: MESES[today.getMonth()],
    turno: 'MAÑANA',
    nroFormato: '',
    establecimiento: 'C.S. HUASCAR II',
    servicio: 'MEDICINA',
    respNombre: '',
    respDni: '',
  },
  pacientes: [],
};

function nuevoPaciente() {
  return {
    id: crypto.randomUUID(),
    dia: '',
    hc: '',
    dni: '',
    financ: '',
    etnia: '',
    distrito: '',
    edad: '',
    sexo: '',
    establec: '',
    servicioCond: '',
    diag1: '', tipo1: '', lab1: '', codigo1: '',
    diag2: '', tipo2: '', lab2: '', codigo2: '',
    diag3: '', tipo3: '', lab3: '', codigo3: '',
  };
}

/* ---------------- Render ---------------- */

const pacientesEl = document.getElementById('pacientes');
const contadorEl = document.getElementById('contador');
const btnAgregar = document.getElementById('btnAgregar');

function fieldRadio(name, options, current, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'seg';
  options.forEach(opt => {
    const id = `${name}-${opt.code}-${Math.random().toString(36).slice(2,7)}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seg-btn' + (current === opt.code ? ' is-active' : '');
    btn.textContent = opt.code;
    btn.title = opt.label;
    btn.addEventListener('click', () => onChange(opt.code));
    wrap.appendChild(btn);
  });
  return wrap;
}

function labeledInput({label, item, value, placeholder, type='text', onInput, extraClass=''}) {
  const wrap = document.createElement('label');
  wrap.className = 'field ' + extraClass;
  const lab = document.createElement('span');
  lab.className = 'field-label';
  if (item) {
    const badge = document.createElement('span');
    badge.className = 'item-badge';
    badge.textContent = item;
    lab.appendChild(badge);
  }
  lab.appendChild(document.createTextNode(label));
  const input = document.createElement('input');
  input.type = type;
  input.value = value ?? '';
  input.placeholder = placeholder || '';
  if (type === 'number') input.inputMode = 'numeric';
  input.addEventListener('input', e => onInput(e.target.value));
  wrap.appendChild(lab);
  wrap.appendChild(input);
  return wrap;
}

function labeledSelect({label, item, value, options, onChange}) {
  const wrap = document.createElement('label');
  wrap.className = 'field';
  const lab = document.createElement('span');
  lab.className = 'field-label';
  if (item) {
    const badge = document.createElement('span');
    badge.className = 'item-badge';
    badge.textContent = item;
    lab.appendChild(badge);
  }
  lab.appendChild(document.createTextNode(label));
  const sel = document.createElement('select');
  const blank = document.createElement('option');
  blank.value = ''; blank.textContent = '— Seleccionar —';
  sel.appendChild(blank);
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.code; opt.textContent = o.label;
    if (o.code === value) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', e => onChange(e.target.value));
  wrap.appendChild(lab);
  wrap.appendChild(sel);
  return wrap;
}

function segField(label, item, options, value, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const lab = document.createElement('span');
  lab.className = 'field-label';
  if (item) {
    const badge = document.createElement('span');
    badge.className = 'item-badge';
    badge.textContent = item;
  }
  if (item) {
    const badge = document.createElement('span');
    badge.className = 'item-badge';
    badge.textContent = item;
    lab.appendChild(badge);
  }
  lab.appendChild(document.createTextNode(label));
  wrap.appendChild(lab);
  wrap.appendChild(fieldRadio(label, options, value, onChange));
  return wrap;
}

function renderPacientes() {
  pacientesEl.innerHTML = '';
  state.pacientes.forEach((p, idx) => {
    pacientesEl.appendChild(renderPacienteCard(p, idx));
  });
  contadorEl.textContent = `${state.pacientes.length} / ${MAX_PACIENTES} pacientes`;
  btnAgregar.disabled = state.pacientes.length >= MAX_PACIENTES;
  btnAgregar.title = btnAgregar.disabled
    ? `Esta plantilla admite hasta ${MAX_PACIENTES} pacientes por hoja "OK".`
    : '';
}

function renderPacienteCard(p, idx) {
  const card = document.createElement('article');
  card.className = 'card';

  const head = document.createElement('div');
  head.className = 'card-head';
  const num = document.createElement('div');
  num.className = 'card-num';
  num.textContent = idx + 1;
  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = `Paciente ${idx + 1}`;
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'btn-icon';
  del.setAttribute('aria-label', 'Eliminar paciente');
  del.textContent = '✕';
  del.addEventListener('click', () => {
    state.pacientes.splice(idx, 1);
    renderPacientes();
  });
  head.append(num, title, del);
  card.appendChild(head);

  const grid = document.createElement('div');
  grid.className = 'grid';

  grid.appendChild(labeledInput({label:'Día', item:'6', value:p.dia, type:'number', placeholder:'1–31',
    onInput:v=>p.dia=v, extraClass:'span-1 mono'}));
  grid.appendChild(labeledInput({label:'H.C. / Ficha Familiar', item:'7', value:p.hc,
    onInput:v=>p.hc=v, extraClass:'span-2 mono'}));
  grid.appendChild(labeledInput({label:'D.N.I.', item:'8', value:p.dni,
    onInput:v=>p.dni=v, extraClass:'span-2 mono'}));
  grid.appendChild(labeledSelect({label:'Financiador de salud', item:'9', value:p.financ,
    options: FINANCIADORES, onChange:v=>p.financ=v}));
  grid.appendChild(labeledInput({label:'Pertenencia étnica', item:'10', value:p.etnia,
    onInput:v=>p.etnia=v, extraClass:'span-2'}));
  grid.appendChild(labeledInput({label:'Distrito de procedencia', item:'11', value:p.distrito,
    onInput:v=>p.distrito=v, extraClass:'span-2'}));
  grid.appendChild(labeledInput({label:'Edad', item:'12', value:p.edad, type:'number',
    onInput:v=>p.edad=v, extraClass:'span-1 mono'}));

  grid.appendChild(segField('Sexo', '13', [{code:'M',label:'Masculino'},{code:'F',label:'Femenino'}], p.sexo, v=>{p.sexo=v; renderPacientes();}));
  grid.appendChild(segField('Condición: establecimiento', '14', CONDICION, p.establec, v=>{p.establec=v; renderPacientes();}));
  grid.appendChild(segField('Condición: servicio', '15', CONDICION, p.servicioCond, v=>{p.servicioCond=v; renderPacientes();}));

  const diagWrap = document.createElement('div');
  diagWrap.className = 'field span-full';
  const diagLabel = document.createElement('span');
  diagLabel.className = 'field-label';
  const badge16 = document.createElement('span');
  badge16.className = 'item-badge';
  badge16.textContent = '16';
  diagLabel.appendChild(badge16);
  diagLabel.appendChild(document.createTextNode('Diagnóstico / motivo de consulta y/o actividad de salud (hasta 3 líneas)'));
  diagWrap.appendChild(diagLabel);

  const colHead = document.createElement('div');
  colHead.className = 'diag-row diag-colhead';
  const b17 = document.createElement('span');
  b17.className = 'item-badge';
  b17.textContent = '17';
  const tipoHead = document.createElement('span');
  tipoHead.className = 'diag-colhead-label';
  tipoHead.appendChild(b17);
  tipoHead.appendChild(document.createTextNode(' Tipo'));
  const b18 = document.createElement('span');
  b18.className = 'item-badge';
  b18.textContent = '18';
  const labHead = document.createElement('span');
  labHead.className = 'diag-colhead-label';
  labHead.appendChild(b18);
  labHead.appendChild(document.createTextNode(' Lab.'));
  const b19 = document.createElement('span');
  b19.className = 'item-badge';
  b19.textContent = '19';
  const codHead = document.createElement('span');
  codHead.className = 'diag-colhead-label';
  codHead.title = 'Escriba código o descripción para ver sugerencias. Fuente completa: MINSA REUNIS';
  codHead.appendChild(b19);
  codHead.appendChild(document.createTextNode(' CIE/CPT'));
  colHead.append(document.createElement('span'), document.createElement('span'), tipoHead, labHead, codHead);
  diagWrap.appendChild(colHead);

  [1,2,3].forEach(n => {
    const row = document.createElement('div');
    row.className = 'diag-row';
    const numSpan = document.createElement('span');
    numSpan.className = 'diag-n';
    numSpan.textContent = n + '.';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = `Diagnóstico ${n}`;
    inp.value = p[`diag${n}`];
    inp.addEventListener('input', e => p[`diag${n}`] = e.target.value);
    const seg = fieldRadio(`tipo${n}-${p.id}`, TIPO_DIAG, p[`tipo${n}`], v => { p[`tipo${n}`] = v; renderPacientes(); });
    const lab = document.createElement('input');
    lab.type = 'text';
    lab.className = 'mono diag-lab';
    lab.placeholder = 'Lab.';
    lab.value = p[`lab${n}`];
    lab.addEventListener('input', e => p[`lab${n}`] = e.target.value);
    const codWrap = crearCampoCodigoCieCpt(p, n, inp);
    row.append(numSpan, inp, seg, lab, codWrap);
    diagWrap.appendChild(row);
  });
  grid.appendChild(diagWrap);

  card.appendChild(grid);
  return card;
}

btnAgregar.addEventListener('click', () => {
  if (state.pacientes.length >= MAX_PACIENTES) return;
  state.pacientes.push(nuevoPaciente());
  renderPacientes();
});

/* ---------------- Header binding ---------------- */

function bindHeader() {
  const $ = id => document.getElementById(id);

  const anio = $('h-anio');
  anio.value = state.header.anio;
  anio.addEventListener('input', e => state.header.anio = e.target.value);

  const mes = $('h-mes');
  MESES.forEach(m => {
    const o = document.createElement('option');
    o.value = m; o.textContent = m;
    if (m === state.header.mes) o.selected = true;
    mes.appendChild(o);
  });
  mes.addEventListener('change', e => state.header.mes = e.target.value);

  $('h-formato').addEventListener('input', e => state.header.nroFormato = e.target.value);

  const est = $('h-establecimiento');
  est.value = state.header.establecimiento;
  est.addEventListener('input', e => state.header.establecimiento = e.target.value);

  const serv = $('h-servicio');
  serv.value = state.header.servicio;
  serv.addEventListener('input', e => state.header.servicio = e.target.value);

  $('h-resp-nombre').addEventListener('input', e => state.header.respNombre = e.target.value);
  $('h-resp-dni').addEventListener('input', e => state.header.respDni = e.target.value);

  const turnoWrap = $('h-turno');
  function renderTurno() {
    turnoWrap.innerHTML = '';
    turnoWrap.appendChild(fieldRadio('turno',
      [{code:'MAÑANA', label:'Mañana'}, {code:'TARDE', label:'Tarde'}],
      state.header.turno,
      v => { state.header.turno = v; renderTurno(); }));
  }
  renderTurno();
}

/* ---------------- Exportación a Excel ---------------- */

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setCell(xml, addr, value, isNumber) {
  if (value === undefined || value === null || value === '') return xml;
  let re = new RegExp(`<c r="${addr}"([^>]*)/>`);
  let m = xml.match(re);
  if (!m) {
    re = new RegExp(`<c r="${addr}"([^>]*)>([\\s\\S]*?)</c>`);
    m = xml.match(re);
  }
  if (!m) {
    console.warn('Celda no encontrada en la plantilla:', addr);
    return xml;
  }
  const attrs = m[1].replace(/\s*t="[^"]*"/, '');
  let replacement;
  if (isNumber) {
    replacement = `<c r="${addr}"${attrs}><v>${escapeXml(String(value))}</v></c>`;
  } else {
    replacement = `<c r="${addr}"${attrs} t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`;
  }
  return xml.replace(re, replacement);
}

function blockCells(p) {
  const R = 15 + 5 * p; // fila inicial del bloque (0-indexado por paciente)
  return {
    dia: `B${R}`, hc: `C${R}`, dni: `C${R+2}`, financ: `D${R}`,
    etnia: `E${R}`, distrito: `F${R}`, edad: `I${R}`,
    sexoM: `J${R}`, sexoF: `J${R+2}`,
    estN: `K${R}`, estC: `K${R+1}`, estR: `K${R+3}`,
    servN: `L${R}`, servC: `L${R+1}`, servR: `L${R+3}`,
    diag1: `N${R}`, diag2: `N${R+1}`, diag3: `N${R+3}`,
    tipo1P: `Q${R}`, tipo1D: `R${R}`, tipo1R: `S${R}`,
    tipo2P: `Q${R+1}`, tipo2D: `R${R+1}`, tipo2R: `S${R+1}`,
    tipo3P: `Q${R+3}`, tipo3D: `R${R+3}`, tipo3R: `S${R+3}`,
    lab1: `T${R}`,   codigo1: `U${R}`,
    lab2: `T${R+1}`, codigo2: `U${R+1}`,
    lab3: `T${R+3}`, codigo3: `U${R+3}`,
  };
}

async function exportarExcel() {
  const btn = document.getElementById('btnExportar');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Generando archivo…';
  try {
    const bin = Uint8Array.from(atob(TEMPLATE_B64), c => c.charCodeAt(0));
    const zip = await JSZip.loadAsync(bin);

    // ---------- Hoja OK (registro diario, hasta 12 pacientes) ----------
    let ok = await zip.file('xl/worksheets/sheet1.xml').async('string');
    const h = state.header;
    ok = setCell(ok, 'B8', h.anio, true);
    ok = setCell(ok, 'C8', h.mes, false);
    ok = setCell(ok, 'A4', h.nroFormato, false);
    ok = setCell(ok, 'E8', h.establecimiento, false);
    ok = setCell(ok, 'L8', h.servicio, false);
    const responsable = [h.respNombre, h.respDni ? `DNI: ${h.respDni}` : ''].filter(Boolean).join('   ');
    ok = setCell(ok, 'P8', responsable, false);
    if (h.turno === 'MAÑANA') ok = setCell(ok, 'S2', '(MAÑANA)', false);
    if (h.turno === 'TARDE') ok = setCell(ok, 'U2', '(TARDE)', false);

    state.pacientes.forEach((p, idx) => {
      const c = blockCells(idx);
      ok = setCell(ok, c.dia, p.dia, true);
      ok = setCell(ok, c.hc, p.hc, false);
      ok = setCell(ok, c.dni, p.dni, false);
      ok = setCell(ok, c.financ, p.financ, false);
      ok = setCell(ok, c.etnia, p.etnia, false);
      ok = setCell(ok, c.distrito, p.distrito, false);
      ok = setCell(ok, c.edad, p.edad, true);
      if (p.sexo === 'M') ok = setCell(ok, c.sexoM, '(M)', false);
      if (p.sexo === 'F') ok = setCell(ok, c.sexoF, '(F)', false);
      if (p.establec === 'N') ok = setCell(ok, c.estN, '(N)', false);
      if (p.establec === 'C') ok = setCell(ok, c.estC, '(C)', false);
      if (p.establec === 'R') ok = setCell(ok, c.estR, '(R)', false);
      if (p.servicioCond === 'N') ok = setCell(ok, c.servN, '(N)', false);
      if (p.servicioCond === 'C') ok = setCell(ok, c.servC, '(C)', false);
      if (p.servicioCond === 'R') ok = setCell(ok, c.servR, '(R)', false);
      ok = setCell(ok, c.diag1, p.diag1, false);
      ok = setCell(ok, c.diag2, p.diag2, false);
      ok = setCell(ok, c.diag3, p.diag3, false);
      if (p.tipo1 === 'P') ok = setCell(ok, c.tipo1P, '(P)', false);
      if (p.tipo1 === 'D') ok = setCell(ok, c.tipo1D, '(D)', false);
      if (p.tipo1 === 'R') ok = setCell(ok, c.tipo1R, '(R)', false);
      if (p.tipo2 === 'P') ok = setCell(ok, c.tipo2P, '(P)', false);
      if (p.tipo2 === 'D') ok = setCell(ok, c.tipo2D, '(D)', false);
      if (p.tipo2 === 'R') ok = setCell(ok, c.tipo2R, '(R)', false);
      if (p.tipo3 === 'P') ok = setCell(ok, c.tipo3P, '(P)', false);
      if (p.tipo3 === 'D') ok = setCell(ok, c.tipo3D, '(D)', false);
      if (p.tipo3 === 'R') ok = setCell(ok, c.tipo3R, '(R)', false);
      ok = setCell(ok, c.lab1, p.lab1, false);
      ok = setCell(ok, c.codigo1, p.codigo1, false);
      ok = setCell(ok, c.lab2, p.lab2, false);
      ok = setCell(ok, c.codigo2, p.codigo2, false);
      ok = setCell(ok, c.lab3, p.lab3, false);
      ok = setCell(ok, c.codigo3, p.codigo3, false);
    });
    zip.file('xl/worksheets/sheet1.xml', ok);

    // ---------- Hoja LADO (encabezado, para mantener ambas hojas coherentes) ----------
    let lado = await zip.file('xl/worksheets/sheet2.xml').async('string');
    lado = setCell(lado, 'B8', h.anio, true);
    lado = setCell(lado, 'C8', h.mes, false);
    if (h.establecimiento) lado = setCell(lado, 'D8', h.establecimiento, false);
    if (h.servicio) lado = setCell(lado, 'N8', h.servicio, false);
    if (h.respNombre) lado = setCell(lado, 'S8', `${h.respNombre}   DNI:`, false);
    if (h.respDni) lado = setCell(lado, 'T8', h.respDni, false);
    zip.file('xl/worksheets/sheet2.xml', lado);

    const blob = await zip.generateAsync({ type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const fecha = `${String(h.anio)}-${h.mes}`.replace(/\s+/g, '_');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `HIS_Medicina_${fecha}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error(err);
    alert('Ocurrió un problema al generar el archivo. Revisa la consola para más detalle.');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

document.getElementById('btnExportar').addEventListener('click', exportarExcel);

/* ---------------- Init ---------------- */

bindHeader();
state.pacientes.push(nuevoPaciente());
renderPacientes();

