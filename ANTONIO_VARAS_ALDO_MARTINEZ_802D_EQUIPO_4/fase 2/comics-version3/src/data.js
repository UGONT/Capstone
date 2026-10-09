// Datos de prueba. Para usar tus imágenes del Figma: ponlas en src/assets
// y agrega el campo img (ej: img: '/src/assets/ciudad.png').
export const BRAND = 'EPEWTUFE'
export const GENEROS = ['Ciencia ficción', 'Fantasía', 'Comedia', 'Drama', 'Terror', 'Romance', 'Aventura', 'Misterio']

const caps = (n) => Array.from({ length: n }, (_, i) => ({ n: i + 1, titulo: `Capítulo ${i + 1}`, fecha: `2026-09-${10 + i}` }))
const base = { creador: 'demo', formato: 'Digital + Físico', estado: 'En campaña', avance: [] }

export const comics = [
  { ...base, id: 1, titulo: 'La ciudad sumergida', autor: 'Mara Díaz', generos: ['Ciencia ficción', 'Aventura'], descripcion: 'Dos buzos descubren una ciudad antigua bajo el mar y algo que no quiere ser encontrado.', bg: 'from-teal-500 to-orange-300', recaudado: 6200, meta: 10000, apoyos: 142, dias: 20, capitulos: caps(3) },
  { ...base, id: 2, titulo: 'Huesos de domingo', autor: 'Tomás Rey', generos: ['Comedia', 'Misterio'], descripcion: 'Un esqueleto con rutina, vecinos curiosos y un desayuno que siempre sale mal.', bg: 'from-yellow-300 to-purple-900', recaudado: 3100, meta: 4000, apoyos: 88, dias: 9, capitulos: caps(2) },
  { ...base, id: 3, titulo: 'Jardín de ceniza', autor: 'Lina Koi', generos: ['Fantasía', 'Drama'], descripcion: 'Una guerrera cruza un bosque de rosas verdes hacia un volcán que decide quién vuelve.', bg: 'from-emerald-600 to-red-700', recaudado: 9800, meta: 12000, apoyos: 301, dias: 15, capitulos: caps(4) },
  { ...base, id: 4, titulo: 'Mensajera del sal', autor: 'Camila Soto', generos: ['Ciencia ficción', 'Drama'], descripcion: 'Una novela gráfica de ciencia ficción sobre memoria, fronteras y todo lo que cargamos para volver a casa.', bg: 'from-slate-700 via-orange-500 to-orange-300', recaudado: 18420, meta: 15000, apoyos: 386, dias: 12, capitulos: caps(5) },
]

export const campana = {
  titulo: 'Mensajera del sal', descripcion: comics[3].descripcion,
  recaudado: 18420, meta: 15000, apoyos: 386, dias: 12, desde: 12,
  bg: comics[3].bg,
}

// Títulos para el selector de "cómics que he leído". Cuando haya backend,
// esta lista viene de la base de datos con sus portadas reales.
export const CATALOGO_LECTURA = [
  'Saga', 'Akira', 'Persépolis', 'Maus', 'Watchmen', 'One Piece', 'Berserk', 'Sandman', 'Blacksad', 'Tintín',
  'Mafalda', 'Dragon Ball', 'Death Note', 'Fullmetal Alchemist', 'Daredevil', 'Batman', 'Spider-Man', 'Hellboy',
  'Cross Game', 'Y: el último hombre',
]
const PALETA = ['from-rose-500 to-orange-400', 'from-sky-500 to-indigo-700', 'from-emerald-500 to-teal-800', 'from-amber-400 to-red-600', 'from-fuchsia-500 to-purple-800', 'from-lime-400 to-green-700', 'from-slate-500 to-slate-900', 'from-cyan-400 to-blue-700']
export const colorDe = (t) => PALETA[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETA.length]
