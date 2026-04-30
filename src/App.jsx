import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

import Header from './components/Header'
import Footer from './components/Footer'

import HomePage from './pages/HomePage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import MapPage from './pages/MapPage'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import PublicProfilePage from './pages/publicProfilePage'
import GaragePage from './pages/GaragePage'
import GarageDetailPage from './pages/GarageDetailPage'

/**Comentario prueba para subir el repositorio con los cambios*/
function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Comprobamos si hay sesión activa al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Escuchamos cambios de sesión (login / logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className='loading'>Cargando...</div>
  }

  return (
    <BrowserRouter>
      <div className='app'>
        <Header session={session} />
        <main className='main-content'>
          <Routes>
            <Route path='/' element={<HomePage session={session} />} />
            <Route path='/eventos' element={<EventsPage session={session} />} />
            <Route
              path='/eventos/:slug'
              element={<EventDetailPage session={session} />}
            />
            <Route
              path='/eventos/:id'
              element={<EventDetailPage session={session} />}
            />
            <Route path='/mapa' element={<MapPage session={session} />} />
            <Route path='/login' element={<AuthPage session={session} />} />
            <Route
              path='/perfil'
              element={
                session ? (
                  <ProfilePage session={session} />
                ) : (
                  <Navigate to='/login' />
                )
              }
            />
            <Route path='/usuario/:userId' element={<PublicProfilePage />} />
            <Route path='/garaje' element={<GaragePage session={session} />} />
            <Route
              path='/garaje/:id'
              element={<GarageDetailPage session={session} />}
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
