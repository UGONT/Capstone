// src/api.js
const API_URL = '/api'

// Helper: lee el body como JSON o devuelve un objeto de error
async function leerJSON(res) {
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }
  // Si el backend devolvió HTML (por un 500 sin manejar), damos un mensaje claro
  const text = await res.text()
  console.error('Respuesta no-JSON del servidor:', text.slice(0, 500))
  return { error: 'Error interno del servidor. Revisá la consola del backend.' }
}

// =====================================================================
// TOKENS
// =====================================================================

const getAccess = () => localStorage.getItem('access')
const getRefresh = () => localStorage.getItem('refresh')

const guardarTokens = (access, refresh) => {
  localStorage.setItem('access', access)
  localStorage.setItem('refresh', refresh)
}

export const limpiarTokens = () => {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
}

// Intenta refrescar el access cuando expira
async function intentarRefresh() {
  const refresh = getRefresh()
  if (!refresh) return false
  try {
    const res = await fetch(`${API_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) return false
    const data = await res.json()
    localStorage.setItem('access', data.access)
    return true
  } catch {
    return false
  }
}

// Fetch con Authorization y auto-refresh en 401
async function fetchConAuth(url, opciones = {}) {
  const makeRequest = (token) =>
    fetch(url, {
      ...opciones,
      headers: {
        ...opciones.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

  let res = await makeRequest(getAccess())

  if (res.status === 401) {
    const ok = await intentarRefresh()
    if (ok) {
      res = await makeRequest(getAccess())
    } else {
      limpiarTokens()
    }
  }

  return res
}

// =====================================================================
// AUTH
// =====================================================================

export async function registrarUsuario(datos) {
  const res = await fetch(`${API_URL}/auth/registro/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })

  const data = await leerJSON(res)

  if (!res.ok) {
    throw { status: res.status, errores: data }
  }

  guardarTokens(data.access, data.refresh)
  return data.usuario
}

export async function loginApi(email, password) {
  const res = await fetch(`${API_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await leerJSON(res)

  if (!res.ok) {
    throw { status: res.status, errores: data }
  }

  guardarTokens(data.access, data.refresh)
  return data.usuario
}

export async function fetchMe() {
  if (!getAccess()) return null
  try {
    const res = await fetchConAuth(`${API_URL}/auth/me/`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function logoutApi() {
  limpiarTokens()
}

// =====================================================================
// CÓMICS / ASISTENTE
// =====================================================================

export async function fetchComics() {
  const res = await fetch(`${API_URL}/comics/`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function enviarMensajeAlAgente(mensaje) {
  // Usa fetchConAuth para que el back sepa quién es el usuario
  const res = await fetchConAuth(`${API_URL}/assistant/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensaje }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status}`)
  }
  const data = await res.json()
  return data.respuesta
}

export async function fetchEtiquetas() {
  const res = await fetch(`${API_URL}/etiquetas/`)
  if (!res.ok) throw new Error(`Error ${res.status} al cargar etiquetas`)
  return res.json()
}


// =====================================================================
// CREAR CÓMIC (con FormData por la portada)
// =====================================================================

export async function crearComic(datos, portadaFile = null, avanceFiles = []) {
  const form = new FormData()

  form.append('titulo', datos.titulo)
  form.append('sinopsis', datos.descripcion)
  form.append('numero_paginas', datos.numero_paginas || 0)
  form.append('meta_recaudacion', datos.meta)
  form.append('dias', datos.dias)
  form.append('crowdfunding_activo', 'true')

  // Etiquetas: DRF ListField con multipart acepta múltiples valores con la misma clave
  datos.generos.forEach((nombre) => {
    form.append('etiquetas', nombre)
  })

  if (portadaFile) {
    form.append('portada', portadaFile)
  }

  const res = await fetchConAuth(`${API_URL}/comics/`, {
    method: 'POST',
    body: form,   
  })

  const data = await leerJSON(res)
  if (!res.ok) throw { status: res.status, errores: data }
  return data
}

// =====================================================================
// CREAR CAPÍTULO
// =====================================================================

export async function crearCapitulo(comicId, datos) {
  const res = await fetchConAuth(`${API_URL}/comics/${comicId}/capitulos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  const data = await leerJSON(res)
  if (!res.ok) throw { status: res.status, errores: data }
  return data
}

// =====================================================================
// CREAR RECOMPENSA
// =====================================================================

