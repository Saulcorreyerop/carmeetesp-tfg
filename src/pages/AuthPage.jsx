import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Mail, Lock, User } from 'lucide-react'

const AuthPage = ({ session }) => {
  const navigate = useNavigate()
  const [esLogin, setEsLogin] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [form, setForm] = useState({
    email: '',
    password: '',
    nombre: '',
  })

  // Si ya hay sesión, redirigir al inicio
  if (session) {
    navigate('/')
    return null
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    setMensaje('')

    if (esLogin) {
      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) {
        setError('Email o contraseña incorrectos')
      } else {
        navigate('/')
      }
    } else {
      // REGISTRO
      if (form.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres')
        setCargando(false)
        return
      }
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { nombre: form.nombre },
        },
      })
      if (error) {
        setError('Error al registrarse. Comprueba los datos.')
      } else {
        setMensaje('¡Registro completado! Ya puedes iniciar sesión.')
        setEsLogin(true)
      }
    }

    setCargando(false)
  }

  return (
    <div className='auth-page'>
      <div className='auth-card'>
        <h1 className='auth-titulo'>
          {esLogin ? 'Iniciar sesión' : 'Crear cuenta'}
        </h1>
        <p className='auth-subtitulo'>
          {esLogin
            ? 'Bienvenido de nuevo a CarMeet ESP'
            : 'Únete a la comunidad de coches'}
        </p>

        {error && <p className='auth-error'>{error}</p>}
        {mensaje && <p className='auth-mensaje'>{mensaje}</p>}

        <form onSubmit={handleSubmit} className='auth-form'>
          {!esLogin && (
            <div className='form-grupo'>
              <label>Nombre</label>
              <div className='form-input-wrap'>
                <User size={16} className='form-icono' />
                <input
                  type='text'
                  name='nombre'
                  placeholder='Tu nombre'
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
          )}

          <div className='form-grupo'>
            <label>Email</label>
            <div className='form-input-wrap'>
              <Mail size={16} className='form-icono' />
              <input
                type='email'
                name='email'
                placeholder='tu@email.com'
                value={form.email}
                onChange={handleChange}
                required
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div className='form-grupo'>
            <label>Contraseña</label>
            <div className='form-input-wrap'>
              <Lock size={16} className='form-icono' />
              <input
                type='password'
                name='password'
                placeholder='••••••••'
                value={form.password}
                onChange={handleChange}
                required
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <button
            type='submit'
            className='btn-primary btn-full'
            disabled={cargando}
          >
            {cargando ? 'Cargando...' : esLogin ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <p className='auth-cambio'>
          {esLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <button
            onClick={() => {
              setEsLogin(!esLogin)
              setError('')
              setMensaje('')
            }}
          >
            {esLogin ? ' Regístrate' : ' Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthPage
