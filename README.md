# Tomy Analytics

Plataforma de analítica web self-hosted construida con React, TypeScript, Supabase y Recharts.

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Estilos:** Tailwind CSS 4
- **Gráficas:** Recharts
- **Backend/Datos:** Supabase (PostgreSQL + REST API)
- **Tracker:** Script embebible en ES6 compilado a IIFE

## Estructura

```
src/
├── components/
│   ├── charts/       # Componentes de gráficas (LineChart, BarChart, PieChart)
│   └── ui/           # Componentes de interfaz (StatCard, LoadingSpinner)
├── pages/
│   ├── auth/         # Login y Callback de autenticación
│   ├── dashboard/    # Paneles: Overview, Pages, Referrers, Audience, Events, Realtime, Settings
│   └── Home.tsx      # Página de inicio (redirección)
├── tracker/          # Script de tracking (ES6 modules → IIFE)
│   ├── types.ts      # Interfaces del tracker
│   ├── config.ts     # Lectura de configuración desde data attributes
│   ├── id.ts         # IDs de visitante (cookie) y sesión (sessionStorage)
│   ├── page.ts       # Captura de información de la página
│   ├── api.ts        # Envío de datos a Supabase (sendBeacon / XHR)
│   ├── events.ts     # Captura de clics en elementos trackeables
│   ├── navigation.ts # Detección de navegación SPA
│   └── index.ts      # Punto de entrada e inicialización
├── lib/              # Cliente de Supabase
├── App.tsx           # Enrutador principal
└── main.tsx          # Entry point de la app
```

## Desarrollo

```bash
npm install
npm run dev       # Inicia servidor dev + watcher del tracker
npm run build     # Compila app React + tracker IIFE
npm run preview   # Vista previa de producción
```

## Despliegue

1. Configurar proyecto en Supabase y ejecutar las migraciones en `supabase/migrations/`
2. Copiar `.env.example` a `.env` y completar las variables
3. Compilar con `npm run build`
4. Desplegar la carpeta `dist/` en cualquier host estático (Vercel, Netlify, etc.)

## Tracker

El script de tracking se sirve en `/analytics.js` y se inserta en el sitio a monitorear:

```html
<script
  src="https://tu-dominio.com/analytics.js"
  data-site-id="<ID_DEL_SITIO>"
  data-supabase-url="<URL_DE_SUPABASE>"
  data-anon-key="<KEY_ANONIMA>"
  defer></script>
```

### Configuración alternativa via JavaScript:

```html
<script>
window.__analytics_config = {
  siteId: '<ID>',
  supabaseUrl: '<URL>',
  anonKey: '<KEY>',
}
</script>
<script src="https://tu-dominio.com/analytics.js" defer></script>
```

### Eventos personalizados:

```html
<button data-analytics-event="signup">Registrarse</button>
<button data-analytics-event="purchase" data-analytics-props='{"plan":"pro"}'>Comprar</button>
```

## Base de datos

Las migraciones están en `supabase/migrations/`. Incluyen:

- `sites` — Sitios registrados por cada usuario
- `visitors` — Visitantes únicos
- `sessions` — Sesiones con datos de dispositivo, navegador, SO, UTM
- `pageviews` — Vistas de página individuales
- `events` — Eventos personalizados
- `process_event()` — RPC que registra pageviews/eventos desde el tracker
- Funciones RPC para consultas del dashboard
