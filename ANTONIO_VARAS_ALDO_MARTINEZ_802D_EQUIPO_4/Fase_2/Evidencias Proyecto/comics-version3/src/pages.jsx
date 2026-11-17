import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Boton, ComicCard, Portada, SelectorComics, clp } from './components'
import { GENEROS } from './data'
import { useStore } from './store'
import { registrarUsuario, crearCapitulo, crearRecompensa,  actualizarCapitulo, 
          eliminarCapituloApi, actualizarRecompensa, eliminarRecompensaApi, actualizarComic, } from './api'

const campo = 'w-full rounded-xl bg-white px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-violeta'
const chip = (on) => `rounded-full px-4 py-2 text-sm transition-colors ${on ? 'bg-violeta text-white' : 'bg-white hover:bg-violeta/15'}`
const leer = (f) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f) })

export function Explorar() {
  const { comics, etiquetas } = useStore()
  const [q, setQ] = useState('')
  const [g, setG] = useState('')

  const lista = comics.filter(
    (c) =>
      (!g || c.generos.includes(g)) &&
      c.titulo.toLowerCase().includes(q.toLowerCase())
  )
  
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 md:px-20">
      <h1 className="text-4xl font-light md:text-5xl">Explorar cómics</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título" aria-label="Buscar por título" className={`${campo} mt-8 max-w-md`} />
      <div className="mt-4 flex flex-wrap gap-2">
        {['', ...etiquetas.map((e) => e.nombre)].map((x) => (
          <button key={x} onClick={() => setG(x)} className={chip(g === x)}>
            {x || 'Todos'}
          </button>
        ))}
      </div>
      {lista.length ? (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3">{lista.map((c) => <ComicCard key={c.id} c={c} />)}</div>
      ) : (
        <p className="mt-10">No hay cómics con ese filtro. Prueba otro género o <Link to="/publicar" className="text-violeta">publica el tuyo</Link>.</p>
      )}
    </section>
  )
}