export async function crearRecompensa(comicId, datos) {
  const res = await fetchConAuth(`${API_URL}/comics/${comicId}/recompensas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  const data = await leerJSON(res)
  if (!res.ok) throw { status: res.status, errores: data }
  return data
}




export async function fetchComicDetalle(id) {
  const res = await fetch(`${API_URL}/comics/${id}/`)
  if (!res.ok) throw new Error(`Error ${res.status} al cargar el cómic`)
  return res.json()
}





// =====================================================================
// EDITAR Y ELIMINAR CAPÍTULOS
// =====================================================================

export async function actualizarCapitulo(capId, datos) {
  const res = await fetchConAuth(`${API_URL}/capitulos/${capId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  const data = await leerJSON(res)
  if (!res.ok) throw { status: res.status, errores: data }
  return data
}

export async function eliminarCapituloApi(capId) {
  const res = await fetchConAuth(`${API_URL}/capitulos/${capId}/`, {
    method: 'DELETE',
  })
  if (!res.ok && res.status !== 204) {
    const err = await leerJSON(res).catch(() => ({}))
    throw { status: res.status, errores: err }
  }
  return true
}

// =====================================================================
// EDITAR Y ELIMINAR RECOMPENSAS
// =====================================================================

export async function actualizarRecompensa(recId, datos) {
  const res = await fetchConAuth(`${API_URL}/recompensas/${recId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  const data = await leerJSON(res)
  if (!res.ok) throw { status: res.status, errores: data }
  return data
}

export async function eliminarRecompensaApi(recId) {
  const res = await fetchConAuth(`${API_URL}/recompensas/${recId}/`, {
    method: 'DELETE',
  })
  if (!res.ok && res.status !== 204) {
    const err = await leerJSON(res).catch(() => ({}))
    throw { status: res.status, errores: err }
  }
  return true
}


// =====================================================================
// ACTUALIZAR COMIC
// =====================================================================

export async function actualizarComic(comicId, datos, portadaFile = null) {
  const form = new FormData()

  // Solo añadimos los campos que vienen en `datos`
  if (datos.titulo !== undefined) form.append('titulo', datos.titulo)
  if (datos.descripcion !== undefined) form.append('sinopsis', datos.descripcion)
  if (datos.numero_paginas !== undefined) form.append('numero_paginas', datos.numero_paginas)
  if (datos.meta !== undefined) form.append('meta_recaudacion', datos.meta)
  if (datos.estado !== undefined) form.append('estado', datos.estado)
  if (datos.crowdfunding_activo !== undefined) {
    form.append('crowdfunding_activo', datos.crowdfunding_activo ? 'true' : 'false')
  }

  // Etiquetas: solo si vienen
  if (datos.generos !== undefined) {
    datos.generos.forEach((nombre) => form.append('etiquetas', nombre))
  }

  // Portada opcional
  if (portadaFile) {
    form.append('portada', portadaFile)
  }

  const res = await fetchConAuth(`${API_URL}/comics/${comicId}/`, {
    method: 'PATCH',
    body: form,
  })

  const data = await leerJSON(res)
  if (!res.ok) throw { status: res.status, errores: data }
  return data
}


// =====================================================================
// PERFIL
// =====================================================================

export async function fetchMiPerfil() {
  const res = await fetchConAuth(`${API_URL}/perfil/`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function actualizarMiPerfilApi(datos, avatarFile = null) {
  const form = new FormData()

  if (datos.nickname !== undefined) form.append('nickname', datos.nickname)
  if (datos.edad !== undefined && datos.edad !== null && datos.edad !== '') {
    form.append('edad', datos.edad)
  }
  if (datos.bio !== undefined) form.append('bio', datos.bio)

  if (datos.generos !== undefined) {
    datos.generos.forEach((nombre) => form.append('gustos', nombre))
  }
  if (datos.leidos !== undefined) {
    datos.leidos.forEach((titulo) => form.append('comics_leidos', titulo))
  }

  if (avatarFile) {
    form.append('avatar', avatarFile)
  }

  const res = await fetchConAuth(`${API_URL}/perfil/`, {
    method: 'PATCH',
    body: form,
  })

  const data = await leerJSON(res)
  if (!res.ok) throw { status: res.status, errores: data }
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    nombre: data.nickname,   
    edad: data.edad,
    generos: data.generos,
    leidos: data.leidos,
    es_creador: data.es_creador,
  }
}


// =====================================================================
// PÁGINAS DE AVANCE
// =====================================================================

export async function subirPaginaAvance(comicId, file) {
  const form = new FormData()
  form.append('imagen', file)

  const res = await fetchConAuth(`${API_URL}/comics/${comicId}/avance/`, {
    method: 'POST',
    body: form,
  })
  const data = await leerJSON(res)
  if (!res.ok) throw { status: res.status, errores: data }
  return data
}

export async function listarAvance(comicId) {
  const res = await fetchConAuth(`${API_URL}/comics/${comicId}/avance/`)
  const data = await leerJSON(res)
  if (!res.ok) throw { status: res.status, errores: data }
  return data
}

export async function eliminarPaginaAvanceApi(paginaId) {
  const res = await fetchConAuth(`${API_URL}/avance/${paginaId}/`, {
    method: 'DELETE',
  })
  if (!res.ok && res.status !== 204) {
    const err = await leerJSON(res).catch(() => ({}))
    throw { status: res.status, errores: err }
  }
  return true
}