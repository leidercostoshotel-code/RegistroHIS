/* ============================================================
   Buscador predictivo CIE-10 / CPT
   Fuente de referencia completa (consulta manual en línea):
   MINSA · REUNIS — https://www.minsa.gob.pe/reunis/?op=2&niv=15
   El listado local es un subconjunto curado de los códigos más
   usados en consulta ambulatoria, para autocompletar sin depender
   de conexión a internet. Ante un código no listado, usar el
   enlace "Buscar más en MINSA REUNIS" del propio menú.
   ============================================================ */
const CIE10_CPT_URL = 'https://www.minsa.gob.pe/reunis/?op=2&niv=15';

const CIE10_CPT_DATASET = [
  {c:'A00.9',  d:'Cólera, no especificado'},
  {c:'A09',    d:'Diarrea y gastroenteritis de presunto origen infeccioso'},
  {c:'A15.0',  d:'Tuberculosis pulmonar, con confirmación bacteriológica'},
  {c:'A16.9',  d:'Tuberculosis del aparato respiratorio, no especificada'},
  {c:'A49.9',  d:'Infección bacteriana, no especificada'},
  {c:'A90',    d:'Fiebre del dengue [dengue clásico]'},
  {c:'A91',    d:'Fiebre del dengue hemorrágico'},
  {c:'B01.9',  d:'Varicela sin complicaciones'},
  {c:'B02.9',  d:'Herpes zóster sin complicaciones'},
  {c:'B34.9',  d:'Infección viral, no especificada'},
  {c:'B35.4',  d:'Tiña del cuerpo'},
  {c:'B37.9',  d:'Candidiasis, no especificada'},
  {c:'B82.9',  d:'Parasitosis intestinal, sin otra especificación'},
  {c:'D50.9',  d:'Anemia por deficiencia de hierro, sin otra especificación'},
  {c:'E03.9',  d:'Hipotiroidismo, no especificado'},
  {c:'E04.9',  d:'Bocio no tóxico, no especificado'},
  {c:'E10.9',  d:'Diabetes mellitus tipo 1, sin complicaciones'},
  {c:'E11.9',  d:'Diabetes mellitus tipo 2, sin complicaciones'},
  {c:'E44.0',  d:'Desnutrición proteicocalórica de grado moderado'},
  {c:'E46',    d:'Desnutrición proteicocalórica, no especificada'},
  {c:'E66.9',  d:'Obesidad, no especificada'},
  {c:'E78.5',  d:'Hiperlipidemia, no especificada'},
  {c:'F10.2',  d:'Trastornos mentales por consumo de alcohol, síndrome de dependencia'},
  {c:'F32.9',  d:'Episodio depresivo, no especificado'},
  {c:'F41.1',  d:'Trastorno de ansiedad generalizada'},
  {c:'F41.9',  d:'Trastorno de ansiedad, no especificado'},
  {c:'G40.9',  d:'Epilepsia, no especificada'},
  {c:'G43.9',  d:'Migraña, no especificada'},
  {c:'G47.0',  d:'Trastornos del inicio y del mantenimiento del sueño (insomnio)'},
  {c:'H10.9',  d:'Conjuntivitis, no especificada'},
  {c:'H60.9',  d:'Otitis externa, no especificada'},
  {c:'H66.9',  d:'Otitis media, no especificada'},
  {c:'I10',    d:'Hipertensión esencial (primaria)'},
  {c:'I25.9',  d:'Enfermedad isquémica crónica del corazón, no especificada'},
  {c:'J00',    d:'Rinofaringitis aguda [resfriado común]'},
  {c:'J01.9',  d:'Sinusitis aguda, no especificada'},
  {c:'J02.9',  d:'Faringitis aguda, no especificada'},
  {c:'J03.9',  d:'Amigdalitis aguda, no especificada'},
  {c:'J06.9',  d:'Infección aguda de las vías respiratorias superiores, no especificada'},
  {c:'J11.1',  d:'Influenza con otras manifestaciones respiratorias, virus no identificado'},
  {c:'J18.9',  d:'Neumonía, no especificada'},
  {c:'J20.9',  d:'Bronquitis aguda, no especificada'},
  {c:'J30.4',  d:'Rinitis alérgica, no especificada'},
  {c:'J44.9',  d:'Enfermedad pulmonar obstructiva crónica, no especificada'},
  {c:'J45.9',  d:'Asma, no especificada'},
  {c:'K02.9',  d:'Caries dental, no especificada'},
  {c:'K04.0',  d:'Pulpitis'},
  {c:'K05.6',  d:'Enfermedad periodontal, no especificada'},
  {c:'K21.9',  d:'Enfermedad del reflujo gastroesofágico sin esofagitis'},
  {c:'K29.7',  d:'Gastritis, no especificada'},
  {c:'K30',    d:'Dispepsia'},
  {c:'K35.80', d:'Apendicitis aguda, no especificada'},
  {c:'K52.9',  d:'Gastroenteritis y colitis no infecciosas, no especificadas'},
  {c:'K59.0',  d:'Estreñimiento'},
  {c:'L01.0',  d:'Impétigo'},
  {c:'L03.9',  d:'Celulitis, no especificada'},
  {c:'L20.9',  d:'Dermatitis atópica, no especificada'},
  {c:'L23.9',  d:'Dermatitis alérgica de contacto, de causa no especificada'},
  {c:'L30.9',  d:'Dermatitis, no especificada'},
  {c:'M10.9',  d:'Gota, no especificada'},
  {c:'M25.5',  d:'Dolor articular'},
  {c:'M54.2',  d:'Cervicalgia'},
  {c:'M54.5',  d:'Lumbago, no especificado'},
  {c:'M79.1',  d:'Mialgia'},
  {c:'N18.9',  d:'Enfermedad renal crónica, no especificada'},
  {c:'N30.0',  d:'Cistitis aguda'},
  {c:'N39.0',  d:'Infección de vías urinarias, sitio no especificado'},
  {c:'N76.0',  d:'Vaginitis aguda'},
  {c:'R05',    d:'Tos'},
  {c:'R06.0',  d:'Disnea'},
  {c:'R10.4',  d:'Otros dolores abdominales y los no especificados'},
  {c:'R11',    d:'Náusea y vómito'},
  {c:'R50.9',  d:'Fiebre, no especificada'},
  {c:'R51',    d:'Cefalea'},
  {c:'R53',    d:'Malestar y fatiga'},
  {c:'S00.9',  d:'Traumatismo superficial de la cabeza, parte no especificada'},
  {c:'S60.9',  d:'Traumatismo superficial de la muñeca y de la mano, parte no especificada'},
  {c:'S93.4',  d:'Esguince y torcedura del tobillo'},
  {c:'T14.9',  d:'Traumatismo, no especificado'},
  {c:'U07.1',  d:'COVID-19, virus identificado'},
  {c:'Z00.0',  d:'Examen médico general'},
  {c:'Z00.1',  d:'Examen de rutina de salud del niño'},
  {c:'Z01.4',  d:'Examen ginecológico general (de rutina)'},
  {c:'Z23',    d:'Necesidad de inmunización contra enfermedad bacteriana única'},
  {c:'Z27.9',  d:'Necesidad de inmunización combinada contra enfermedades infecciosas, no especificada'},
  {c:'Z30.9',  d:'Anticoncepción, no especificada'},
  {c:'Z34.9',  d:'Supervisión de embarazo normal, no especificada'},
  {c:'Z35.9',  d:'Supervisión de embarazo de alto riesgo, no especificada'},
  {c:'Z39.2',  d:'Atención y examen postparto de rutina'},
  {c:'Z71.1',  d:'Persona que consulta por sí misma con preocupación no justificada de enfermedad'},
  {c:'Z76.3',  d:'Persona en buena salud que acompaña a un enfermo'},
  {c:'90471',  d:'CPT · Administración de vacuna (inyección), primera dosis'},
  {c:'99213',  d:'CPT · Consulta médica ambulatoria, evaluación de nivel intermedio'},
  {c:'81002',  d:'CPT · Examen de orina, sin microscopía'},
  {c:'85025',  d:'CPT · Hemograma completo, automatizado'},
];

function normalizarTexto(s){
  return (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function buscarCie10Cpt(query, limite = 8){
  const q = normalizarTexto(query);
  if(!q) return [];
  const porCodigo = [];
  const porDescripcion = [];
  for(const item of CIE10_CPT_DATASET){
    const codigo = normalizarTexto(item.c);
    if(codigo.startsWith(q)){
      porCodigo.push(item);
      continue;
    }
    if(normalizarTexto(item.d).includes(q)){
      porDescripcion.push(item);
    }
  }
  return [...porCodigo, ...porDescripcion].slice(0, limite);
}
