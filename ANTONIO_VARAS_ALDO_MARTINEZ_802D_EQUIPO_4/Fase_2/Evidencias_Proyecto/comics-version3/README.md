# viñeta · front

    npm install
    npm run dev

- Rutas: `/` · `/explorar` · `/comic/:id` · `/publicar` (requiere sesión) · `/login`
- Colores y tipografía: `src/index.css` (bloque `@theme`). Nombre de marca: `BRAND` en `src/data.js`.
- Datos de prueba y sesión: `src/data.js` y `src/store.jsx` (localStorage). Cuando haya backend, reemplaza las funciones del store por llamadas a la API.
- Agente IA: `responder()` en `src/components.jsx` es un mock; cámbialo por una llamada a tu backend.
