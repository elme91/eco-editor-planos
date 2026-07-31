import React, { useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import './App.css';

const LOCAL_POINTS_KEY = 'editor-electrico-sanber-points-v3';
const LOCAL_PROJECT_KEY = 'editor-electrico-sanber-project-v3';

const CATEGORIES = {
  AA: { label: 'Aire acondicionado', color: '#E74C3C' },
  T: { label: 'Tomacorriente', color: '#3498DB' },
  L: { label: 'Luminaria / riel LED', color: '#F1C40F' },
  E: { label: 'Electrodoméstico / equipo', color: '#8E44AD' },
  SW: { label: 'Interruptor / escena', color: '#F39C12' },
  I: { label: 'Infraestructura / reserva', color: '#27AE60' },
};

const defaultProject = {
  name: 'Casa San Bernardino',
  location: 'San Bernardino',
  description: 'Editor independiente para ubicar puntos eléctricos, luminarias, tomas, aires acondicionados, electrodomésticos e infraestructura sobre el plano.',
  planImageUrl: '/plano_sanber_base.png',
};

const seed = [
  ['AA1','AA','Suite principal','Split suite principal','9.000 a 12.000 BTU. Evaporadora alta, sin descarga directa sobre cama. Validar drenaje y condensadora.',53,34,'Alta','Circuito dedicado AA suite'],
  ['AA2','AA','Dormitorio 2','Split dormitorio 2','9.000 BTU. Evaporadora alta con descarga al centro del ambiente.',69,35,'Alta','Circuito dedicado AA dormitorio 2'],
  ['AA3','AA','Dormitorio con entrepiso','Split dormitorio entrepiso','9.000 a 12.000 BTU. Prever 12.000 BTU si queda abierto el entrepiso.',70,45,'Alta','Circuito dedicado AA entrepiso'],
  ['AA4','AA','Sala/comedor','Split sala/comedor','18.000 a 24.000 BTU. Cubrir área integrada sin descarga directa a sofá.',61,57,'Alta','Circuito dedicado AA sala'],
  ['AA5','AA','Quincho/cocina','Previsión AA quincho','Opcional 18.000 a 24.000 BTU si el quincho se cierra. Dejar cañería prevista.',43,48,'Media','Previsión AA quincho'],

  ['T1','T','Suite principal','Tomas cama suite','Dos tomas dobles laterales de cama. Ideal USB en un lado.',50,34,'Alta','Tomas dormitorio suite'],
  ['T2','T','Suite principal','Toma TV/datos suite','Toma para TV, cargadores o repetidor WiFi en pared libre.',51,38,'Media','Tomas dormitorio suite'],
  ['T3','T','Dormitorio 2','Tomas cama dormitorio 2','Dos tomas laterales de cama, evitando placard o puerta.',67,34,'Alta','Tomas dormitorio 2'],
  ['T4','T','Dormitorio 2','Toma auxiliar dormitorio 2','Toma para escritorio, TV o cargadores.',75,33,'Media','Tomas dormitorio 2'],
  ['T5','T','Dormitorio con entrepiso','Tomas cama entrepiso','Dos tomas laterales de cama inferior.',68,47,'Alta','Tomas dorm. entrepiso'],
  ['T6','T','Dormitorio con entrepiso','Toma zona alta','Toma adicional para entrepiso, luz auxiliar o cargador.',74,48,'Media','Tomas dorm. entrepiso'],
  ['T7','T','Baño suite','Toma bacha suite','Toma protegida cerca de bacha, fuera de ducha.',51,42,'Alta','Tomas húmedas protegidas'],
  ['T8','T','Baño compartido','Toma bacha baño compartido','Toma protegida cerca de bacha, fuera de zona húmeda directa.',48,48,'Alta','Tomas húmedas protegidas'],
  ['T9','T','Baño piscina','Toma baño piscina','Toma apta para ambiente húmedo, fuera de salpicadura directa.',24,21,'Alta','Tomas húmedas protegidas'],
  ['T10','T','Sala/comedor','Toma TV/router sala','Punto TV, router central o mueble multimedia. Prever energía y datos.',62,58,'Alta','Tomas sala/datos'],
  ['T11','T','Sala/comedor','Toma auxiliar sofá','Toma de apoyo para lámpara, cargadores o limpieza.',70,60,'Media','Tomas sala'],
  ['T12','T','Comedor','Toma auxiliar comedor','Punto de apoyo para comedor, decoración o cargadores.',57,60,'Media','Tomas comedor'],
  ['T13','T','Quincho/cocina','Tomas sobre mesada','Tomas para cafetera, licuadora y pequeños electrodomésticos.',42,45,'Alta','Tomas mesada'],
  ['T14','T','Quincho/barra','Tomas barra/isla','Tomas en barra o isla. Definir antes de cerrar mesada/piso.',40,52,'Alta','Tomas barra'],
  ['T15','T','Galería','Toma exterior galería','Toma exterior protegida para audio, cargadores o uso eventual.',42,66,'Alta','Exterior protegido'],
  ['T16','T','Galería','Toma salida sala/galería','Toma exterior de apoyo cerca de salida a galería.',55,68,'Media','Exterior protegido'],
  ['T17','T','Piscina/deck','Toma técnica piscina','Toma exterior protegida, alejada del borde de piscina.',53,22,'Alta','Exterior piscina protegido'],
  ['T18','T','Fogón','Toma exterior fogón','Toma protegida para parlante, cargadores o uso eventual.',72,74,'Media','Exterior protegido'],

  ['L1','L','Suite principal','Riel LED suite','Riel con 3 a 4 cabezales orientables. Luz cálida y sin encandilar cama.',53,35,'Alta','Iluminación suite'],
  ['L2','L','Dormitorio 2','Riel LED dormitorio 2','Riel corto o lineal con 2 a 3 cabezales.',70,36,'Alta','Iluminación dorm. 2'],
  ['L3','L','Dormitorio con entrepiso','Riel LED dormitorio entrepiso','Riel principal, prever punto o cabezal hacia entrepiso.',70,47,'Alta','Iluminación entrepiso'],
  ['L4','L','Baño suite','Luz baño suite','Luz general más luz de espejo/bacha.',52,42,'Alta','Iluminación baño suite'],
  ['L5','L','Baño compartido','Luz baño compartido','Luz general más luz de espejo/bacha.',48,49,'Alta','Iluminación baño compartido'],
  ['L6','L','Baño piscina','Luz baño piscina','Luz apta para área húmeda.',24,20,'Alta','Iluminación baño piscina'],
  ['L7','L','Quincho/cocina','Riel LED mesada','Riel LED sobre mesada, colgado o fijado a tirantes.',42,46,'Alta','Iluminación mesada'],
  ['L8','L','Quincho/barra','Riel LED barra','Riel lineal con cabezales hacia barra.',40,52,'Alta','Iluminación barra'],
  ['L9','L','Comedor','Luz comedor','Luminaria o riel centrado sobre mesa.',56,57,'Alta','Iluminación comedor'],
  ['L10','L','Sala','Riel LED sala','Cabezales hacia sofá, circulación y pared TV.',65,57,'Alta','Iluminación sala'],
  ['L11','L','Galería','Riel LED galería','Riel o tira bajo tirantes de galería.',53,67,'Alta','Iluminación galería'],
  ['L12','L','Piscina/deck','Luz piscina/deck','Luz ambiental exterior con protección adecuada.',54,21,'Alta','Iluminación piscina'],
  ['L13','L','Fogón','Luz fogón','Luz cálida ambiental evitando zona de calor directo.',73,73,'Media','Iluminación fogón'],
  ['L14','L','Muralla','Bidireccionales muralla','Luces bidireccionales en muralla lateral/posterior.',78,12,'Alta','Iluminación perimetral'],
  ['L15','L','Acceso vehicular','Luz acceso vehicular','Luminaria para acceso y seguridad.',29,78,'Media','Iluminación acceso'],
  ['L16','L','Acceso peatonal/jardín','Luz acceso peatonal','Balizas o bidireccionales en acceso y jardín.',55,86,'Media','Iluminación jardín'],

  ['E1','E','Quincho/cocina','Heladera','Toma dedicada o circuito exclusivo recomendado.',45,43,'Alta','Dedicado heladera'],
  ['E2','E','Quincho/cocina','Horno eléctrico','Circuito dedicado. Confirmar potencia antes de cablear.',46,46,'Alta','Dedicado horno'],
  ['E3','E','Quincho/cocina','Microondas','Toma reforzada o dedicada según potencia.',46,49,'Alta','Microondas'],
  ['E4','E','Quincho/cocina','Anafe/campana','Confirmar si será eléctrico, gas o mixto. Campana requiere punto alto.',45,52,'Alta','Anafe/campana'],
  ['E5','E','Lavadero','Lavarropas','Toma dedicada cerca de agua/desagüe.',77,29,'Alta','Dedicado lavarropas'],
  ['E6','E','Lavadero','Secadora/previsión','Previsión para secadora o toma auxiliar.',79,32,'Media','Previsión secadora'],
  ['E7','E','Piscina','Motor/filtro piscina','Circuito dedicado con tablero y puesta a tierra.',55,18,'Alta','Dedicado piscina'],
  ['E8','E','Acceso vehicular','Motores portones','Alimentación para motores de portón.',26,85,'Alta','Dedicado portones'],
  ['E9','E','Acceso peatonal','Portero/cerradura','Punto para portero, videoportero o cerradura eléctrica.',60,91,'Media','Acceso peatonal'],

  ['S1','SW','Sala/galería','Llaves escenas sala','Separar sala, comedor y galería.',58,66,'Alta','Control sala/galería'],
  ['S2','SW','Quincho','Llaves escenas quincho','Separar mesada, barra, general y exterior.',39,59,'Alta','Control quincho'],
  ['S3','SW','Dormitorios/baños','Llaves accesos interiores','Ubicar en accesos y validar sentido de puertas.',50,46,'Media','Control interior'],

  ['I1','I','Frente','Pilasta ANDE/tablero','Pilastra y tablero principal. Validar protecciones y puesta a tierra.',17,94,'Alta','Principal'],
  ['I2','I','Perímetro','Reserva cámaras/alarma','Reserva de cañerías para cámaras, alarma y sensores.',82,10,'Media','Seguridad'],
  ['I3','I','Sala','Router/WiFi central','Punto de energía y datos para router o access point.',61,58,'Media','Datos/WiFi'],
  ['I4','I','Exterior técnico','Reserva generador/bomba','Previsión para generador, tanque o motobomba.',82,82,'Alta','Reserva técnica'],
];

const initialPoints = seed.map(([point_code,type,room,title,detail,x,y,priority,circuit], index) => ({
  id: `local-${index + 1}`,
  point_code,
  type,
  room,
  title,
  detail,
  x,
  y,
  priority,
  circuit,
  status: 'Pendiente',
}));

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
  const [showLabels, setShowLabels] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [markerSize, setMarkerSize] = useState(12);
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
      detail: 'Editar descripción, ubicación, altura, circuito y observación de visita.',
      x: 50,
      y: 50,
      priority: 'Media',
      circuit: 'A definir',
      status: 'Pendiente',
    };
    if (isSupabaseConfigured && syncState === 'supabase') {
      const { data, error } = await supabase.from('electrical_points').insert(mapPointToDb(point, project.id)).select('*').single();
      if (error) return setMessage(`No se pudo agregar: ${error.message}`);
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
      if (error) return setMessage(`No se pudo duplicar: ${error.message}`);
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
      if (error) return setMessage(`No se pudo eliminar: ${error.message}`);
    }
    const next = points.filter((p) => p.id !== selected.id);
    setPoints(next);
    setSelectedId(next[0]?.id || '');
  };

  const resetBase = async () => {
    if (isSupabaseConfigured && syncState === 'supabase') {
      await supabase.from('electrical_points').delete().eq('project_id', project.id);
      const { data, error } = await supabase.from('electrical_points').insert(initialPoints.map((p) => mapPointToDb(p, project.id))).select('*');
      if (error) return setMessage(`No se pudo restaurar: ${error.message}`);
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
      return `<g><circle cx="${p.x * 10}" cy="${p.y * 10}" r="5" fill="${c.color}" stroke="white" stroke-width="2"/><text x="${p.x * 10}" y="${p.y * 10 + 2}" text-anchor="middle" font-size="4" font-family="Arial" font-weight="bold" fill="${p.type === 'L' ? 'black' : 'white'}">${p.point_code}</text><text x="${p.x * 10 + 8}" y="${p.y * 10 + 2}" font-size="8" font-family="Arial" fill="black">${title}</text></g>`;
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
            <label className="zoom-control">Zoom plano <input type="range" min="70" max="160" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /><strong>{zoom}%</strong></label>
            <label className="zoom-control">Tamaño puntos <input type="range" min="8" max="22" value={markerSize} onChange={(e) => setMarkerSize(Number(e.target.value))} /><strong>{markerSize}px</strong></label>
            <button onClick={exportJSON}>Exportar JSON</button>
            <button onClick={exportCSV}>Exportar CSV</button>
            <button onClick={exportSVG}>Exportar SVG</button>
            <button onClick={() => window.print()}>PDF / imprimir</button>
          </div>

          <div className="plan-wrapper">
            <div className="plan-scroll">
              <div ref={planRef} className="plan-area" style={{ '--plan-zoom': zoom / 100 }} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
                {project.planImageUrl ? <img className="plan-image" src={project.planImageUrl} alt="Plano base" /> : <PlanFallback />}
                {visiblePoints.map((p) => {
                  const cat = CATEGORIES[p.type] || CATEGORIES.T;
                  const selectedClass = p.id === selectedId ? ' selected' : '';
                  return (
                    <button key={p.id} className={`point-marker${selectedClass}`} style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundColor: cat.color, color: p.type === 'L' ? '#111827' : '#fff', '--marker-size': `${markerSize}px`, '--marker-font': `${Math.max(5, Math.round(markerSize * 0.38))}px` }} title={`${p.point_code} - ${p.title}`} onPointerDown={(e) => { e.preventDefault(); setSelectedId(p.id); setDragId(p.id); }}>
                      <span>{p.point_code}</span>
                      {showLabels && <em>{p.title}</em>}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="hint">Consejo: usá puntos de 8 a 14 px para ubicar con precisión. Activá etiquetas solo al revisar.</p>
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
