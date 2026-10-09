// Datos cargados desde el backend Django.
// Las imágenes vienen de Supabase Storage.
// Los campos que no existen en el modelo de Django se rellenan con valores por defecto.

export const BRAND = 'EPEWTUFE'
export const GENEROS = ['Ciencia ficción', 'Fantasía', 'Comedia', 'Drama', 'Terror', 'Romance', 'Aventura', 'Misterio']

const caps = (n) => Array.from({ length: n }, (_, i) => ({ n: i + 1, titulo: `Capítulo ${i + 1}`, fecha: `2026-09-${10 + i}` }))
const base = { creador: 'demo', formato: 'Digital + Físico', estado: 'En campaña', avance: [] }

// 👇 URLs por defecto para campos que no existen en el backend
const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api/comics/'

const DEFAULT_BG = 'from-slate-700 to-slate-900'
const PALETA_FALLBACK = [
  'from-rose-500 to-orange-400',
  'from-sky-500 to-indigo-700',
  'from-emerald-500 to-teal-800',
  'from-amber-400 to-red-600',
  'from-fuchsia-500 to-purple-800',
  'from-lime-400 to-green-700',
  'from-slate-500 to-slate-900',
  'from-cyan-400 to-blue-700',
]

// 👇 Array mutable: se llena cuando se llama a cargarComics()
//    Se usa `let` y se muta (push/length=0) para que los imports mantengan la referencia.
export let comics = []

// 👇 Normaliza un cómic de la API al formato que espera el front
function normalizarComic(apiComic, index) {
  // El backend devuelve `descripcion`, `generos`, `img`, `recaudado`, `meta`, `autor`
  return {
    ...base,                          // rellena campos ausentes (creador, formato, estado, avance)
    id: apiComic.id,
    titulo: apiComic.titulo,
    autor: apiComic.autor ?? 'Anónimo',
    generos: apiComic.generos ?? [],
    descripcion: apiComic.descripcion ?? '',
    img: apiComic.img ?? '/portadas/default.jpg',
    recaudado: apiComic.recaudado ?? 0,
    meta: apiComic.meta ?? 0,
    // Campos que no existen en el backend → valores por defecto o calculados
    bg: apiComic.bg ?? PALETA_FALLBACK[index % PALETA_FALLBACK.length],
    apoyos: apiComic.apoyos ?? 0,
    dias: apiComic.dias ?? 0,
    capitulos: apiComic.capitulos ?? caps(3),
  }
}

// 👇 Carga los cómics desde Django y actualiza el array exportado
export async function cargarComics() {
  try {
    const res = await fetch(`${API_URL}/comics/`)
    if (!res.ok) throw new Error(`Error ${res.status}: no se pudieron cargar los cómics`)
    const data = await res.json()

    comics.length = 0                                  // vaciar sin perder la referencia
    comics.push(...data.map((c, i) => normalizarComic(c, i)))

    return comics
  } catch (error) {
    console.error('Error cargando cómics:', error)
    return []
  }
}

// 👇 Cómics en formato "campana" para la home.
//    Se recalcula cuando se llama a cargarComics().
export let campana = null

export async function cargarCampana() {
  await cargarComics()                                 // asegura que comics esté cargado
  if (!comics.length) {
    campana = null
    return null
  }

  // Elegimos el primer cómic (o el que prefieras, ej: comics[3])
  const destacado = comics[0]
  campana = {
    titulo: destacado.titulo,
    descripcion: destacado.descripcion,
    recaudado: destacado.recaudado,
    meta: destacado.meta,
    apoyos: destacado.apoyos,
    dias: destacado.dias,
    desde: 12,
    bg: destacado.bg,
    img: destacado.img,
  }
  return campana
}

// 👇 Títulos para el selector de "cómics que he leído" (sin cambios)
export const CATALOGO_LECTURA = [
  'Saga', 'Akira', 'Persépolis', 'Maus', 'Watchmen', 'One Piece', 'Berserk', 'Sandman', 'Blacksad', 'Tintín',
  'Mafalda', 'Dragon Ball', 'Death Note', 'Fullmetal Alchemist', 'Daredevil', 'Batman', 'Spider-Man', 'Hellboy',
  'Cross Game', 'Y: el último hombre',
]

// 👇 Genera un color de degradado a partir de un texto (para CATALOGO_LECTURA u otros usos)
const PALETA = [
  'from-rose-500 to-orange-400',
  'from-sky-500 to-indigo-700',
  'from-emerald-500 to-teal-800',
  'from-amber-400 to-red-600',
  'from-fuchsia-500 to-purple-800',
  'from-lime-400 to-green-700',
  'from-slate-500 to-slate-900',
  'from-cyan-400 to-blue-700',
]
export const colorDe = (t) => PALETA[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETA.length]