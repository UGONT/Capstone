import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { campana, BRAND, CATALOGO_LECTURA, colorDe } from './data'
import { useStore } from './store'

export const clp = (n) => '$' + n.toLocaleString('es-CL')

export function Boton({ children, variante = 'violeta', className = '', to, ...p }) {
  const estilos = {
    violeta: 'bg-violeta text-white hover:bg-violeta/90',
    blanco: 'bg-white text-tinta hover:bg-white/70',
    oscuro: 'bg-tinta text-white hover:bg-tinta/85',
  }
  const cls = `rounded-full px-6 py-3.5 text-[15px] font-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violeta ${estilos[variante]} ${className}`
  const contenido = <>{children} <span aria-hidden>↗</span></>
  return to
    ? <Link to={to} className={`inline-block ${cls}`}>{contenido}</Link>
    : <button className={cls} {...p}>{contenido}</button>
}

export function Portada({ bg, img, titulo, className = '' }) {
  return img
    ? <img src={img} alt={titulo} className={`object-cover ${className}`} />
    : <div role="img" aria-label={titulo} className={`bg-linear-to-br ${bg} ${className}`} />
}

export function Navbar() {
  const { user, logout } = useStore()
  const nav = useNavigate()
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-20">
      <Link to="/" className="flex items-center gap-3 text-xl tracking-wide">
        <span className="grid size-9 place-items-center rounded-lg bg-lima font-medium">{BRAND[0].toUpperCase()}</span>{BRAND}
      </Link>
      <nav className="hidden gap-9 text-[15px] md:flex">
        <Link to="/explorar" className="hover:text-violeta">Explorar</Link>
        <Link to="/explorar" className="hover:text-violeta">Campañas</Link>
        <Link to="/publicar" className="hover:text-violeta">Para creadores</Link>
      </nav>
      <div className="flex items-center gap-5">
        {user ? (
          <>
            <Link to="/perfil" className="hidden text-[15px] hover:text-violeta sm:block">Hola, {user.nombre}</Link>
            <button onClick={() => { logout(); nav('/') }} className="text-[15px] hover:text-violeta">Salir</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hidden text-[15px] sm:block">Iniciar sesión</Link>
            <Boton to="/login?modo=registro" className="py-3">Crear cuenta</Boton>
          </>
        )}
      </div>
    </header>
  )
}

export function Hero({ abrirIA }) {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-10 md:grid-cols-2 md:px-20">
      <div>
        <span className="inline-block rounded-full bg-violeta/15 px-3.5 py-2 text-xs text-violeta">Historias fuera del molde</span>
        <h1 className="mt-6 text-5xl leading-[1.02] font-light tracking-tight md:text-7xl">Tu próxima obsesión vive entre viñetas.</h1>
        <p className="mt-7 max-w-lg text-xl leading-relaxed font-light text-tinta/60">
          Descubre, lee y financia cómics independientes. Nuestro asistente IA encuentra la historia exacta que todavía no sabías cómo buscar.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Boton to="/explorar">Explorar cómics</Boton>
          <Boton variante="blanco" onClick={abrirIA}>Pregúntale a la IA</Boton>
        </div>
        <p className="mt-6 text-sm text-tinta/50">✦ 12.000 lectores · 480 creadores · 2.100 historias</p>
      </div>
      <div className="relative grid h-[520px] grid-cols-5 grid-rows-2 gap-3 overflow-hidden rounded-[2rem] bg-crema p-3 shadow-2xl shadow-tinta/15">
        <Portada bg="from-fuchsia-600 via-purple-700 to-orange-400" titulo="Selección de la semana" className="col-span-3 row-span-2 rounded-2xl" />
        <Portada bg="from-slate-800 to-red-900" titulo="Noir" className="col-span-2 rounded-xl" />
        <Portada bg="from-indigo-900 to-amber-400" titulo="Mitología" className="col-span-2 rounded-xl" />
        <span className="absolute left-6 top-6 rounded-full bg-lima px-4 py-2 text-xs">Selección de la semana</span>
        <div className="absolute bottom-6 right-6 rounded-2xl bg-white px-5 py-4 shadow-lg">
          <p className="text-[11px] text-violeta">Lectura piloto</p>
          <p className="mt-1 text-lg">El ruido de las estrellas</p>
          <p className="text-sm text-tinta/50">Capítulo 01 · 18 min</p>
        </div>
      </div>
    </section>
  )
}

