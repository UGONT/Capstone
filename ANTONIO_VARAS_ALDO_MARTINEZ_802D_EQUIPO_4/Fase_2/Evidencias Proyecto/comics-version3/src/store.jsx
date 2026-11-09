// src/store.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { fetchComics, fetchEtiquetas,fetchMe, loginApi, logoutApi, crearComic  } from './api'
import { setCampana, colorDe } from './data'

const Ctx = createContext()
export const useStore = () => useContext(Ctx)

const ESTADO_LABEL = {
  en_campana: 'En campaña',
  publicado: 'Publicado',
  borrador: 'Borrador',
  cancelado: 'Cancelado',
}

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
    bg: colorDe(c.titulo),
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
  const [user, setUser] = useState(null)
  const [cargandoUser, setCargandoUser] = useState(true)
  const [comics, setComics] = useState([])
  const [cargandoComics, setCargandoComics] = useState(true)
  const [error, setError] = useState(null)
  const [apoyos, setApoyos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vi_apoyos')) ?? {} } catch { return {} }
  })

  const [etiquetas, setEtiquetas] = useState([])
  const [cargandoEtiquetas, setCargandoEtiquetas] = useState(true)

  // Cargar etiquetas
  useEffect(() => {
    fetchEtiquetas()
      .then((data) => {
        setEtiquetas(data)
        setCargandoEtiquetas(false)
      })
      .catch(() => setCargandoEtiquetas(false))
  }, [])

  // Restaurar usuario desde token al cargar
  useEffect(() => {
    fetchMe()
      .then((data) => {
        if (data) setUser(data)
        setCargandoUser(false)
      })
      .catch(() => setCargandoUser(false))
  }, [])

  // Cargar cómics
  useEffect(() => {
    fetchComics()
      .then((data) => {
        const lista = data.map(normalizar)
        setComics(lista)
        const destacado = lista.find((c) => c.estado === 'En campaña') || lista[0]
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
        setCargandoComics(false)
      })
      .catch((err) => {
        setError(err)
        setCargandoComics(false)
      })
  }, [])

  useEffect(() => {
    try { localStorage.setItem('vi_apoyos', JSON.stringify(apoyos)) } catch {}
  }, [apoyos])

  // 🔐 Login real
  const login = async (email, password) => {
    const usuario = await loginApi(email, password)
    setUser(usuario)
    return usuario
  }

  // 🔓 Logout real
  const logout = () => {
    logoutApi()
    setUser(null)
  }

  // Actualizar perfil (por ahora solo local — después endpoint)
  const actualizarPerfil = (parcial) => {
    setUser((prev) => ({ ...prev, ...parcial }))
  }

  const addComic = async (datos, portadaFile = null) => {
    const nuevoComic = await crearComic(datos, portadaFile)

    // Refrescar la lista completa desde el backend
    const lista = await fetchComics()
    const normalizada = lista.map(normalizar)
    setComics(normalizada)

    return nuevoComic.id   // devolvemos el ID real del backend
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
        user, cargandoUser,
        comics, cargandoComics, error,
        etiquetas, cargandoEtiquetas,
        login, logout, actualizarPerfil,
        addComic, aporteDe, apoyar, addCapitulo,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}