export function Detalle() {
  const { id } = useParams()
  const { comics, user, aporteDe, apoyar, addCapitulo } = useStore()
  const nav = useNavigate()
  const [monto, setMonto] = useState(12)
  const c = comics.find((x) => String(x.id) === id)
  if (!c) return <p className="px-6 pb-24 md:px-20">No encontramos este cómic. <Link to="/explorar" className="text-violeta">Volver a explorar</Link></p>

  const mio = user?.email === c.creador
  const aporte = aporteDe(c.id)
  const visible = aporte > 0 || mio
  const pct = Math.round((c.recaudado / c.meta) * 100)
  const tiles = c.avance.length ? c.avance : [0, 1, 2, 3].map((i) => null)
  const subir = () => { const t = window.prompt('Título del capítulo'); if (t) addCapitulo(c.id, t) }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 md:px-20">
      <div className="grid gap-10 md:grid-cols-[300px_1fr]">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-tinta/10">
          <p className="bg-violeta py-2 text-center text-white">{c.estado}</p>
          <Portada bg={c.bg} img={c.img} titulo={c.titulo} className="aspect-[3/4] w-full" />
          <p className="bg-lima py-2 text-center">{c.formato}</p>
        </div>
        <div>
          <h1 className="text-5xl font-light">{c.titulo}</h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-tinta/70">{c.descripcion}</p>
          <p className="mt-6 text-sm text-tinta/50">Géneros</p>
          <div className="mt-2 flex flex-wrap gap-2">{c.generos.map((g) => <span key={g} className="rounded-md bg-violeta/15 px-3 py-1 text-sm text-violeta">{g}</span>)}</div>
          <p className="mt-6 text-sm text-tinta/50">Autoría</p>
          <p>{c.autor}</p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-3 rounded-2xl bg-tinta py-6 text-center text-white">
        <div><p className="text-3xl font-light">{c.apoyos}</p><p className="text-sm text-white/60">Personas apoyando</p></div>
        <div><p className="text-3xl font-light">{c.dias ?? '—'}</p><p className="text-sm text-white/60">Días restantes</p></div>
        <div><p className="text-3xl font-light">{pct}%</p><p className="text-sm text-white/60">De la meta</p></div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[1fr_340px]">
        <div>
          <h2 className="text-2xl font-light">Capítulos ({c.capitulos.length})</h2>
          {c.capitulos.length ? (
            <ul className="mt-4 space-y-2">
              {c.capitulos.map((k) => (
                <li key={k.n} className="flex justify-between rounded-xl bg-white px-5 py-4">
                  <span>{k.titulo}</span><span className="text-sm text-tinta/50">{k.n === 1 ? 'Piloto gratis' : k.fecha}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-tinta/60">Aún no hay capítulos publicados.{mio && ' Sube el primero con el botón de la derecha.'}</p>}

          <h2 className="mt-12 text-2xl font-light">Avance exclusivo</h2>

          {c.recompensas?.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-light">Recompensas</h2>
              <ul className="mt-4 space-y-2">
                {c.recompensas.map((r) => (
                  <li key={r.id} className="rounded-xl bg-white px-5 py-4 shadow-sm">
                    <p className="font-medium">
                      {r.titulo} · desde {clp(r.monto_minimo)}
                    </p>
                    <p className="mt-1 text-sm text-tinta/60">{r.descripcion}</p>
                    {r.stock != null && (
                      <p className="mt-1 text-xs text-tinta/50">Disponibles: {r.stock}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-1 text-sm text-tinta/60">{visible ? 'Gracias por apoyar. Este avance es solo para ti.' : 'Apoya el proyecto para ver páginas del siguiente capítulo.'}</p>
          <div className="relative mt-4">
            <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${visible ? '' : 'pointer-events-none blur-md select-none'}`}>
              {tiles.map((t, i) => t
                ? <img key={i} src={t} alt={`Avance, página ${i + 1}`} className="aspect-[3/4] w-full rounded-xl object-cover" />
                : <div key={i} className={`aspect-[3/4] rounded-xl bg-linear-to-br ${c.bg}`} />)}
            </div>
            {!visible && <p className="absolute inset-0 grid place-items-center text-center text-lg">Apoya para desbloquear</p>}
          </div>
        </div>




        <aside className="h-fit rounded-3xl bg-white p-7 shadow-xl shadow-tinta/10">
          <p className="text-2xl">{clp(c.recaudado)} <span className="text-sm text-tinta/50">de {clp(c.meta)}</span></p>
          <div className="mt-3 h-2.5 rounded-full bg-crema" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-violeta" style={{ width: Math.min(pct, 100) + '%' }} />
          </div>
          <p className="mt-2 text-xs text-tinta/50">{pct}% · {c.apoyos} personas apoyaron</p>
          {mio ? (
            <div className="mt-6 space-y-3">
              <Boton onClick={subir} className="w-full">Subir capítulo</Boton>
              <p className="text-xs text-tinta/50">Esta es tu obra. Los lectores verán el capítulo en la lista.</p>
            </div>
          ) : (
            <div className="mt-6">
              {aporte > 0 && <p className="mb-3 rounded-xl bg-lima px-4 py-2.5 text-sm">Apoyaste con {clp(aporte)}. Ya puedes ver el avance.</p>}
              <div className="flex gap-2">{[12, 25, 50].map((m) => <button key={m} onClick={() => setMonto(m)} className={chip(monto === m)}>{clp(m)}</button>)}</div>
              <label className="mt-3 block text-sm text-tinta/60">Otro monto
                <input type="number" min="1" value={monto} onChange={(e) => setMonto(e.target.value)} className={`${campo} mt-1 bg-crema`} />
              </label>
              <Boton className="mt-4 w-full" onClick={() => (user ? Number(monto) > 0 && apoyar(c.id, Number(monto)) : nav('/login'))}>
                {user ? 'Apoyar proyecto' : 'Inicia sesión para apoyar'}
              </Boton>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}


export function Publicar() {
  const { user, addComic, etiquetas } = useStore()
  const nav = useNavigate()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const [f, setF] = useState({
    titulo: '',
    autor: '',
    descripcion: '',
    numero_paginas: '',
    generos: [],
    meta: 5000,
    dias: 30,
    formato: 'Digital + Físico',
  })

  // 👇 ahora guardamos los File reales
  const [portadaFile, setPortadaFile] = useState(null)
  const [portadaPreview, setPortadaPreview] = useState('')

  if (!user) return <Navigate to="/login" replace />

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const alternar = (g) =>
    setF({
      ...f,
      generos: f.generos.includes(g)
        ? f.generos.filter((x) => x !== g)
        : [...f.generos, g],
    })

  const onPortada = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPortadaFile(file)
    setPortadaPreview(URL.createObjectURL(file))
  }

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      const nuevoId = await addComic(
        {
          ...f,
          meta: Number(f.meta),
          dias: Number(f.dias),
          numero_paginas: Number(f.numero_paginas) || 0,
          generos: f.generos.length ? f.generos : ['Aventura'],
        },
        portadaFile,
      )
      nav('/comic/' + nuevoId)
    } catch (err) {
      const mensaje =
        err.errores && typeof err.errores === 'object'
          ? Object.entries(err.errores)
              .map(([c, m]) => `${c}: ${Array.isArray(m) ? m.join(' ') : m}`)
              .join(' · ')
          : 'Error al publicar el cómic'
      setError(mensaje)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-6 pb-24">
      <Link to="/creadores" className="text-sm text-violeta">
        ← Volver al panel
      </Link>

      <h1 className="mt-4 text-4xl font-light md:text-5xl">Publica tu cómic</h1>
      <p className="mt-3 text-tinta/60">
        Completa los datos. Después podrás agregar capítulos y niveles de recompensa.
      </p>

      <form onSubmit={enviar} className="mt-8 space-y-6">
        <label className="block">
          Título
          <input required value={f.titulo} onChange={set('titulo')} className={`${campo} mt-1`} />
        </label>

        <label className="block">
          Autor o autores
          <input
            value={f.autor}
            onChange={set('autor')}
            placeholder="Tu nombre, un seudónimo o varios separados por coma"
            className={`${campo} mt-1`}
          />
          <span className="text-xs text-tinta/50">
            Si lo dejas vacío se usa el nombre de tu cuenta.
          </span>
        </label>

        <label className="block">
          Descripción / Sinopsis
          <textarea
            required
            rows={4}
            value={f.descripcion}
            onChange={set('descripcion')}
            className={`${campo} mt-1`}
          />
        </label>

        <label className="block">
          Número de páginas
          <input
            type="number"
            min="1"
            value={f.numero_paginas}
            onChange={set('numero_paginas')}
            className={`${campo} mt-1`}
          />
        </label>

        <div>
          <p>Géneros</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {etiquetas.map((e) => (
              <button
                type="button"
                key={e.id}
                onClick={() => alternar(e.nombre)}
                className={chip(f.generos.includes(e.nombre))}
              >
                {e.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block">
            Meta (CLP)
            <input type="number" min="1" required value={f.meta} onChange={set('meta')} className={`${campo} mt-1`} />
          </label>
          <label className="block">
            Días de campaña
            <input type="number" min="1" required value={f.dias} onChange={set('dias')} className={`${campo} mt-1`} />
          </label>
          <label className="block">
            Formato
            <select value={f.formato} onChange={set('formato')} className={`${campo} mt-1`}>
              <option>Digital + Físico</option>
              <option>Solo digital</option>
              <option>Solo físico</option>
            </select>
          </label>
        </div>

        {/* 👇 Cambio: guardamos el File, no base64 */}
        <label className="block">
          Portada
          <input type="file" accept="image/*" onChange={onPortada} className="mt-1 block text-sm" />
          {portadaPreview && (
            <img src={portadaPreview} alt="Preview" className="mt-3 h-40 rounded-lg object-cover" />
          )}
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-coral/20 px-4 py-3 text-sm text-coral">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Boton type="submit" disabled={enviando}>
            {enviando ? 'Publicando…' : 'Publicar cómic'}
          </Boton>
          <Link to="/creadores" className="text-sm text-tinta/60 hover:text-violeta">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}

export function Login() {
  const [params] = useSearchParams()
  const [registro, setRegistro] = useState(params.get('modo') === 'registro')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login, etiquetas } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState({
    nombre: '', email: '', password: '', password2: '',
    edad: '', leidos: [], generos: [],
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const alternar = (g) =>
    setF({
      ...f,
      generos: f.generos.includes(g)
        ? f.generos.filter((x) => x !== g)
        : [...f.generos, g],
    })

  const enviar = async (e) => {
    e.preventDefault()
    setError('')

    if (registro && f.password !== f.password2) {
      return setError('Las contraseñas no coinciden')
    }

    setCargando(true)

    try {
      if (registro) {
        // 1) Registro → devuelve tokens y usuario
        await registrarUsuario({
          email: f.email,
          password: f.password,
          nickname: f.nombre,
          edad: Number(f.edad) || null,
          es_creador: false,
          gustos: f.generos,      
          comics_leidos: f.leidos,
        })
        // 2) Restaurar user en el store desde /me
        //    (registrarUsuario ya guardó tokens; fetchMe los usa)
        //    El store lo hará solo, pero para asegurar recargamos:
        window.location.href = '/explorar'
        return
      } else {
        // Login real
        await login(f.email, f.password)
        nav('/explorar')
      }
    } catch (err) {
      let mensaje = 'Error desconocido'
      if (err.errores) {
        if (typeof err.errores === 'object' && !Array.isArray(err.errores)) {
          mensaje = Object.entries(err.errores)
            .map(([campo, msgs]) =>
              `${campo}: ${Array.isArray(msgs) ? msgs.join(' ') : msgs}`
            )
            .join(' · ')
        } else {
          mensaje = String(err.errores)
        }
      } else if (err.message) {
        mensaje = err.message
      }
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className={`mx-auto px-6 pb-24 ${registro ? 'max-w-3xl' : 'max-w-md'}`}>
      <h1 className="text-4xl font-light">
        {registro ? 'Crea tu cuenta' : 'Inicia sesión'}
      </h1>
      <form onSubmit={enviar} className="mt-8 space-y-5">
        {registro && (
          <label className="block">
            Nombre
            <input
              required
              value={f.nombre}
              onChange={set('nombre')}
              className={`${campo} mt-1`}
            />
          </label>
        )}
        {registro && (
          <label className="block">
            Edad
            <input
              type="number"
              required
              min="1"
              max="120"
              value={f.edad}
              onChange={set('edad')}
              className={`${campo} mt-1`}
            />
          </label>
        )}
        <label className="block">
          Correo
          <input
            type="email"
            required
            value={f.email}
            onChange={set('email')}
            className={`${campo} mt-1`}
          />
        </label>
        <label className="block">
          Contraseña
          <input
            type="password"
            required
            value={f.password}
            onChange={set('password')}
            className={`${campo} mt-1`}
          />
        </label>
        {registro && (
          <label className="block">
            Confirmar contraseña
            <input
              type="password"
              required
              value={f.password2}
              onChange={set('password2')}
              className={`${campo} mt-1`}
            />
          </label>
        )}
        {registro && (
          <>
            <div>
              <p>¿Qué tipo de historias te gustan?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {etiquetas.map((e) => (
                  <button
                    type="button"
                    key={e.id}
                    onClick={() => alternar(e.nombre)}
                    className={chip(f.generos.includes(e.nombre))}
                  >
                    {e.nombre}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p>Cómics que ya leíste</p>
              <SelectorComics
                seleccion={f.leidos}
                onChange={(leidos) => setF({ ...f, leidos })}
              />
            </div>
            <p className="text-xs text-tinta/50">
              El asistente IA usa esto para recomendarte obras.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-coral">
            {error}
          </p>
        )}
        <Boton type="submit" className="w-full" disabled={cargando}>
          {cargando
            ? 'Procesando…'
            : registro
            ? 'Crear cuenta'
            : 'Entrar'}
        </Boton>
      </form>
      <button
        onClick={() => {
          setRegistro(!registro)
          setError('')
        }}
        className="mt-5 text-sm text-violeta"
      >
        {registro ? 'Ya tengo cuenta' : 'Crear una cuenta nueva'}
      </button>
      <p className="mt-6 text-xs text-tinta/50">
        {registro
          ? 'Crea tu cuenta real para guardar tus gustos.'
          : 'Acceso de prueba: aún no hay backend, los datos quedan en tu navegador.'}
      </p>
    </section>
  )
}


export function PanelCreador() {
  const { user, comics, cargandoComics } = useStore()

  if (!user) return <Navigate to="/login" replace />
  if (cargandoComics) {
    return <p className="mx-auto max-w-7xl px-6 py-24 md:px-20">Cargando…</p>
  }

  // Cómics del usuario: por creador local (front) o por autores del back
  const misComics = comics.filter((c) => {
    if (c.creador && c.creador === user.email) return true
    if (c.autores?.some((a) => a.username === user.username)) return true
    return false
  })

  // ───────────────────────────── EMPTY STATE ─────────────────────────────
  if (!misComics.length) {
    return (
      <section className="mx-auto max-w-4xl px-6 pb-24 md:px-20">
        <div className="mt-16 rounded-3xl bg-white p-10 text-center shadow-xl shadow-tinta/10 md:p-16">
          <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-lima text-3xl text-tinta">
            ✎
          </div>
          <h1 className="mt-8 text-4xl font-light md:text-5xl">
            Aún no has publicado ningún cómic
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-tinta/60">
            Es el momento perfecto para compartir tu primera historia. Publica tu primer
            capítulo, define tu meta y deja que los lectores te descubran.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Boton to="/publicar">Publicar mi primer cómic</Boton>
            <Boton variante="blanco" to="/explorar">Explorar otros cómics</Boton>
          </div>
        </div>
      </section>
    )
  }

  // ───────────────────────────── DASHBOARD ─────────────────────────────
  const totalRecaudado = misComics.reduce((s, c) => s + c.recaudado, 0)
  const totalApoyos = misComics.reduce((s, c) => s + c.apoyos, 0)
  const activos = misComics.filter((c) => c.estado === 'En campaña').length

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 md:px-20">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs text-coral">Panel de creador</p>
          <h1 className="mt-2 text-4xl font-light md:text-5xl">Mis cómics</h1>
          <p className="mt-2 text-tinta/60">
            {misComics.length} cómic{misComics.length > 1 ? 's' : ''} publicado
            {misComics.length > 1 ? 's' : ''}
          </p>
        </div>
        <Boton to="/publicar">Publicar nuevo cómic</Boton>
      </div>

      {/* Stats globales */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-tinta/5">
          <p className="text-sm text-tinta/50">Total recaudado</p>
          <p className="mt-2 text-3xl font-light">{clp(totalRecaudado)}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-tinta/5">
          <p className="text-sm text-tinta/50">Personas apoyando</p>
          <p className="mt-2 text-3xl font-light">{totalApoyos}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-tinta/5">
          <p className="text-sm text-tinta/50">Cómics activos</p>
          <p className="mt-2 text-3xl font-light">{activos}</p>
        </div>
      </div>

      {/* Lista */}
      <h2 className="mt-16 text-2xl font-light">Tus publicaciones</h2>
      <div className="mt-6 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
        {misComics.map((c) => (
          <div key={c.id}>
            <ComicCard c={c} to={`/creadores/comic/${c.id}`} />
          </div>
        ))}
      </div>
    </section>
  )
}



export function Perfil() {
  const { user, comics, etiquetas, aporteDe, actualizarPerfil } = useStore()
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [editandoNick, setEditandoNick] = useState(false)
  const [nickForm, setNickForm] = useState('')

  if (!user) return <Navigate to="/login" replace />

  const generos = user.generos || []
  const leidos = user.leidos || []
  const apoyados = comics.filter((c) => aporteDe(c.id) > 0)

  // ─── Handlers ───

  const guardarCambios = async (parcial) => {
    setGuardando(true)
    setMensaje('')
    try {
      await actualizarPerfil(parcial)
      setMensaje('Guardado ✓')
      setTimeout(() => setMensaje(''), 1500)
    } catch (err) {
      console.error('[actualizar perfil]', err)
      const msg =
        err.errores && typeof err.errores === 'object'
          ? Object.values(err.errores).flat().join(' · ')
          : 'Error al guardar.'
      setMensaje(msg)
    } finally {
      setGuardando(false)
    }
  }

  const alternarGenero = (g) => {
    const nuevos = generos.includes(g)
      ? generos.filter((x) => x !== g)
      : [...generos, g]
    guardarCambios({ generos: nuevos })
  }

  const actualizarLeidos = (leidos) => {
    guardarCambios({ leidos })
  }

  const iniciarEdicionNick = () => {
    setNickForm(user.nickname || user.nombre || '')
    setEditandoNick(true)
  }

  const guardarNick = async (e) => {
    e.preventDefault()
    await guardarCambios({ nickname: nickForm })
    setEditandoNick(false)
  }

  // ─── JSX ───

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 md:px-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light md:text-5xl">
            Hola, {user.nombre || user.username}
          </h1>
          <p className="mt-2 text-tinta/60">{user.email}</p>
        </div>
        {guardando && (
          <span className="text-sm text-violeta">Guardando…</span>
        )}
        {mensaje && !guardando && (
          <span
            className={`text-sm ${
              mensaje.includes('Error') ? 'text-coral' : 'text-lima'
            }`}
          >
            {mensaje}
          </span>
        )}
      </div>

      {/* Nickname */}
      <h2 className="mt-12 text-2xl font-light">Tu nickname</h2>
      {editandoNick ? (
        <form onSubmit={guardarNick} className="mt-3 flex max-w-md gap-2">
          <input
            required
            value={nickForm}
            onChange={(e) => setNickForm(e.target.value)}
            className={campo}
          />
          <Boton type="submit" className="py-2" disabled={guardando}>
            Guardar
          </Boton>
          <button
            type="button"
            onClick={() => setEditandoNick(false)}
            className="text-sm text-tinta/60"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <p className="mt-3 flex items-center gap-3">
          <span>{user.nombre || user.username}</span>
          <button
            onClick={iniciarEdicionNick}
            className="text-sm text-violeta hover:underline"
          >
            Editar
          </button>
        </p>
      )}

      {/* Géneros */}
      <h2 className="mt-12 text-2xl font-light">Tus géneros</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {etiquetas.map((e) => (
          <button
            key={e.id}
            onClick={() => alternarGenero(e.nombre)}
            disabled={guardando}
            className={chip(generos.includes(e.nombre))}
          >
            {e.nombre}
          </button>
        ))}
      </div>

      {/* Leídos */}
      <h2 className="mt-12 text-2xl font-light">Cómics que has leído</h2>
      <p className="mt-1 text-sm text-tinta/60">
        Agrega los que vayas leyendo. El asistente IA los usa para recomendarte.
      </p>
      <div className="max-w-3xl">
        <SelectorComics seleccion={leidos} onChange={actualizarLeidos} />
      </div>

      {/* Apoyados */}
      <h2 className="mt-12 text-2xl font-light">Cómics que apoyaste</h2>
      {apoyados.length ? (
        <div className="mt-6 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {apoyados.map((c) => (
            <div key={c.id}>
              <ComicCard c={c} />
              <p className="mt-2 text-sm text-violeta">
                Aportaste {clp(aporteDe(c.id))}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4">
          Aún no apoyas ningún cómic.{' '}
          <Link to="/explorar" className="text-violeta">
            Explorar cómics
          </Link>
        </p>
      )}
    </section>
  )
}

export function PanelComic() {
  const { id } = useParams()
  const { user, comics, recargarComic, etiquetas  } = useStore()
  const nav = useNavigate()

  const comic = comics.find((c) => String(c.id) === id)

  // Estados para capítulo
  const [capForm, setCapForm] = useState({ titulo: '', contenido: '', es_gratis: true })
  const [capEnviando, setCapEnviando] = useState(false)
  const [capError, setCapError] = useState('')

  //  edición inline
  const [capEditandoId, setCapEditandoId] = useState(null)
  const [capEditForm, setCapEditForm] = useState({ titulo: '', contenido: '', es_gratis: true })

  // Estados para recompensa
  const [recForm, setRecForm] = useState({ titulo: '', descripcion: '', monto_minimo: 5000, stock: '' })
  const [recEnviando, setRecEnviando] = useState(false)
  const [recError, setRecError] = useState('')

  //  edición inline
  const [recEditandoId, setRecEditandoId] = useState(null)
  const [recEditForm, setRecEditForm] = useState({ titulo: '', descripcion: '', monto_minimo: 5000, stock: '' })


  // Estados para editar el cómic completo
  const [editandoComic, setEditandoComic] = useState(false)
  const [comicForm, setComicForm] = useState(null)
  const [portadaFile, setPortadaFile] = useState(null)
  const [portadaPreview, setPortadaPreview] = useState('')
  const [comicError, setComicError] = useState('')
  const [comicEnviando, setComicEnviando] = useState(false)


  if (!user) return <Navigate to="/login" replace />
  if (!comic) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-24 md:px-20">
        <p>
          No encontramos este cómic.{' '}
          <Link to="/creadores" className="text-violeta">Volver al panel</Link>
        </p>
      </section>
    )
  }

  // Verificar autoría
  const esAutor =
    comic.creador === user.email ||
    comic.autores?.some((a) => a.username === user.username)

  if (!esAutor) return <Navigate to={`/comic/${id}`} replace />

  const agregarCapitulo = async (e) => {
    e.preventDefault()
    setCapError('')
    setCapEnviando(true)

    // 1) Crear el capítulo
    try {
      await crearCapitulo(comic.id, {
        titulo: capForm.titulo,
        contenido: capForm.contenido,
        es_gratis: capForm.es_gratis,
        fecha_publicacion: new Date().toISOString(),
      })
    } catch (err) {
      console.error('[crearCapitulo]', err)
      setCapError('Error al crear el capítulo.')
      setCapEnviando(false)
      return
    }

    // 2) Refrescar la lista (si falla, no es crítico)
    try {
      await recargarComic(comic.id)
    } catch (err) {
      console.error('[recargarComic después de capítulo]', err)
      // No mostramos error: el capítulo YA se creó.
    }

    setCapForm({ titulo: '', contenido: '', es_gratis: true })
    setCapEnviando(false)
  }

  const agregarRecompensa = async (e) => {
    e.preventDefault()
    setRecError('')
    setRecEnviando(true)

    try {
      const datos = {
        titulo: recForm.titulo,
        descripcion: recForm.descripcion,
        monto_minimo: Number(recForm.monto_minimo),
        orden: comic.recompensas?.length ?? 0,
      }
      if (recForm.stock) datos.stock = Number(recForm.stock)

      await crearRecompensa(comic.id, datos)
    } catch (err) {
      console.error('[crearRecompensa]', err)
      setRecError('Error al crear la recompensa.')
      setRecEnviando(false)
      return
    }

    try {
      await recargarComic(comic.id)
    } catch (err) {
      console.error('[recargarComic después de recompensa]', err)
    }

    setRecForm({ titulo: '', descripcion: '', monto_minimo: 5000, stock: '' })
    setRecEnviando(false)
  }

  const pct = comic.meta ? Math.round((comic.recaudado / comic.meta) * 100) : 0

  // ─── Handlers de edición de capítulos ───

  const iniciarEdicionCap = (k) => {
    setCapEditandoId(k.id)
    setCapEditForm({
      titulo: k.titulo,
      contenido: k.contenido || '',
      es_gratis: k.es_gratis ?? true,
    })
  }

  const guardarEdicionCap = async (e) => {
    e.preventDefault()
    try {
      await actualizarCapitulo(capEditandoId, {
        titulo: capEditForm.titulo,
        contenido: capEditForm.contenido,
        es_gratis: capEditForm.es_gratis,
      })
      await recargarComic(comic.id)
      setCapEditandoId(null)
    } catch (err) {
      console.error('[editar capítulo]', err)
      alert('Error al guardar el capítulo.')
    }
  }

  const eliminarCapitulo = async (k) => {
    if (!window.confirm(`¿Eliminar el capítulo "${k.titulo}"?`)) return
    try {
      await eliminarCapituloApi(k.id)
      await recargarComic(comic.id)
    } catch (err) {
      console.error('[eliminar capítulo]', err)
      alert('Error al eliminar el capítulo.')
    }
  }

  // ─── Handlers de edición de recompensas ───

  const iniciarEdicionRec = (r) => {
    setRecEditandoId(r.id)
    setRecEditForm({
      titulo: r.titulo,
      descripcion: r.descripcion,
      monto_minimo: r.monto_minimo,
      stock: r.stock ?? '',
    })
  }

  const guardarEdicionRec = async (e) => {
    e.preventDefault()
    try {
      const datos = {
        titulo: recEditForm.titulo,
        descripcion: recEditForm.descripcion,
        monto_minimo: Number(recEditForm.monto_minimo),
      }
      // stock: vacío → null, número → int
      datos.stock = recEditForm.stock === '' ? null : Number(recEditForm.stock)

      await actualizarRecompensa(recEditandoId, datos)
      await recargarComic(comic.id)
      setRecEditandoId(null)
    } catch (err) {
      console.error('[editar recompensa]', err)
      alert('Error al guardar la recompensa.')
    }
  }

  const eliminarRecompensa = async (r) => {
    if (!window.confirm(`¿Eliminar la recompensa "${r.titulo}"?`)) return
    try {
      await eliminarRecompensaApi(r.id)
      await recargarComic(comic.id)
    } catch (err) {
      console.error('[eliminar recompensa]', err)
      alert('Error al eliminar la recompensa.')
    }
  }

  // ─── Handlers de edición de Comic ───

  const iniciarEdicionComic = () => {
    setComicForm({
      titulo: comic.titulo,
      descripcion: comic.descripcion,
      numero_paginas: comic.numeroPaginas || '',
      meta: comic.meta,
      generos: comic.generos || [],
      estado: comic.estado_raw || 'borrador',
      crowdfunding_activo: comic.crowdfundingActivo ?? false,
    })
    setPortadaFile(null)
    setPortadaPreview(comic.img || '')
    setComicError('')
    setEditandoComic(true)
  }

  const cancelarEdicionComic = () => {
    setEditandoComic(false)
    setComicForm(null)
    setPortadaFile(null)
    setPortadaPreview('')
    setComicError('')
  }

  const alternarGeneroComic = (g) => {
    setComicForm({
      ...comicForm,
      generos: comicForm.generos.includes(g)
        ? comicForm.generos.filter((x) => x !== g)
        : [...comicForm.generos, g],
    })
  }

  const onPortadaComic = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPortadaFile(file)
    setPortadaPreview(URL.createObjectURL(file))
  }

  const guardarComic = async (e) => {
    e.preventDefault()
    setComicError('')
    setComicEnviando(true)

    try {
      await actualizarComic(
        comic.id,
        {
          titulo: comicForm.titulo,
          descripcion: comicForm.descripcion,
          numero_paginas: Number(comicForm.numero_paginas) || 0,
          meta: Number(comicForm.meta),
          generos: comicForm.generos,
          estado: comicForm.estado,
          crowdfunding_activo: comicForm.crowdfunding_activo,
        },
        portadaFile,
      )

      await recargarComic(comic.id)
      setEditandoComic(false)
      setComicForm(null)
      setPortadaFile(null)
      setPortadaPreview('')
    } catch (err) {
      console.error('[editar comic]', err)
      const mensaje =
        err.errores && typeof err.errores === 'object'
          ? Object.entries(err.errores)
              .map(([c, m]) => `${c}: ${Array.isArray(m) ? m.join(' ') : m}`)
              .join(' · ')
          : 'Error al guardar los cambios.'
      setComicError(mensaje)
    } finally {
      setComicEnviando(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-6 pb-24 md:px-20">
      <Link to="/creadores" className="text-sm text-violeta">← Volver al panel</Link>

      {/* ─────────────── HEADER ─────────────── */}
      <div className="mt-6 flex flex-wrap gap-6">
        <Portada
          bg={comic.bg}
          img={comic.img}
          titulo={comic.titulo}
          className="aspect-[3/4] w-40 shrink-0 rounded-2xl shadow-lg"
        />
        <div className="flex-1 min-w-[260px]">
          <span className="inline-block rounded-full bg-violeta/15 px-3 py-1 text-xs text-violeta">
            {comic.estado}
          </span>
          <h1 className="mt-3 text-3xl font-light md:text-4xl">{comic.titulo}</h1>
          <p className="mt-1 text-sm text-tinta/60">{comic.autor}</p>

          <div className="mt-4 flex flex-wrap gap-5 text-sm">
            <span>{clp(comic.recaudado)} / {clp(comic.meta)}</span>
            <span className="text-tinta/60">({pct}%)</span>
            <span>{comic.apoyos} apoyos</span>
            {comic.valoracion > 0 && <span>⭐ {comic.valoracion}</span>}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to={`/comic/${comic.id}`}
              className="rounded-full bg-white px-4 py-2 text-sm hover:bg-cream"
            >
              Ver página pública
            </Link>
            {!editandoComic && (
              <button
                onClick={iniciarEdicionComic}
                className="rounded-full bg-violeta px-4 py-2 text-sm text-white hover:bg-violeta/90"
              >
                Editar cómic
              </button>
            )}
          </div>
        </div>

        {/* ─────────────── FORM DE EDICIÓN ─────────────── */}
        {editandoComic && comicForm && (
          <form
            onSubmit={guardarComic}
            className="mt-10 rounded-2xl bg-white p-6 shadow-lg space-y-4"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-light">Editar cómic</h2>
              <button
                type="button"
                onClick={cancelarEdicionComic}
                className="text-sm text-tinta/60 hover:text-violeta"
              >
                Cancelar
              </button>
            </div>

            <label className="block">
              Título
              <input
                required
                value={comicForm.titulo}
                onChange={(e) => setComicForm({ ...comicForm, titulo: e.target.value })}
                className={`${campo} mt-1`}
              />
            </label>

            <label className="block">
              Sinopsis
              <textarea
                required
                rows={4}
                value={comicForm.descripcion}
                onChange={(e) => setComicForm({ ...comicForm, descripcion: e.target.value })}
                className={`${campo} mt-1`}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                Número de páginas
                <input
                  type="number"
                  min="0"
                  value={comicForm.numero_paginas}
                  onChange={(e) =>
                    setComicForm({ ...comicForm, numero_paginas: e.target.value })
                  }
                  className={`${campo} mt-1`}
                />
              </label>
              <label className="block">
                Meta (CLP)
                <input
                  type="number"
                  min="1"
                  required
                  value={comicForm.meta}
                  onChange={(e) => setComicForm({ ...comicForm, meta: e.target.value })}
                  className={`${campo} mt-1`}
                />
              </label>
              <label className="block">
                Estado
                <select
                  value={comicForm.estado}
                  onChange={(e) => setComicForm({ ...comicForm, estado: e.target.value })}
                  className={`${campo} mt-1`}
                >
                  <option value="borrador">Borrador</option>
                  <option value="en_campana">En campaña</option>
                  <option value="publicado">Publicado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </label>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={comicForm.crowdfunding_activo}
                onChange={(e) =>
                  setComicForm({ ...comicForm, crowdfunding_activo: e.target.checked })
                }
              />
              Crowdfunding activo (acepta donaciones)
            </label>

            <div>
              <p>Géneros</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {etiquetas.map((e) => (
                  <button
                    type="button"
                    key={e.id}
                    onClick={() => alternarGeneroComic(e.nombre)}
                    className={chip(comicForm.generos.includes(e.nombre))}
                  >
                    {e.nombre}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              Portada (dejar vacío para conservar la actual)
              <input
                type="file"
                accept="image/*"
                onChange={onPortadaComic}
                className="mt-1 block text-sm"
              />
              {portadaPreview && (
                <img
                  src={portadaPreview}
                  alt="Preview"
                  className="mt-3 h-40 rounded-lg object-cover"
                />
              )}
            </label>

            {comicError && (
              <p role="alert" className="rounded-lg bg-coral/20 px-4 py-3 text-sm text-coral">
                {comicError}
              </p>
            )}

            <div className="flex gap-3">
              <Boton type="submit" disabled={comicEnviando}>
                {comicEnviando ? 'Guardando…' : 'Guardar cambios'}
              </Boton>
              <button
                type="button"
                onClick={cancelarEdicionComic}
                className="text-sm text-tinta/60 hover:text-violeta"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

      </div>

      {/* ─────────────── CAPÍTULOS ─────────────── */}
      <div className="mt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-light">Capítulos</h2>
          <span className="text-sm text-tinta/50">
            {comic.capitulos?.length ?? 0} publicados
          </span>
        </div>

        {comic.capitulos?.length ? (
          <ul className="mt-4 space-y-2">
            {comic.capitulos.map((k) => (
              <li key={k.id || k.n} className="rounded-xl bg-white shadow-sm">
                {capEditandoId === k.id ? (
                  // ─── MODO EDICIÓN ───
                  <form onSubmit={guardarEdicionCap} className="p-5 space-y-3">
                    <label className="block">
                      Título
                      <input
                        required
                        value={capEditForm.titulo}
                        onChange={(e) => setCapEditForm({ ...capEditForm, titulo: e.target.value })}
                        className={`${campo} mt-1`}
                      />
                    </label>
                    <label className="block">
                      Contenido
                      <textarea
                        required
                        rows={4}
                        value={capEditForm.contenido}
                        onChange={(e) => setCapEditForm({ ...capEditForm, contenido: e.target.value })}
                        className={`${campo} mt-1`}
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={capEditForm.es_gratis}
                        onChange={(e) => setCapEditForm({ ...capEditForm, es_gratis: e.target.checked })}
                      />
                      Es gratis
                    </label>
                    <div className="flex gap-3">
                      <Boton type="submit" className="py-2">Guardar</Boton>
                      <button
                        type="button"
                        onClick={() => setCapEditandoId(null)}
                        className="text-sm text-tinta/60 hover:text-violeta"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  // ─── MODO LECTURA ───
                  <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                    <span>
                      <span className="text-tinta/50">Cap. {k.n} ·</span> {k.titulo}
                    </span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-tinta/50">
                        {k.es_gratis ? 'Gratis' : 'Pago'} · {k.fecha || 'sin fecha'}
                      </span>
                      <button
                        onClick={() => iniciarEdicionCap(k)}
                        className="text-violeta hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarCapitulo(k)}
                        className="text-coral hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-tinta/60">Aún no has publicado capítulos.</p>
        )}

        <form onSubmit={agregarCapitulo} className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-light">Agregar capítulo</h3>
          <div className="mt-4 space-y-4">
            <label className="block">
              Título
              <input
                required
                value={capForm.titulo}
                onChange={(e) => setCapForm({ ...capForm, titulo: e.target.value })}
                className={`${campo} mt-1`}
                placeholder="Ej: El comienzo"
              />
            </label>
            <label className="block">
              Contenido
              <textarea
                required
                rows={4}
                value={capForm.contenido}
                onChange={(e) => setCapForm({ ...capForm, contenido: e.target.value })}
                className={`${campo} mt-1`}
                placeholder="Texto del capítulo…"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={capForm.es_gratis}
                onChange={(e) => setCapForm({ ...capForm, es_gratis: e.target.checked })}
              />
              Es gratis (visible para todos)
            </label>
            {capError && <p className="text-sm text-coral">{capError}</p>}
            <Boton type="submit" disabled={capEnviando}>
              {capEnviando ? 'Agregando…' : 'Agregar capítulo'}
            </Boton>
          </div>
        </form>
      </div>

      {/* ─────────────── RECOMPENSAS ─────────────── */}
      <div className="mt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-light">Niveles de recompensa</h2>
          <span className="text-sm text-tinta/50">
            {comic.recompensas?.length ?? 0} definidos
          </span>
        </div>

        {comic.recompensas?.length ? (
          <ul className="mt-4 space-y-2">
            {comic.recompensas.map((r) => (
              <li key={r.id} className="rounded-xl bg-white shadow-sm">
                {recEditandoId === r.id ? (
                  // ─── MODO EDICIÓN ───
                  <form onSubmit={guardarEdicionRec} className="p-5 space-y-3">
                    <label className="block">
                      Título
                      <input
                        required
                        value={recEditForm.titulo}
                        onChange={(e) => setRecEditForm({ ...recEditForm, titulo: e.target.value })}
                        className={`${campo} mt-1`}
                      />
                    </label>
                    <label className="block">
                      Descripción
                      <textarea
                        required
                        rows={2}
                        value={recEditForm.descripcion}
                        onChange={(e) => setRecEditForm({ ...recEditForm, descripcion: e.target.value })}
                        className={`${campo} mt-1`}
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        Monto mínimo (CLP)
                        <input
                          type="number"
                          min="1"
                          required
                          value={recEditForm.monto_minimo}
                          onChange={(e) => setRecEditForm({ ...recEditForm, monto_minimo: e.target.value })}
                          className={`${campo} mt-1`}
                        />
                      </label>
                      <label className="block">
                        Stock (opcional)
                        <input
                          type="number"
                          min="1"
                          value={recEditForm.stock}
                          onChange={(e) => setRecEditForm({ ...recEditForm, stock: e.target.value })}
                          className={`${campo} mt-1`}
                          placeholder="Sin límite si se deja vacío"
                        />
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <Boton type="submit" className="py-2">Guardar</Boton>
                      <button
                        type="button"
                        onClick={() => setRecEditandoId(null)}
                        className="text-sm text-tinta/60 hover:text-violeta"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  // ─── MODO LECTURA ───
                  <div className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {r.titulo} · desde {clp(r.monto_minimo)}
                        </p>
                        <p className="mt-1 text-sm text-tinta/60">{r.descripcion}</p>
                        {r.stock != null && (
                          <p className="mt-1 text-xs text-tinta/50">Stock: {r.stock}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <button
                          onClick={() => iniciarEdicionRec(r)}
                          className="text-violeta hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarRecompensa(r)}
                          className="text-coral hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-tinta/60">Aún no has definido recompensas.</p>
        )}

        <form onSubmit={agregarRecompensa} className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-light">Agregar recompensa</h3>
          <div className="mt-4 space-y-4">
            <label className="block">
              Título
              <input
                required
                value={recForm.titulo}
                onChange={(e) => setRecForm({ ...recForm, titulo: e.target.value })}
                className={`${campo} mt-1`}
                placeholder="Ej: Fan, Coleccionista"
              />
            </label>
            <label className="block">
              Descripción
              <textarea
                required
                rows={2}
                value={recForm.descripcion}
                onChange={(e) => setRecForm({ ...recForm, descripcion: e.target.value })}
                className={`${campo} mt-1`}
                placeholder="Qué incluye esta recompensa…"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                Monto mínimo (CLP)
                <input
                  type="number"
                  min="1"
                  required
                  value={recForm.monto_minimo}
                  onChange={(e) => setRecForm({ ...recForm, monto_minimo: e.target.value })}
                  className={`${campo} mt-1`}
                />
              </label>
              <label className="block">
                Stock (opcional)
                <input
                  type="number"
                  min="1"
                  value={recForm.stock}
                  onChange={(e) => setRecForm({ ...recForm, stock: e.target.value })}
                  className={`${campo} mt-1`}
                  placeholder="Sin límite si lo dejás vacío"
                />
              </label>
            </div>
            {recError && <p className="text-sm text-coral">{recError}</p>}
            <Boton type="submit" disabled={recEnviando}>
              {recEnviando ? 'Agregando…' : 'Agregar recompensa'}
            </Boton>
          </div>
        </form>
      </div>
    </section>
  )
}



