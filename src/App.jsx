import React, { useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import './App.css';

const LOCAL_POINTS_KEY = 'editor-electrico-sanber-points-v2';
const LOCAL_PROJECT_KEY = 'editor-electrico-sanber-project-v2';

const CATEGORIES = {
  AA: { label: 'Aire acondicionado', color: '#E74C3C', marker: 'AA' },
  T: { label: 'Tomacorriente', color: '#3498DB', marker: 'T' },
  L: { label: 'Luminaria / riel LED', color: '#F1C40F', marker: 'L' },
  E: { label: 'Electrodoméstico / equipo', color: '#8E44AD', marker: 'E' },
  SW: { label: 'Interruptor / escena', color: '#F39C12', marker: 'SW' },
  I: { label: 'Infraestructura / reserva', color: '#27AE60', marker: 'I' },
};

const defaultProject = {
  name: 'Casa San Bernardino',
  location: 'San Bernardino',
  description: 'Editor independiente para validar, mover y documentar puntos eléctricos, luminarias, tomas, aires acondicionados, electrodomésticos, interruptores e infraestructura sobre el plano.',
  planImageUrl: '/plano_sanber_base.png',
};

const initialPoints = [
  { point_code: 'AA1', type: 'AA', room: 'Suite principal', title: 'Split suite principal', detail: 'Equipo sugerido: 9.000 a 12.000 BTU. Ubicar evaporadora en pared alta, evitando descarga directa sobre la cama. Confirmar recorrido de cañería frigorífica, drenaje por gravedad y ubicación exterior de condensadora.', x: 51, y: 39, priority: 'Alta', circuit: 'Circuito dedicado AA suite', status: 'Pendiente' },
  { point_code: 'AA2', type: 'AA', room: 'Dormitorio 2', title: 'Split dormitorio 2', detail: 'Equipo sugerido: 9.000 BTU. Instalar en pared alta con descarga hacia el centro del ambiente, sin apuntar directamente a la cama. Confirmar salida de drenaje y ubicación de condensadora.', x: 69, y: 42, priority: 'Alta', circuit: 'Circuito dedicado AA dormitorio 2', status: 'Pendiente' },
  { point_code: 'AA3', type: 'AA', room: 'Dormitorio 1 con entrepiso', title: 'Split dormitorio con entrepiso', detail: 'Equipo sugerido: 9.000 a 12.000 BTU. Si el entrepiso queda abierto y acumula calor, prever 12.000 BTU. Validar altura de evaporadora y que no interfiera con escalera o tirantes.', x: 69, y: 55, priority: 'Alta', circuit: 'Circuito dedicado AA dormitorio entrepiso', status: 'Pendiente' },
  { point_code: 'AA4', type: 'AA', room: 'Sala/comedor', title: 'Split sala/comedor', detail: 'Equipo sugerido: 18.000 a 24.000 BTU. Ubicar en pared alta para cubrir el área integrada. Confirmar orientación solar, altura de techo, aberturas y si el ambiente queda conectado a galería.', x: 66, y: 66, priority: 'Alta', circuit: 'Circuito dedicado AA sala/comedor', status: 'Pendiente' },
  { point_code: 'AA5', type: 'AA', room: 'Quincho/cocina', title: 'Previsión AA quincho', detail: 'Dejar previsión de cañería aunque no se instale ahora. Equipo opcional: 18.000 a 24.000 BTU únicamente si el quincho queda cerrable. Considerar carga térmica de cocina, parrilla y aberturas.', x: 40, y: 47, priority: 'Media', circuit: 'Previsión dedicada AA quincho', status: 'Pendiente' },

  { point_code: 'T1', type: 'T', room: 'Suite principal', title: 'Tomas laterales de cama', detail: 'Dos tomas dobles, una por cada mesa de luz. Recomendado incluir USB o punto adicional para cargadores. Confirmar posición final de cama y cabecera antes de canalizar.', x: 50, y: 37, priority: 'Alta', circuit: 'Tomas dormitorio suite', status: 'Pendiente' },
  { point_code: 'T2', type: 'T', room: 'Suite principal', title: 'Toma TV / datos suite', detail: 'Punto para TV, repetidor WiFi o cargadores en pared libre. Definir altura según mueble o soporte de TV. Considerar canalización oculta si va TV mural.', x: 49, y: 44, priority: 'Media', circuit: 'Tomas dormitorio suite', status: 'Pendiente' },
  { point_code: 'T3', type: 'T', room: 'Dormitorio 2', title: 'Tomas laterales dormitorio 2', detail: 'Dos tomas laterales de cama. Validar lado de apertura de puerta y ubicación de placard para no dejar tomas detrás de muebles.', x: 67, y: 38, priority: 'Alta', circuit: 'Tomas dormitorio 2', status: 'Pendiente' },
  { point_code: 'T4', type: 'T', room: 'Dormitorio 2', title: 'Toma auxiliar dormitorio 2', detail: 'Toma para escritorio, TV o cargadores. Ubicar en pared libre, preferentemente cerca de posible mueble de apoyo.', x: 72, y: 36, priority: 'Media', circuit: 'Tomas dormitorio 2', status: 'Pendiente' },
  { point_code: 'T5', type: 'T', room: 'Dormitorio 1 con entrepiso', title: 'Tomas cama dormitorio entrepiso', detail: 'Dos tomas laterales de cama. Confirmar circulación hacia escalera del entrepiso y evitar ubicación detrás de estructura o baranda.', x: 67, y: 52, priority: 'Alta', circuit: 'Tomas dormitorio entrepiso', status: 'Pendiente' },
  { point_code: 'T6', type: 'T', room: 'Dormitorio 1 con entrepiso', title: 'Toma alta / entrepiso', detail: 'Toma adicional en zona alta o entrepiso para cargador, luz auxiliar o uso eventual. Validar accesibilidad y seguridad.', x: 72, y: 59, priority: 'Media', circuit: 'Tomas dormitorio entrepiso', status: 'Pendiente' },
  { point_code: 'T7', type: 'T', room: 'Baño suite', title: 'Toma protegida bacha suite', detail: 'Toma cerca de bacha para secador o afeitadora. Ubicar fuera del área de ducha y confirmar protección diferencial. Validar altura con espejo y mueble.', x: 51, y: 49, priority: 'Alta', circuit: 'Tomas húmedas protegidas', status: 'Pendiente' },
  { point_code: 'T8', type: 'T', room: 'Baño compartido', title: 'Toma protegida bacha baño compartido', detail: 'Toma cerca de bacha, fuera de zona directa de agua. Confirmar protección diferencial, altura de espejo y mueble.', x: 48, y: 56, priority: 'Alta', circuit: 'Tomas húmedas protegidas', status: 'Pendiente' },
  { point_code: 'T9', type: 'T', room: 'Baño piscina', title: 'Toma protegida baño piscina', detail: 'Toma para uso ocasional en baño piscina. Debe ser apta para ambiente húmedo y quedar fuera de zona de ducha o salpicadura directa.', x: 20, y: 18, priority: 'Alta', circuit: 'Tomas húmedas protegidas', status: 'Pendiente' },
  { point_code: 'T10', type: 'T', room: 'Sala/comedor', title: 'Punto TV / router sala', detail: 'Toma para TV, mueble multimedia y router central si se decide ubicar conectividad en sala. Recomendado prever energía + datos.', x: 62, y: 63, priority: 'Alta', circuit: 'Tomas sala/datos', status: 'Pendiente' },
  { point_code: 'T11', type: 'T', room: 'Sala/comedor', title: 'Toma auxiliar sofá', detail: 'Toma de apoyo para cargadores, lámpara auxiliar, aspiradora o decoración. Validar ubicación de sofá y mesa baja.', x: 72, y: 65, priority: 'Media', circuit: 'Tomas sala', status: 'Pendiente' },
  { point_code: 'T12', type: 'T', room: 'Comedor', title: 'Toma auxiliar comedor', detail: 'Punto de apoyo cerca del comedor para lámpara, cargadores, decoración o servicio eventual. Ubicar sin interferir con circulación.', x: 57, y: 62, priority: 'Media', circuit: 'Tomas comedor', status: 'Pendiente' },
  { point_code: 'T13', type: 'T', room: 'Quincho/cocina', title: 'Tomas sobre mesada', detail: 'Tomas sobre mesada para cafetera, licuadora, hervidor, cargadores y pequeños electrodomésticos. Recomendado agrupar en al menos dos puntos separados.', x: 44, y: 47, priority: 'Alta', circuit: 'Tomas cocina/mesada', status: 'Pendiente' },
  { point_code: 'T14', type: 'T', room: 'Quincho/barra', title: 'Tomas barra / isla', detail: 'Tomas para barra o isla. Definir antes de cerrar piso o mesada, porque después requiere romper o canalizar exteriormente.', x: 42, y: 55, priority: 'Alta', circuit: 'Tomas barra/quincho', status: 'Pendiente' },
  { point_code: 'T15', type: 'T', room: 'Galería', title: 'Toma exterior galería', detail: 'Toma exterior protegida para audio, cargadores, parrilla eléctrica liviana o usos ocasionales. Validar grado de protección e intemperie.', x: 36, y: 70, priority: 'Alta', circuit: 'Exterior protegido', status: 'Pendiente' },
  { point_code: 'T16', type: 'T', room: 'Galería', title: 'Toma salida sala / galería', detail: 'Toma exterior protegida cerca de salida hacia galería. Útil para limpieza, decoración, parlante o equipos temporales.', x: 57, y: 71, priority: 'Media', circuit: 'Exterior protegido', status: 'Pendiente' },
  { point_code: 'T17', type: 'T', room: 'Piscina/deck', title: 'Toma técnica piscina / deck', detail: 'Toma exterior protegida, alejada del borde de piscina. Validar ubicación segura, protección diferencial y distancia mínima con electricista.', x: 57, y: 28, priority: 'Alta', circuit: 'Exterior piscina protegido', status: 'Pendiente' },
  { point_code: 'T18', type: 'T', room: 'Fogón', title: 'Toma exterior fogón', detail: 'Toma protegida para parlante, cargadores o uso eventual en área de fogón. Ubicar sin exposición directa al calor.', x: 70, y: 78, priority: 'Media', circuit: 'Exterior protegido', status: 'Pendiente' },

  { point_code: 'L1', type: 'L', room: 'Suite principal', title: 'Riel LED suite', detail: 'Riel o tira modular con cabezales LED orientables, suspendido o fijado a tirante. Separar luz general de posible luz de lectura si se desea mayor confort.', x: 52, y: 40, priority: 'Alta', circuit: 'Iluminación dormitorio suite', status: 'Pendiente' },
  { point_code: 'L2', type: 'L', room: 'Dormitorio 2', title: 'Riel LED dormitorio 2', detail: 'Riel corto o cabezal lineal sobre tirante principal. Usar luz cálida y orientar los cabezales para no encandilar desde la cama.', x: 68, y: 41, priority: 'Alta', circuit: 'Iluminación dormitorio 2', status: 'Pendiente' },
  { point_code: 'L3', type: 'L', room: 'Dormitorio 1 con entrepiso', title: 'Riel LED dormitorio con entrepiso', detail: 'Riel siguiendo el tirante principal. Prever segunda escena o punto adicional para entrepiso si se usa como área funcional.', x: 68, y: 54, priority: 'Alta', circuit: 'Iluminación dormitorio entrepiso', status: 'Pendiente' },
  { point_code: 'L4', type: 'L', room: 'Baño suite', title: 'Luz baño suite', detail: 'Luz general + luz de espejo/bacha. Ideal separar luz general y espejo para mejor uso nocturno y estética.', x: 52, y: 50, priority: 'Alta', circuit: 'Iluminación baño suite', status: 'Pendiente' },
  { point_code: 'L5', type: 'L', room: 'Baño compartido', title: 'Luz baño compartido', detail: 'Luz general + luz de espejo/bacha. Validar ubicación para evitar sombras sobre el rostro.', x: 48, y: 58, priority: 'Alta', circuit: 'Iluminación baño compartido', status: 'Pendiente' },
  { point_code: 'L6', type: 'L', room: 'Baño piscina', title: 'Luz baño piscina', detail: 'Luz general apta para área húmeda + punto sobre espejo/bacha. Validar protección según humedad.', x: 20, y: 17, priority: 'Alta', circuit: 'Iluminación baño piscina', status: 'Pendiente' },
  { point_code: 'L7', type: 'L', room: 'Quincho/cocina', title: 'Riel LED mesada quincho', detail: 'Riel LED sobre mesada y zona de preparación, colgado de tirantes de madera o metal. Separar de luz ambiental para trabajar mejor.', x: 42, y: 47, priority: 'Alta', circuit: 'Iluminación quincho/mesada', status: 'Pendiente' },
  { point_code: 'L8', type: 'L', room: 'Quincho/barra', title: 'Riel LED barra', detail: 'Riel lineal con cabezales orientables hacia barra. Recomendado luz cálida y circuito independiente para crear escena social.', x: 39, y: 56, priority: 'Alta', circuit: 'Iluminación barra/quincho', status: 'Pendiente' },
  { point_code: 'L9', type: 'L', room: 'Comedor', title: 'Luz comedor', detail: 'Riel o luminaria lineal centrada sobre mesa comedor. Confirmar posición final de mesa antes de cerrar el punto.', x: 58, y: 63, priority: 'Alta', circuit: 'Iluminación comedor', status: 'Pendiente' },
  { point_code: 'L10', type: 'L', room: 'Sala', title: 'Riel LED sala', detail: 'Cabezales orientables hacia sofá, pared TV y circulación. Sugerido separar ambiente sala de comedor.', x: 66, y: 64, priority: 'Alta', circuit: 'Iluminación sala', status: 'Pendiente' },
  { point_code: 'L11', type: 'L', room: 'Galería', title: 'Riel LED galería', detail: 'Riel/tira LED suspendido bajo tirantes metálicos o madera. Debe admitir ambiente exterior cubierto. Separar de luces de jardín/piscina.', x: 52, y: 73, priority: 'Alta', circuit: 'Iluminación galería', status: 'Pendiente' },
  { point_code: 'L12', type: 'L', room: 'Piscina/deck', title: 'Luz piscina / deck', detail: 'Luz perimetral o ambiental para deck/piscina. Validar protección exterior, ubicación segura y circuito independiente.', x: 58, y: 27, priority: 'Alta', circuit: 'Iluminación exterior piscina', status: 'Pendiente' },
  { point_code: 'L13', type: 'L', room: 'Fogón', title: 'Luz fogón', detail: 'Luz cálida ambiental, evitando encandilar. Ubicar fuera de exposición directa al calor y permitir encendido independiente.', x: 71, y: 76, priority: 'Media', circuit: 'Iluminación exterior fogón', status: 'Pendiente' },
  { point_code: 'L14', type: 'L', room: 'Muralla', title: 'Bidireccionales muralla', detail: 'Luces bidireccionales en muralla lateral/posterior. Definir separación real in situ según ritmo visual y alcance de iluminación.', x: 77, y: 16, priority: 'Alta', circuit: 'Iluminación perimetral', status: 'Pendiente' },
  { point_code: 'L15', type: 'L', room: 'Acceso vehicular', title: 'Luz acceso vehicular', detail: 'Luminaria de acceso y seguridad para garaje/portones. Separar de circuito de motores y prever encendido cómodo.', x: 28, y: 78, priority: 'Media', circuit: 'Iluminación acceso', status: 'Pendiente' },
  { point_code: 'L16', type: 'L', room: 'Acceso peatonal/jardín', title: 'Luz acceso peatonal / jardín', detail: 'Balizas o bidireccionales para acceso peatonal y jardín frontal. Dejar cañería de reserva si paisajismo se define después.', x: 56, y: 89, priority: 'Media', circuit: 'Iluminación jardín/acceso', status: 'Pendiente' },

  { point_code: 'E1', type: 'E', room: 'Quincho/cocina', title: 'Heladera', detail: 'Toma dedicada o circuito exclusivo recomendado. Ubicar con ventilación suficiente y sin quedar detrás de muebles fijos inaccesibles.', x: 46, y: 46, priority: 'Alta', circuit: 'Dedicado heladera', status: 'Pendiente' },
  { point_code: 'E2', type: 'E', room: 'Quincho/cocina', title: 'Horno eléctrico', detail: 'Circuito dedicado. Confirmar potencia real del equipo antes de definir térmica y cableado.', x: 46, y: 51, priority: 'Alta', circuit: 'Dedicado horno', status: 'Pendiente' },
  { point_code: 'E3', type: 'E', room: 'Quincho/cocina', title: 'Microondas', detail: 'Toma reforzada o dedicada según potencia. Definir ubicación en mueble alto, columna o mesada.', x: 46, y: 54, priority: 'Alta', circuit: 'Microondas / toma reforzada', status: 'Pendiente' },
  { point_code: 'E4', type: 'E', room: 'Quincho/cocina', title: 'Anafe / campana', detail: 'Confirmar si el anafe será eléctrico, a gas o mixto. Si es eléctrico, circuito dedicado. La campana requiere punto alto y posible ducto.', x: 46, y: 58, priority: 'Alta', circuit: 'Dedicado anafe/campana', status: 'Pendiente' },
  { point_code: 'E5', type: 'E', room: 'Lavadero', title: 'Lavarropas', detail: 'Toma dedicada cerca de agua y desagüe. Ubicar a una altura accesible y protegida de salpicaduras.', x: 77, y: 33, priority: 'Alta', circuit: 'Dedicado lavarropas', status: 'Pendiente' },
  { point_code: 'E6', type: 'E', room: 'Lavadero', title: 'Secadora / previsión', detail: 'Prever toma auxiliar o dedicada para secadora. Si no se instala ahora, dejar cañería y espacio técnico.', x: 79, y: 37, priority: 'Media', circuit: 'Previsión secadora', status: 'Pendiente' },
  { point_code: 'E7', type: 'E', room: 'Piscina', title: 'Motor/filtro piscina', detail: 'Circuito dedicado con tablero, protección y puesta a tierra. Validar ubicación de fosa técnica, acceso de mantenimiento y distancia segura.', x: 59, y: 24, priority: 'Alta', circuit: 'Dedicado piscina', status: 'Pendiente' },
  { point_code: 'E8', type: 'E', room: 'Acceso vehicular', title: 'Motores portones', detail: 'Alimentación para dos motores de portón vehicular. Prever botonera, control, fotocélula y caja de mantenimiento.', x: 26, y: 86, priority: 'Alta', circuit: 'Dedicado portones', status: 'Pendiente' },
  { point_code: 'E9', type: 'E', room: 'Acceso peatonal', title: 'Portero / cerradura eléctrica', detail: 'Punto para portero eléctrico, videoportero o cerradura. Prever energía y datos/cableado de señal según equipo elegido.', x: 61, y: 95, priority: 'Media', circuit: 'Acceso peatonal', status: 'Pendiente' },

  { point_code: 'S1', type: 'SW', room: 'Sala/galería', title: 'Llaves escenas sala', detail: 'Separar escenas de sala, comedor y galería. Ubicar interruptores en acceso cómodo desde sala y salida exterior.', x: 62, y: 70, priority: 'Alta', circuit: 'Control escenas sala/galería', status: 'Pendiente' },
  { point_code: 'S2', type: 'SW', room: 'Quincho', title: 'Llaves escenas quincho', detail: 'Separar mesada, barra, luz general y exterior. Ubicar llaves cerca de ingreso al quincho.', x: 40, y: 64, priority: 'Alta', circuit: 'Control escenas quincho', status: 'Pendiente' },
  { point_code: 'S3', type: 'SW', room: 'Dormitorios/baños', title: 'Llaves accesos interiores', detail: 'Ubicar llaves en accesos y prever conmutadas donde convenga. Validar sentido de apertura de puertas antes de canalizar.', x: 49, y: 50, priority: 'Media', circuit: 'Control interior', status: 'Pendiente' },

  { point_code: 'I1', type: 'I', room: 'Frente', title: 'Pilasta ANDE / tablero principal', detail: 'Ubicación de pilastra y tablero principal. Confirmar requisitos de ANDE, puesta a tierra, protecciones principales y espacio para futuras ampliaciones.', x: 18, y: 96, priority: 'Alta', circuit: 'Principal', status: 'Pendiente' },
  { point_code: 'I2', type: 'I', room: 'Perímetro', title: 'Reserva cámaras / alarma', detail: 'Dejar cañerías para cámaras, alarma o sensores en perímetro posterior y accesos. No instalar equipos necesariamente ahora; dejar previsión.', x: 82, y: 9, priority: 'Media', circuit: 'Reserva seguridad', status: 'Pendiente' },
  { point_code: 'I3', type: 'I', room: 'Sala', title: 'Router / WiFi central', detail: 'Punto de energía y datos para router o AP central. Ubicar elevado o en mueble técnico para buena cobertura.', x: 62, y: 65, priority: 'Media', circuit: 'Datos / WiFi', status: 'Pendiente' },
  { point_code: 'I4', type: 'I', room: 'Exterior técnico', title: 'Reserva generador / bomba', detail: 'Previsión para generador, tanque y motobomba. Coordinar base, fosa, alimentación dedicada y transferencia si se instalará generador.', x: 81, y: 84, priority: 'Alta', circuit: 'Reserva técnica exterior', status: 'Pendiente' },
].map((p, index) => ({ ...p, id: `local-${index + 1}` }));

function saveLocal(project, points) {
  localStorage.setItem(LOCAL_PROJECT_KEY, JSON.stringify(project));
  localStorage.setItem(LOCAL_POINTS_KEY, JSON.stringify(points));
}

function loadLocal() {
  const projectRaw = localStorage.getItem(LOCAL_PROJECT_KEY);
  const pointsRaw = localStorage.getItem(LOCAL_POINTS_KEY);
  return {
    project: projectRaw ? JSON.parse(projectRaw) : defaultProject,
    points: pointsRaw ? JSON.parse(pointsRaw) : initialPoints,
  };
}

function mapPointFromDb(row) {
  return {
    id: row.id,
    project_id: row.project_id,
    point_code: row.point_code,
    type: row.type,
    room: row.room || '',
    title: row.title || '',
    detail: row.detail || '',
    x: Number(row.x || 50),
    y: Number(row.y || 50),
    priority: row.priority || 'Media',
    circuit: row.circuit || '',
    status: row.status || 'Pendiente',
  };
}

function mapPointToDb(point, projectId) {
  return {
    project_id: projectId,
    point_code: point.point_code,
    type: point.type,
    room: point.room,
    title: point.title,
    detail: point.detail,
    x: Number(point.x || 50),
    y: Number(point.y || 50),
    priority: point.priority,
    circuit: point.circuit,
    status: point.status,
  };
}

function nextPointCode(points, type) {
  const nums = points
    .filter((p) => p.type === type || p.point_code?.startsWith(type))
    .map((p) => String(p.point_code || '').replace(type, ''))
    .map((value) => parseInt(value, 10))
    .filter((n) => !Number.isNaN(n));
  return `${type}${nums.length ? Math.max(...nums) + 1 : 1}`;
}

function downloadText(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const s = String(value ?? '');
  return `"${s.replaceAll('"', '""')}"`;
}

export default function App() {
  const [project, setProject] = useState(defaultProject);
  const [points, setPoints] = useState(initialPoints);
  const [selectedId, setSelectedId] = useState(initialPoints[0]?.id || '');
  const [filter, setFilter] = useState('TODOS');
  const [dragId, setDragId] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [syncState, setSyncState] = useState('local');
  const [message, setMessage] = useState('');
  const planRef = useRef(null);

  const visiblePoints = useMemo(() => points.filter((p) => filter === 'TODOS' || p.type === filter), [points, filter]);
  const selected = points.find((p) => p.id === selectedId) || points[0];
  const validated = points.filter((p) => p.status === 'OK').length;
  const pending = points.filter((p) => p.status === 'Pendiente').length;
  const adjustment = points.filter((p) => p.status === 'Ajustar').length;

  useEffect(() => {
    const boot = async () => {
      if (!isSupabaseConfigured) {
        const local = loadLocal();
        setProject(local.project);
        setPoints(local.points);
        setSelectedId(local.points[0]?.id || '');
        setSyncState('local');
        return;
      }
      setSyncState('loading');
      const { data: existingProject, error: projectError } = await supabase
        .from('electrical_projects')
        .select('*')
        .eq('name', defaultProject.name)
        .maybeSingle();

      if (projectError) {
        setMessage(`Error Supabase: ${projectError.message}`);
        setSyncState('error');
        return;
      }

      let activeProject = existingProject;
      if (!activeProject) {
        const { data: insertedProject, error: insertProjectError } = await supabase
          .from('electrical_projects')
          .insert({ name: defaultProject.name, location: defaultProject.location, description: defaultProject.description, plan_image_url: defaultProject.planImageUrl })
          .select('*')
          .single();
        if (insertProjectError) {
          setMessage(`Error creando proyecto: ${insertProjectError.message}`);
          setSyncState('error');
          return;
        }
        activeProject = insertedProject;
        await supabase.from('electrical_points').insert(initialPoints.map((p) => mapPointToDb(p, insertedProject.id)));
      }

      const { data: dbPoints, error: pointsError } = await supabase
        .from('electrical_points')
        .select('*')
        .eq('project_id', activeProject.id)
        .order('point_code');

      if (pointsError) {
        setMessage(`Error cargando puntos: ${pointsError.message}`);
        setSyncState('error');
        return;
      }

      const mapped = (dbPoints || []).map(mapPointFromDb);
      setProject({
        id: activeProject.id,
        name: activeProject.name,
        location: activeProject.location,
        description: activeProject.description,
        planImageUrl: activeProject.plan_image_url || '/plano_sanber_base.png',
      });
      setPoints(mapped.length ? mapped : initialPoints);
      setSelectedId((mapped[0] || initialPoints[0])?.id || '');
      setSyncState('supabase');
    };
    boot();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) saveLocal(project, points);
  }, [project, points]);

  const persistPoint = async (point) => {
    if (!isSupabaseConfigured || syncState !== 'supabase') return;
    const dbPayload = mapPointToDb(point, project.id);
    const { error } = await supabase.from('electrical_points').update(dbPayload).eq('id', point.id);
    if (error) setMessage(`No se pudo guardar: ${error.message}`);
  };

  const updatePoint = (id, patch, persist = false) => {
    setPoints((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      if (persist) {
        const updated = next.find((p) => p.id === id);
        if (updated) persistPoint(updated);
      }
      return next;
    });
  };

  const onPointerMove = (event) => {
    if (!dragId || !planRef.current) return;
    const rect = planRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    updatePoint(dragId, { x: Math.max(1, Math.min(99, Number(x.toFixed(2)))), y: Math.max(1, Math.min(99, Number(y.toFixed(2)))) });
  };

  const onPointerUp = async () => {
    if (dragId) {
      const point = points.find((p) => p.id === dragId);
      if (point) await persistPoint(point);
    }
    setDragId(null);
  };

  const addPoint = async (type = 'T') => {
    const point = {
      id: `local-${crypto.randomUUID()}`,
      point_code: nextPointCode(points, type),
      type,
      room: 'Nuevo ambiente',
      title: 'Nuevo punto',
      detail: 'Editar descripción, ubicación recomendada, altura, circuito y observación de visita.',
      x: 50,
      y: 50,
      priority: 'Media',
      circuit: 'A definir',
      status: 'Pendiente',
    };

    if (isSupabaseConfigured && syncState === 'supabase') {
      const { data, error } = await supabase.from('electrical_points').insert(mapPointToDb(point, project.id)).select('*').single();
      if (error) {
        setMessage(`No se pudo agregar: ${error.message}`);
        return;
      }
      const mapped = mapPointFromDb(data);
      setPoints((prev) => [...prev, mapped]);
      setSelectedId(mapped.id);
    } else {
      setPoints((prev) => [...prev, point]);
      setSelectedId(point.id);
    }
  };

  const duplicatePoint = async () => {
    if (!selected) return;
    const point = {
      ...selected,
      id: `local-${crypto.randomUUID()}`,
      point_code: nextPointCode(points, selected.type),
      title: `${selected.title} copia`,
      x: Math.min(98, selected.x + 2),
      y: Math.min(98, selected.y + 2),
      status: 'Pendiente',
    };
    if (isSupabaseConfigured && syncState === 'supabase') {
      const { data, error } = await supabase.from('electrical_points').insert(mapPointToDb(point, project.id)).select('*').single();
      if (error) {
        setMessage(`No se pudo duplicar: ${error.message}`);
        return;
      }
      const mapped = mapPointFromDb(data);
      setPoints((prev) => [...prev, mapped]);
      setSelectedId(mapped.id);
    } else {
      setPoints((prev) => [...prev, point]);
      setSelectedId(point.id);
    }
  };

  const removePoint = async () => {
    if (!selected) return;
    if (isSupabaseConfigured && syncState === 'supabase' && !String(selected.id).startsWith('local-')) {
      const { error } = await supabase.from('electrical_points').delete().eq('id', selected.id);
      if (error) {
        setMessage(`No se pudo eliminar: ${error.message}`);
        return;
      }
    }
    const next = points.filter((p) => p.id !== selected.id);
    setPoints(next);
    setSelectedId(next[0]?.id || '');
  };

  const resetBase = async () => {
    if (isSupabaseConfigured && syncState === 'supabase') {
      await supabase.from('electrical_points').delete().eq('project_id', project.id);
      const { data, error } = await supabase.from('electrical_points').insert(initialPoints.map((p) => mapPointToDb(p, project.id))).select('*');
      if (error) {
        setMessage(`No se pudo restaurar: ${error.message}`);
        return;
      }
      const mapped = data.map(mapPointFromDb);
      setPoints(mapped);
      setSelectedId(mapped[0]?.id || '');
    } else {
      setPoints(initialPoints);
      setSelectedId(initialPoints[0]?.id || '');
    }
  };

  const exportJSON = () => downloadText('puntos_sanber_editable.json', JSON.stringify({ project, points }, null, 2), 'application/json;charset=utf-8');

  const importJson = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const importedPoints = Array.isArray(parsed) ? parsed : parsed.points;
        const importedProject = parsed.project || project;
        if (!Array.isArray(importedPoints)) throw new Error('Formato inválido');
        const normalized = importedPoints.map((p, idx) => ({ ...p, id: p.id || `local-import-${idx + 1}` }));
        setProject(importedProject);
        setPoints(normalized);
        setSelectedId(normalized[0]?.id || '');
        setMessage('JSON importado correctamente.');
      } catch {
        alert('No se pudo importar el JSON. Verificá el formato.');
      }
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    const header = ['Codigo', 'Tipo', 'Categoria', 'Ambiente', 'Titulo', 'Detalle', 'X %', 'Y %', 'Prioridad', 'Circuito', 'Estado'];
    const rows = points.map((p) => [p.point_code, p.type, CATEGORIES[p.type]?.label, p.room, p.title, p.detail, p.x, p.y, p.priority, p.circuit, p.status]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    downloadText('puntos_sanber_excel.csv', csv, 'text/csv;charset=utf-8');
  };

  const exportSVG = () => {
    const markers = points.map((p) => {
      const c = CATEGORIES[p.type] || CATEGORIES.T;
      const title = String(p.title || '').replace(/[<>&]/g, '');
      return `<g><circle cx="${p.x * 10}" cy="${p.y * 10}" r="13" fill="${c.color}" stroke="white" stroke-width="4"/><text x="${p.x * 10}" y="${p.y * 10 + 4}" text-anchor="middle" font-size="10" font-family="Arial" font-weight="bold" fill="${p.type === 'L' ? 'black' : 'white'}">${p.point_code}</text><text x="${p.x * 10 + 18}" y="${p.y * 10 + 4}" font-size="10" font-family="Arial" fill="black">${title}</text></g>`;
    }).join('\n');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000"><rect width="1000" height="1000" fill="#f8fafc"/><text x="24" y="34" font-size="22" font-family="Arial" font-weight="bold" fill="#17365D">Plano de puntos eléctricos San Bernardino</text><rect x="60" y="70" width="880" height="880" fill="white" stroke="#94a3b8" stroke-width="2"/>${markers}</svg>`;
    downloadText('plano_puntos_sanber.svg', svg, 'image/svg+xml;charset=utf-8');
  };

  const copyChecklist = async () => {
    const text = points.map((p) => `${p.point_code} | ${CATEGORIES[p.type]?.label} | ${p.room} | ${p.title} | ${p.detail} | x=${p.x}% y=${p.y}% | ${p.priority} | ${p.circuit} | ${p.status}`).join('\n');
    await navigator.clipboard.writeText(text);
    setMessage('Checklist copiado al portapapeles.');
  };

  const loadBaseImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProject((prev) => ({ ...prev, planImageUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <span className="eyebrow">Editor eléctrico independiente</span>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
        <div className="header-actions">
          <button className="primary-action" onClick={() => addPoint('T')}>Agregar toma</button>
          <button className="secondary-action" onClick={() => addPoint('L')}>Agregar luz</button>
          <button className="secondary-action" onClick={() => addPoint('AA')}>Agregar AA</button>
          <button className="secondary-action" onClick={duplicatePoint}>Duplicar</button>
          <button className="secondary-action" onClick={resetBase}>Restaurar base</button>
        </div>
      </header>

      <section className="status-bar">
        <StatusPill label="Modo" value={syncState === 'supabase' ? 'Supabase conectado' : syncState === 'loading' ? 'Cargando Supabase' : syncState === 'error' ? 'Error Supabase' : 'LocalStorage'} tone={syncState === 'supabase' ? 'green' : syncState === 'error' ? 'red' : 'amber'} />
        <StatusPill label="Puntos" value={points.length} tone="blue" />
        <StatusPill label="OK" value={validated} tone="green" />
        <StatusPill label="Pendientes" value={pending} tone="amber" />
        <StatusPill label="Ajustar" value={adjustment} tone="red" />
      </section>

      {message && <div className="message"><span>{message}</span><button onClick={() => setMessage('')}>Cerrar</button></div>}

      <main className="editor-layout">
        <section className="card editor-main no-padding">
          <div className="editor-toolbar">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="TODOS">Todos los puntos</option>
              {Object.entries(CATEGORIES).map(([key, cat]) => <option key={key} value={key}>{cat.label}</option>)}
            </select>
            <label className="file-button">Cargar plano<input type="file" accept="image/*" onChange={(e) => loadBaseImage(e.target.files?.[0])} /></label>
            <label className="file-button">Importar JSON<input type="file" accept="application/json" onChange={(e) => importJson(e.target.files?.[0])} /></label>
            <label className="toggle-label"><input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} /> Mostrar etiquetas</label>
            <label className="zoom-control">Zoom plano <input type="range" min="80" max="130" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /><strong>{zoom}%</strong></label>
            <button onClick={exportJSON}>Exportar JSON</button>
            <button onClick={exportCSV}>Exportar CSV</button>
            <button onClick={exportSVG}>Exportar SVG</button>
            <button onClick={() => window.print()}>PDF / imprimir</button>
          </div>

          <div className="plan-wrapper">
            <div className="plan-scroll">
              <div ref={planRef} className="plan-area" style={{ width: `${zoom}%` }} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
                {project.planImageUrl ? <img className="plan-image" src={project.planImageUrl} alt="Plano base" /> : <PlanFallback />}
                {visiblePoints.map((p) => {
                  const cat = CATEGORIES[p.type] || CATEGORIES.T;
                  const selectedClass = p.id === selectedId ? ' selected' : '';
                  return (
                    <button key={p.id} className={`point-marker${selectedClass}`} style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: cat.color, color: p.type === 'L' ? '#111827' : '#fff' }} title={`${p.point_code} - ${p.title}`} onPointerDown={(e) => { e.preventDefault(); setSelectedId(p.id); setDragId(p.id); }}>
                      <span>{p.point_code}</span>
                      {showLabels && <em>{p.title}</em>}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="hint">El plano ahora usa proporción vertical real y admite zoom. Arrastrá los círculos para ajustar su posición.</p>
          </div>
        </section>

        <aside className="editor-side">
          <section className="card panel-card">
            <div className="panel-title-row">
              <h2>Editar punto</h2>
              <button className="danger-action" onClick={removePoint}>Eliminar</button>
            </div>
            {selected && (
              <div className="form-grid">
                <Field label="Código"><input value={selected.point_code} onChange={(e) => updatePoint(selected.id, { point_code: e.target.value }, true)} /></Field>
                <Field label="Tipo"><select value={selected.type} onChange={(e) => updatePoint(selected.id, { type: e.target.value }, true)}>{Object.entries(CATEGORIES).map(([key, cat]) => <option key={key} value={key}>{cat.label}</option>)}</select></Field>
                <Field label="Ambiente"><input value={selected.room} onChange={(e) => updatePoint(selected.id, { room: e.target.value }, true)} /></Field>
                <Field label="Título"><input value={selected.title} onChange={(e) => updatePoint(selected.id, { title: e.target.value }, true)} /></Field>
                <Field label="X %"><input type="number" value={selected.x} onChange={(e) => updatePoint(selected.id, { x: Number(e.target.value) }, true)} /></Field>
                <Field label="Y %"><input type="number" value={selected.y} onChange={(e) => updatePoint(selected.id, { y: Number(e.target.value) }, true)} /></Field>
                <Field label="Prioridad"><select value={selected.priority} onChange={(e) => updatePoint(selected.id, { priority: e.target.value }, true)}><option>Alta</option><option>Media</option><option>Baja</option></select></Field>
                <Field label="Estado"><select value={selected.status} onChange={(e) => updatePoint(selected.id, { status: e.target.value }, true)}><option>Pendiente</option><option>OK</option><option>Ajustar</option><option>No aplica</option></select></Field>
                <Field label="Circuito"><input value={selected.circuit} onChange={(e) => updatePoint(selected.id, { circuit: e.target.value }, true)} /></Field>
                <div className="full-field"><Field label="Descripción editable / observación de visita"><textarea value={selected.detail} onChange={(e) => updatePoint(selected.id, { detail: e.target.value }, true)} /></Field></div>
              </div>
            )}
          </section>

          <section className="card panel-card">
            <h2>Resumen por categoría</h2>
            <div className="summary-grid">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <div className="summary-item" key={key}>
                  <span style={{ backgroundColor: cat.color }} />
                  <p>{cat.label}</p>
                  <strong>{points.filter((p) => p.type === key).length}</strong>
                </div>
              ))}
            </div>
            <button className="primary-action full-width" onClick={copyChecklist}>Copiar checklist completo</button>
          </section>

          <section className="card panel-card list-card">
            <h2>Lista de puntos</h2>
            <div className="point-list">
              {visiblePoints.map((p) => (
                <button key={p.id} onClick={() => setSelectedId(p.id)} className={p.id === selectedId ? 'active' : ''}>
                  <strong><span style={{ backgroundColor: CATEGORIES[p.type]?.color }}>{p.point_code}</span>{p.title}</strong>
                  <small>{p.room} · {p.priority} · {p.status}</small>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function StatusPill({ label, value, tone }) {
  return <div className={`status-pill ${tone || 'blue'}`}><span>{label}</span><strong>{value}</strong></div>;
}

function PlanFallback() {
  return (
    <svg className="plan-fallback" viewBox="0 0 100 140" preserveAspectRatio="none">
      <rect x="8" y="8" width="84" height="124" fill="rgba(255,255,255,.85)" stroke="#111827" strokeWidth=".5" />
      <rect x="48" y="44" width="20" height="20" fill="white" stroke="#111" strokeWidth=".7" />
      <text x="52" y="54" fontSize="2.2" fill="#334155">Suite</text>
      <rect x="68" y="44" width="18" height="18" fill="white" stroke="#111" strokeWidth=".7" />
      <text x="70" y="54" fontSize="2" fill="#334155">Dorm. 2</text>
      <rect x="68" y="62" width="18" height="18" fill="white" stroke="#111" strokeWidth=".7" />
      <text x="69" y="72" fontSize="1.7" fill="#334155">Entrepiso</text>
      <rect x="48" y="66" width="20" height="10" fill="white" stroke="#111" strokeWidth=".7" />
      <text x="52" y="72" fontSize="1.8" fill="#334155">Baños</text>
      <rect x="48" y="76" width="38" height="24" fill="white" stroke="#111" strokeWidth=".7" />
      <text x="58" y="90" fontSize="2.1" fill="#334155">Sala/comedor</text>
      <rect x="30" y="44" width="18" height="42" fill="white" stroke="#111" strokeWidth=".7" />
      <text x="34" y="66" fontSize="2.1" fill="#334155">Quincho</text>
      <rect x="20" y="16" width="22" height="28" fill="white" stroke="#111" strokeWidth=".5" />
      <text x="26" y="31" fontSize="2" fill="#334155">Piscina</text>
      <circle cx="72" cy="108" r="6" fill="white" stroke="#111" strokeWidth=".4" />
      <text x="69" y="118" fontSize="1.9" fill="#334155">Fogón</text>
    </svg>
  );
}
