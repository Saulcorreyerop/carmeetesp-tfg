import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { LogOut, User, Menu, X } from 'lucide-react'
import { useState } from 'react'

const Header = ({ session }) => {
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className='header'>
      <div className='header-container'>
        {/* Logo */}
        <Link to='/' className='header-logo'>
          CarMeet <span>ESP</span>
        </Link>

        {/* Navegación escritorio */}
        <nav className='header-nav'>
          <Link to='/'>Inicio</Link>
          <Link to='/eventos'>Eventos</Link>
          <Link to='/mapa'>Mapa</Link>
          <Link to='/garaje'>Garaje</Link>
        </nav>

        {/* Acciones usuario */}
        <div className='header-actions'>
          {session ? (
            <>
              <Link to='/perfil' className='btn-icon' title='Mi perfil'>
                <User size={20} />
              </Link>
              <button
                onClick={handleLogout}
                className='btn-icon'
                title='Cerrar sesión'
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link to='/login' className='btn-primary'>
              Entrar
            </Link>
          )}
        </div>

        {/* Botón menú móvil */}
        <button
          className='header-menu-btn'
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {menuAbierto ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {menuAbierto && (
        <nav className='header-nav-mobile'>
          <Link to='/' onClick={() => setMenuAbierto(false)}>
            Inicio
          </Link>
          <Link to='/eventos' onClick={() => setMenuAbierto(false)}>
            Eventos
          </Link>
          <Link to='/mapa' onClick={() => setMenuAbierto(false)}>
            Mapa
          </Link>
          <Link to='/garaje' onClick={() => setMenuAbierto(false)}>
            Garaje
          </Link>
          {session ? (
            <>
              <Link to='/perfil' onClick={() => setMenuAbierto(false)}>
                Mi perfil
              </Link>
              <button
                onClick={() => {
                  handleLogout()
                  setMenuAbierto(false)
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link to='/login' onClick={() => setMenuAbierto(false)}>
              Entrar
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}

export default Header
