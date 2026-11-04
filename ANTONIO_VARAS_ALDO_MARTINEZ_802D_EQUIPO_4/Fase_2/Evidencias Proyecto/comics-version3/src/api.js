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