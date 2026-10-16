// src/api.js
const API_URL = '/api'   // usa el proxy de Vite

// =====================================================================
// CÓMICS
// =====================================================================

export async function fetchComics() {
  const res = await fetch(`${API_URL}/comics/`)
  if (!res.ok) throw new Error(`Error ${res.status} al cargar cómics`)
  return res.json()
}

export async function fetchComicDetalle(id) {
  const res = await fetch(`${API_URL}/comics/${id}/`)
  if (!res.ok) throw new Error(`Error ${res.status} al cargar el cómic`)
  return res.json()
}

// =====================================================================
// ASISTENTE IA
// =====================================================================

export async function enviarMensajeAlAgente(mensaje) {
  const res = await fetch(`${API_URL}/assistant/chat/`, {
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