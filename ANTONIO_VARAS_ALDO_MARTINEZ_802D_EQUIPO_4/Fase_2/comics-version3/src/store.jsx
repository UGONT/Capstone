// src/store.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { fetchComics } from './api'
import { setCampana, colorDe } from './data'

const Ctx = createContext()
export const useStore = () => useContext(Ctx)

const cargar = (k, d) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d }
}
const guardar = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* sin espacio */ }
}

// Mapea el estado del back a la etiqueta que usa el front
const ESTADO_LABEL = {
  en_campana: 'En campaña',
  publicado: 'Publicado',
  borrador: 'Borrador',
  cancelado: 'Cancelado',
}

// Normaliza un cómic del backend al formato que espera el front
function normalizar(c) {
  return {
    id: c.id,
    titulo: c.titulo,
    autor: c.autor || 'Anónimo',
    autores: c.autores || [],
    generos: c.generos || [],
    etiquetas: c.etiquetas || [],
    descripcion: c.descripcion || '',
    img: c.img || '',
    bg: colorDe(c.titulo),            // degradado derivado del título
    recaudado: c.recaudado || 0,
    meta: c.meta || 0,
    apoyos: c.apoyos ?? 0,
    dias: c.dias ?? null,
    capitulos: c.capitulos ?? [],
    avance: c.avance ?? [],
    formato: c.formato || 'Digital',
    estado: ESTADO_LABEL[c.estado] || c.estado,
    valoracion: Number(c.valoracion_promedio) || 0,
    totalValoraciones: c.total_valoraciones || 0,
    creador: c.creador || null,
  }
}

export function StoreProvider({ children }) {
  const [user, setUser] = useState(() => cargar('vi_user', null))
  const [comics, setComics] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [apoyos, setApoyos] = useState(() => cargar('vi_apoyos', {}))

  // Cargar cómics desde el backend
  useEffect(() => {
    let activo = true
    fetchComics()
      .then((data) => {
        if (!activo) return
        const lista = data.map(normalizar)
        setComics(lista)

        // Elegir el primer cómic en campaña como destacado
        const destacado =
          lista.find((c) => c.estado === 'En campaña') ||
          lista[0] || null

        if (destacado) {
          setCampana({
            titulo: destacado.titulo,
            descripcion: destacado.descripcion,
            recaudado: destacado.recaudado,
            meta: destacado.meta,
            apoyos: destacado.apoyos,
            dias: destacado.dias ?? 12,
            desde: 12,
            bg: destacado.bg,
            img: destacado.img,
          })
        }
        setCargando(false)
      })
      .catch((err) => {
        if (!activo) return
        console.error('Error cargando cómics:', err)
        setError(err)
        setCargando(false)
      })
    return () => { activo = false }
  }, [])

  useEffect(() => guardar('vi_user', user), [user])
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
    setComics((p) => [
      {
        bg: 'from-violet-500 to-lime-300',
        capitulos: [],
        avance: [],
        recaudado: 0,
        apoyos: 0,
        estado: 'En campaña',
        ...c,
        id,
        creador: user.email,
        autor: c.autor?.trim() || user.nombre,
      },
      ...p,
    ])
    return id
  }

  const aporteDe = (id) =>
    user ? apoyos[`${user.email}:${id}`] || 0 : 0

  const apoyar = (id, monto) => {
    setComics((p) =>
      p.map((c) =>
        c.id === id
          ? { ...c, recaudado: c.recaudado + monto, apoyos: c.apoyos + 1 }
          : c
      )
    )
    setApoyos((a) => ({
      ...a,
      [`${user.email}:${id}`]: (a[`${user.email}:${id}`] || 0) + monto,
    }))
  }

  const addCapitulo = (id, titulo) =>
    setComics((p) =>
      p.map((c) =>
        c.id === id
          ? {
              ...c,
              capitulos: [
                ...c.capitulos,
                {
                  n: c.capitulos.length + 1,
                  titulo: `Capítulo ${c.capitulos.length + 1} · ${titulo}`,
                  fecha: new Date().toISOString().slice(0, 10),
                },
              ],
            }
          : c
      )
    )

  return (
    <Ctx.Provider
      value={{
        user, comics, cargando, error,
        login, logout, actualizarPerfil,
        addComic, aporteDe, apoyar, addCapitulo,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}