import { useEffect, useState } from 'react'
import { BrowserRouter, Outlet, Route, Routes, useLocation, useOutletContext } from 'react-router-dom'
import { StoreProvider } from './store'
import { Navbar, Hero, Campana, Catalogo, Creadores, Footer, ChatIA } from './components'
import { Explorar, Detalle, Publicar, Login, Perfil } from './pages'

function Layout() {
  const [chat, setChat] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <>
      <Navbar />
      <main><Outlet context={{ abrirIA: () => setChat(true) }} /></main>
      <Footer />
      <ChatIA abierto={chat} setAbierto={setChat} />
    </>
  )
}

function Home() {
  const { abrirIA } = useOutletContext()
  return (<><Hero abrirIA={abrirIA} /><Campana /><Catalogo /><Creadores /></>)
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="explorar" element={<Explorar />} />
            <Route path="comic/:id" element={<Detalle />} />
            <Route path="publicar" element={<Publicar />} />
            <Route path="login" element={<Login />} />
            <Route path="perfil" element={<Perfil />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
