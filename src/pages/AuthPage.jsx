import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Mail, Lock, User } from 'lucide-react'

const IMAGEN_LOGIN =
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80'
const IMAGEN_REGISTRO =
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'

const AuthPage = ({ session }) => {
  const navigate = useNavigate()
  const [esLogin, setEsLogin] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
  })

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
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) setError('Email o contraseña incorrectos')
      else navigate('/')
    } else {
      if (form.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres')
        setCargando(false)
        return
      }
      if (form.password !== form.confirmPassword) {
        setError('Las contraseñas no coinciden')
        setCargando(false)
        return
      }
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { nombre: form.nombre } },
      })
      if (error) setError('Error al registrarse. Comprueba los datos.')
      else {
        setMensaje(
          '¡Registro completado! Revisa tu email para confirmar la cuenta.',
        )
        setEsLogin(true)
      }
    }
    setCargando(false)
  }

  const cambiarModo = () => {
    setEsLogin(!esLogin)
    setError('')
    setMensaje('')
    setForm({ email: '', password: '', confirmPassword: '', nombre: '' })
  }

  return (
    <div className={`auth-split ${!esLogin ? 'auth-split-invertido' : ''}`}>
      {/* Panel formulario */}
      <div className='auth-panel-form'>
        <div className='auth-panel-inner'>
          <div className='auth-logo-mini'>
            <span className='auth-logo-cm'>Car</span>
            <span className='auth-logo-esp'>Meet ESP</span>
          </div>

          <h1 className='auth-titulo'>
            {esLogin ? 'Bienvenido de nuevo' : 'Únete a la comunidad'}
          </h1>
          <p className='auth-subtitulo'>
            {esLogin
              ? 'Inicia sesión para acceder a todos los eventos'
              : 'Crea tu cuenta gratis y empieza a descubrir eventos'}
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

            {!esLogin && (
              <div className='form-grupo'>
                <label>Confirmar contraseña</label>
                <div className='form-input-wrap'>
                  <Lock size={16} className='form-icono' />
                  <input
                    type='password'
                    name='confirmPassword'
                    placeholder='Repite tu contraseña'
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>
            )}

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
            <button onClick={cambiarModo}>
              {esLogin ? ' Regístrate gratis' : ' Inicia sesión'}
            </button>
          </p>
        </div>
      </div>

      {/* Panel imagen */}
      <div
        className='auth-panel-imagen'
        style={{
          backgroundImage: `url(${esLogin ? IMAGEN_LOGIN : IMAGEN_REGISTRO})`,
        }}
      >
        <div className='auth-panel-overlay'>
          <div className='auth-panel-quote'>
            {esLogin ? (
              <>
                <h2>
                  La comunidad motorista
                  <br />
                  más activa de España
                </h2>
                <p>Miles de eventos, concentraciones y rutas esperándote.</p>
              </>
            ) : (
              <>
                <h2>
                  Tu garaje virtual
                  <br />
                  te espera
                </h2>
                <p>
                  Publica tu coche, conecta con aficionados y encuentra eventos
                  cerca de ti.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
