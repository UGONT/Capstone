// src/data.js
export const BRAND = 'EPEWTUFE'

export const GENEROS = [
  'Ciencia ficción', 'Fantasía', 'Comedia', 'Drama',
  'Terror', 'Romance', 'Aventura', 'Misterio',
]

export const CATALOGO_LECTURA = [
  'Saga', 'Akira', 'Persépolis', 'Maus', 'Watchmen', 'One Piece',
  'Berserk', 'Sandman', 'Blacksad', 'Tintín', 'Mafalda', 'Dragon Ball',
  'Death Note', 'Fullmetal Alchemist', 'Daredevil', 'Batman',
  'Spider-Man', 'Hellboy', 'Cross Game', 'Y: el último hombre',
]

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

export const colorDe = (t) =>
  PALETA[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETA.length]

// Placeholder. El store lo reemplaza con datos reales.
export let campana = {
  titulo: 'Cargando…',
  descripcion: '',
  recaudado: 0,
  meta: 0,
  apoyos: 0,
  dias: 0,
  desde: 0,
  bg: 'from-slate-700 to-slate-900',
  img: '',
}

export function setCampana(nueva) {
  campana = { ...campana, ...nueva }
}