export function Campana() {
  const pct = Math.round((campana.recaudado / campana.meta) * 100)
  return (
    <section id="campanas" className="mx-auto max-w-7xl px-6 pb-24 md:px-20">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs text-coral">Campañas en movimiento</p>
          <h2 className="mt-3 max-w-xl text-4xl leading-tight font-light md:text-5xl">Ayuda a imprimir el siguiente capítulo.</h2>
        </div>
        <Boton to="/explorar" variante="oscuro" className="max-sm:hidden">Ver campañas</Boton>
      </div>
      <div className="mt-10 grid overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-tinta/10 md:grid-cols-[1.1fr_1fr]">
        <div className="bg-[#e3d9bb] p-4"><Portada bg={campana.bg} titulo={campana.titulo} className="h-72 w-full md:h-full" /></div>
        <div className="p-8 md:p-12">
          <p className="flex items-center gap-2 text-xs text-coral"><span className="size-2 rounded-full bg-coral" />Campaña activa · {campana.dias} días</p>
          <h3 className="mt-5 text-4xl font-light">{campana.titulo}</h3>
          <p className="mt-4 text-[15px] leading-relaxed text-tinta/60">{campana.descripcion}</p>
          <div className="mt-6 flex items-baseline justify-between">
            <p className="text-xl">{clp(campana.recaudado)} recaudados</p>
            <p className="text-sm text-violeta">{pct}%</p>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-crema" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-violeta" style={{ width: Math.min(pct, 100) + '%' }} />
          </div>
          <p className="mt-2 text-xs text-tinta/50">Meta: {clp(campana.meta)} · {campana.apoyos} personas apoyaron</p>
          <div className="mt-7 flex items-center gap-5">
            <Boton to="/comic/4">Apoyar proyecto</Boton>
            <span className="text-xs text-tinta/50">Recompensas desde ${campana.desde}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ComicCard({ c }) {
  const pct = Math.round((c.recaudado / c.meta) * 100)
  return (
    <Link to={`/comic/${c.id}`} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violeta">
      <div className="relative">
        <Portada bg={c.bg} img={c.img} titulo={c.titulo} className="aspect-[4/5] w-full rounded-2xl shadow-lg shadow-tinta/10" />
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs">Piloto gratis</span>
      </div>
      <p className="mt-5 text-xs text-violeta">{c.generos[0]}</p>
      <h3 className="mt-1 text-2xl font-light">{c.titulo}</h3>
      <div className="mt-2 flex justify-between text-sm text-tinta/50"><span>por {c.autor}</span><span className="text-tinta">{c.formato}</span></div>
      <div className="mt-3 h-1.5 rounded-full bg-crema"><div className="h-full rounded-full bg-violeta" style={{ width: Math.min(pct, 100) + '%' }} /></div>
      <p className="mt-1.5 text-xs text-tinta/50">{pct}% de {clp(c.meta)}</p>
    </Link>
  )
}

export function Catalogo() {
  const { comics } = useStore()
  return (
    <section id="catalogo" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs text-coral">Descubre sin algoritmos aburridos</p>
            <h2 className="mt-3 max-w-2xl text-4xl leading-tight font-light md:text-5xl">Historias pequeñas. Mundos enormes.</h2>
          </div>
          <Link to="/explorar" className="hidden text-violeta sm:block">Ver catálogo completo →</Link>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {comics.slice(0, 3).map((c) => <ComicCard key={c.id} c={c} />)}
        </div>
      </div>
    </section>
  )
}

export function Creadores() {
  return (
    <section id="creadores" className="grid bg-lima md:grid-cols-2">
      <div className="min-h-72 bg-linear-to-br from-amber-800 to-stone-900" role="img" aria-label="Creador dibujando" />
      <div className="px-6 py-16 md:px-20 md:py-24">
        <p className="text-xs text-violeta">Hecho para quienes crean</p>
        <h2 className="mt-4 max-w-lg text-4xl leading-tight font-light md:text-5xl">Tu obra. Tu comunidad. Tus reglas.</h2>
        <p className="mt-6 max-w-md text-lg">Publica capítulos, conoce a tus lectores y convierte una idea en una edición real.</p>
        <ul className="mt-6 space-y-3 text-[15px]">
          {['Panel simple para publicar y administrar', 'Campañas con metas, plazos y recompensas', 'Datos de audiencia sin perder el vínculo humano'].map((t) => (
            <li key={t} className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-tinta text-[11px] text-white">✓</span>{t}</li>
          ))}
        </ul>
        <Boton to="/publicar" variante="oscuro" className="mt-8">Publica tu cómic</Boton>
      </div>
    </section>
  )
}

// Agente IA de prueba: responde con datos mock. Reemplaza `responder`
// por una llamada a tu backend cuando esté listo (no pongas API keys en el front).
function responder(texto, comics, user) {
  const buscar = (t) => comics.filter((c) => c.generos.some((g) => t.toLowerCase().includes(g.toLowerCase())))
  let obras = buscar(texto)
  let intro = 'Por lo que cuentas, estas te pueden gustar:'
  if (!obras.length && user?.generos?.length) { obras = buscar(user.generos.join(' ')); intro = 'Según los gustos de tu perfil, prueba con:' }
  if (!obras.length) { obras = comics; intro = 'No pillé un género claro, pero parte por estas:' }
  return { texto: intro, obras: obras.slice(0, 3) }
}

export function ChatIA({ abierto, setAbierto }) {
  const [msgs, setMsgs] = useState([{ rol: 'ia', texto: 'Hola, cuéntame qué tipo de historias te gustan y te recomiendo obras.' }])
  const [input, setInput] = useState('')
  const nav = useNavigate()
  const { comics, user } = useStore()

  const enviar = () => {
    if (!input.trim()) return
    setMsgs((m) => [...m, { rol: 'yo', texto: input }, { rol: 'ia', ...responder(input, comics, user) }])
    setInput('')
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {abierto && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-tinta/25">
          <div className="bg-violeta px-5 py-4 text-white">Asistente IA</div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={m.rol === 'yo' ? 'text-right' : ''}>
                <p className={`inline-block max-w-[85%] rounded-2xl px-4 py-2.5 text-left ${m.rol === 'yo' ? 'bg-lima' : 'bg-crema'}`}>{m.texto}</p>
                {m.obras?.map((o) => (
                  <div key={o.id} onClick={() => nav('/comic/' + o.id)} className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-tinta/10 p-2">
                    <div className={`size-12 shrink-0 rounded-lg bg-linear-to-br ${o.bg}`} />
                    <div><p>{o.titulo}</p><p className="text-xs text-tinta/50">{o.generos[0]} · {o.autor}</p></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-tinta/10 p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviar()}
              placeholder="Ej: ciencia ficción con ritmo lento" className="min-w-0 flex-1 rounded-full bg-crema px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violeta" />
            <button onClick={enviar} className="rounded-full bg-violeta px-4 text-white" aria-label="Enviar">↗</button>
          </div>
        </div>
      )}
      <button onClick={() => setAbierto(!abierto)} className="ml-auto block rounded-full bg-tinta px-6 py-3.5 text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violeta">
        {abierto ? 'Cerrar' : 'Pregúntale a la IA'}
      </button>
    </div>
  )
}

export function Footer() {
  const cols = {
    Plataforma: [['Explorar', '/explorar'], ['Campañas', '/explorar'], ['Asistente IA', '/']],
    Creadores: [['Publicar', '/publicar'], ['Financiamiento', '/publicar'], ['Recursos', '/publicar']],
    Comunidad: [['Manifiesto', '/'], ['Novedades', '/'], ['Contacto', '/']],
  }
  return (
    <footer className="bg-tinta text-white">
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-20">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div>
            <h2 className="max-w-xl text-4xl leading-tight font-light md:text-5xl">Hay una historia esperando encontrarte.</h2>
            <p className="mt-4 text-lg text-violet-200">Lee el primer capítulo. Apoya el próximo.</p>
          </div>
          <Link to="/explorar" className="rounded-full bg-lima px-7 py-4 text-tinta hover:bg-lima/90">Empieza a explorar <span aria-hidden>↗</span></Link>
        </div>
        <div className="mt-16 flex flex-wrap justify-between gap-10 border-t border-white/15 pt-12">
          <div className="max-w-xs">
            <p className="flex items-center gap-3 text-xl"><span className="grid size-9 place-items-center rounded-lg bg-lima font-medium text-tinta">{BRAND[0].toUpperCase()}</span>{BRAND}</p>
            <p className="mt-4 text-sm text-white/45">Cómics independientes, tecnología humana y comunidades que hacen posibles nuevas historias.</p>
          </div>
          <div className="flex gap-16 md:gap-28">
            {Object.entries(cols).map(([t, l]) => (
              <div key={t}>
                <p className="text-sm">{t}</p>
                <ul className="mt-3 space-y-2 text-sm text-white/45">
                  {l.map(([n, to]) => <li key={n}><Link to={to} className="hover:text-white">{n}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-wrap justify-between gap-3 text-xs text-white/40">
          <p>© 2026 {BRAND}. Historias con autor.</p>
          <p>Privacidad · Términos · Instagram · Discord</p>
        </div>
      </div>
    </footer>
  )
}

export function SelectorComics({ seleccion, onChange }) {
  const { comics } = useStore()
  const [q, setQ] = useState('')
  const todos = [...new Set([...CATALOGO_LECTURA, ...comics.map((c) => c.titulo), ...seleccion])]
  const lista = todos.filter((t) => t.toLowerCase().includes(q.toLowerCase()))
  const alternar = (t) => onChange(seleccion.includes(t) ? seleccion.filter((x) => x !== t) : [...seleccion, t])
  const nuevo = q.trim()
  return (
    <div className="mt-2">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca un cómic o escribe uno nuevo" aria-label="Buscar cómic"
        className="w-full rounded-xl bg-white px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-violeta" />
      {nuevo && !todos.some((t) => t.toLowerCase() === nuevo.toLowerCase()) && (
        <button type="button" onClick={() => { alternar(nuevo); setQ('') }} className="mt-2 text-sm text-violeta">Agregar «{nuevo}» a mi lista</button>
      )}
      <div className="mt-3 grid max-h-96 grid-cols-3 gap-3 overflow-y-auto rounded-2xl bg-tinta p-4 sm:grid-cols-4 md:grid-cols-5">
        {lista.map((t) => {
          const on = seleccion.includes(t)
          return (
            <button type="button" key={t} onClick={() => alternar(t)} aria-pressed={on}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg bg-linear-to-br ${colorDe(t)} p-2 text-left text-xs font-medium text-white transition ${on ? 'ring-4 ring-lima' : 'opacity-80 hover:opacity-100'}`}>
              {t}
              {on && <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-lima text-tinta">✓</span>}
            </button>
          )
        })}
        {!lista.length && <p className="col-span-full text-sm text-white/60">No hay resultados. Puedes agregarlo con el botón de arriba.</p>}
      </div>
      <p className="mt-2 text-sm text-tinta/60">{seleccion.length} seleccionados</p>
    </div>
  )
}
