# Editor eléctrico San Bernardino

Aplicación independiente para ubicar y editar puntos de:

- Aires acondicionados
- Tomacorrientes
- Luminarias / riel LED
- Electrodomésticos y equipos
- Interruptores / escenas
- Infraestructura / reservas

Funciona con Supabase si configurás `.env`, y usa LocalStorage como respaldo si Supabase no está configurado.

## Ejecutar localmente

```bash
npm install
npm run dev
```

## Variables de entorno

Crear un archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Completar:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

## Supabase

1. Crear un proyecto en Supabase.
2. Ir a SQL Editor.
3. Ejecutar `supabase/schema.sql`.
4. Copiar Project URL y anon public key en `.env` y en Vercel.

## Vercel

1. Crear repo nuevo en GitHub.
2. Subir estos archivos.
3. En Vercel, importar el repo.
4. Agregar variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

## Archivos importantes

- `src/App.jsx`: aplicación completa.
- `src/App.css`: estilos.
- `src/supabaseClient.js`: conexión Supabase.
- `supabase/schema.sql`: tablas y políticas.
- `public/plano_sanber_base.png`: plano base.
- Deploy production update
``
