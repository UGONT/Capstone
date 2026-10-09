import { createContext, useContext, useEffect, useState } from 'react'
import { comics as seed } from './data'

// Estado de prueba guardado en localStorage. Cuando exista backend,
// reemplaza estas funciones por llamadas a la API.
const Ctx = createContext()
export const useStore = () => useContext(Ctx)
const cargar = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* sin espacio */ } }

export function StoreProvider({ children }) {
  const [user, setUser] = useState(() => cargar('vi_user', null))
  const [comics, setComics] = useState(() => cargar('vi_comics', seed))
  const [apoyos, setApoyos] = useState(() => cargar('vi_apoyos', {}))
  useEffect(() => guardar('vi_user', user), [user])
  useEffect(() => guardar('vi_comics', comics), [comics])
  useEffect(() => guardar('vi_apoyos', apoyos), [apoyos])

  const login = (d, registro) => {
    const perfiles = cargar('vi_perfiles', {})
    if (registro || !perfiles[d.email]) perfiles[d.email] = d
    guardar('vi_perfiles', perfiles)
    setUser(perfiles[d.email])
  }
  const logout = () => setUser(null)
  const actualizarPerfil = (parcial) => {
    const nuevo = { ...user, ...parcial }
    setUser(nuevo)
    const perfiles = cargar('vi_perfiles', {})
    perfiles[nuevo.email] = nuevo
    guardar('vi_perfiles', perfiles)
  }
  const addComic = (c) => {
    const id = Date.now()
    setComics((p) => [{ bg: 'from-violet-500 to-lime-300', capitulos: [], avance: [], recaudado: 0, apoyos: 0, estado: 'En campaña', ...c, id, creador: user.email, autor: user.nombre }, ...p])
    return id
  }
  const aporteDe = (id) => (user ? apoyos[`${user.email}:${id}`] || 0 : 0)
  const apoyar = (id, monto) => {
    setComics((p) => p.map((c) => (c.id === id ? { ...c, recaudado: c.recaudado + monto, apoyos: c.apoyos + 1 } : c)))
    setApoyos((a) => ({ ...a, [`${user.email}:${id}`]: (a[`${user.email}:${id}`] || 0) + monto }))
  }
  const addCapitulo = (id, titulo) =>
    setComics((p) => p.map((c) => (c.id === id ? { ...c, capitulos: [...c.capitulos, { n: c.capitulos.length + 1, titulo: `Capítulo ${c.capitulos.length + 1} · ${titulo}`, fecha: new Date().toISOString().slice(0, 10) }] } : c)))

  return <Ctx.Provider value={{ user, comics, login, logout, actualizarPerfil, addComic, aporteDe, apoyar, addCapitulo }}>{children}</Ctx.Provider>
}
