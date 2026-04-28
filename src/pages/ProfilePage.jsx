import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { User, MapPin, FileText, Camera, Save } from 'lucide-react'

const ProfilePage = ({ session }) => {
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [form, setForm] = useState({
    nombre: '',
    ciudad: '',
    bio: '',
  })
  const [misEventos, setMisEventos] = useState([])
  const [misInscripciones, setMisInscripciones] = useState([])

  useEffect(() => {
    cargarPerfil()
  }, [])

  const cargarPerfil = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (data) {
      setPerfil(data)
      setForm({
        nombre: data.nombre || '',
        ciudad: data.ciudad || '',
        bio: data.bio || '',
      })
    }

    // Eventos creados por el usuario
    const { data: eventosData } = await supabase
      .from('eventos')
      .select('id, titulo, fecha, lugar')
      .eq('creador_id', session.user.id)
      .order('fecha', { ascending: false })
    setMisEventos(eventosData || [])

    // Eventos a los que asiste
    const { data: inscripcionesData } = await supabase
      .from('inscripciones')
      .select('evento_id, eventos(id, titulo, fecha, lugar)')
      .eq('usuario_id', session.user.id)
    setMisInscripciones(inscripcionesData || [])

    setCargando(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setMensaje('')

    let foto_url = perfil.foto_url

    // Subir avatar si se ha seleccionado uno nuevo
    if (avatarFile) {
      const extension = avatarFile.name.split('.').pop()
      const nombreArchivo = `${session.user.id}/avatar.${extension}`

      const { error: errorSubida } = await supabase.storage
        .from('avatares')
        .upload(nombreArchivo, avatarFile, { upsert: true })

      if (errorSubida) {
        setError('Error al subir la foto. Inténtalo de nuevo.')
        setGuardando(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('avatares')
        .getPublicUrl(nombreArchivo)
      foto_url = urlData.publicUrl + '?t=' + Date.now()
    }

    // Actualizar perfil en la base de datos
    const { error: errorUpdate } = await supabase
      .from('usuarios')
      .update({ ...form, foto_url })
      .eq('id', session.user.id)

    if (errorUpdate) {
      setError('Error al guardar los cambios.')
    } else {
      setMensaje('Perfil actualizado correctamente.')
      setPerfil({ ...perfil, ...form, foto_url })
      setEditando(false)
      setAvatarFile(null)
    }

    setGuardando(false)
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (cargando) return <div className='loading'>Cargando perfil...</div>

  return (
    <div className='page-container'>
      <h1 className='page-titulo'>Mi perfil</h1>

      {mensaje && <p className='auth-mensaje'>{mensaje}</p>}
      {error && <p className='auth-error'>{error}</p>}

      <div className='perfil-layout'>
        {/* Tarjeta de perfil */}
        <div className='perfil-card'>
          {/* Avatar */}
          <div className='perfil-avatar-wrap'>
            {avatarPreview || perfil?.foto_url ? (
              <img
                src={avatarPreview || perfil.foto_url}
                alt='Avatar'
                className='perfil-avatar'
              />
            ) : (
              <div className='perfil-avatar-placeholder'>
                {perfil?.nombre?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            {editando && (
              <label className='perfil-avatar-btn'>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <Camera size={16} />
              </label>
            )}
          </div>

          {/* Info o formulario */}
          {editando ? (
            <form onSubmit={handleGuardar} className='perfil-form'>
              <div className='form-grupo'>
                <label>Nombre</label>
                <div className='form-input-wrap'>
                  <User size={16} className='form-icono' />
                  <input
                    type='text'
                    name='nombre'
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>
              <div className='form-grupo'>
                <label>Ciudad</label>
                <div className='form-input-wrap'>
                  <MapPin size={16} className='form-icono' />
                  <input
                    type='text'
                    name='ciudad'
                    value={form.ciudad}
                    onChange={handleChange}
                    placeholder='Tu ciudad'
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>
              <div className='form-grupo'>
                <label>Bio</label>
                <div className='form-input-wrap'>
                  <FileText
                    size={16}
                    className='form-icono'
                    style={{ top: '12px' }}
                  />
                  <textarea
                    name='bio'
                    value={form.bio}
                    onChange={handleChange}
                    rows={3}
                    placeholder='Cuéntanos algo sobre ti...'
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>
              <div className='perfil-form-botones'>
                <button
                  type='submit'
                  className='btn-primary'
                  disabled={guardando}
                >
                  <Save size={16} />

                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type='button'
                  className='btn-accion'
                  onClick={() => {
                    setEditando(false)
                    setAvatarPreview(null)
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className='perfil-info'>
              <h2 className='perfil-nombre'>{perfil?.nombre}</h2>
              {perfil?.ciudad && (
                <p className='perfil-dato'>
                  <MapPin size={14} />
                  {perfil.ciudad}
                </p>
              )}
              {perfil?.bio && <p className='perfil-bio'>{perfil.bio}</p>}
              <p className='perfil-email'>{session.user.email}</p>
              <button className='btn-primary' onClick={() => setEditando(true)}>
                Editar perfil
              </button>
            </div>
          )}
        </div>

        {/* Panel derecho — mis eventos */}
        <div className='perfil-panel'>
          {/* Eventos creados */}
          <div className='perfil-seccion'>
            <h2>Mis eventos ({misEventos.length})</h2>
            {misEventos.length === 0 ? (
              <p className='texto-suave'>
                No has creado ningún evento todavía.
              </p>
            ) : (
              <div className='perfil-lista'>
                {misEventos.map((evento) => (
                  <div key={evento.id} className='perfil-lista-item'>
                    <p className='perfil-lista-titulo'>{evento.titulo}</p>
                    <p className='evento-dato'>
                      <MapPin size={12} />
                      {evento.lugar}
                    </p>
                    <p className='evento-dato'>
                      {formatearFecha(evento.fecha)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Eventos a los que asiste */}
          <div className='perfil-seccion'>
            <h2>Eventos a los que asisto ({misInscripciones.length})</h2>
            {misInscripciones.length === 0 ? (
              <p className='texto-suave'>No te has apuntado a ningún evento.</p>
            ) : (
              <div className='perfil-lista'>
                {misInscripciones.map((ins, i) => (
                  <div key={i} className='perfil-lista-item'>
                    <p className='perfil-lista-titulo'>{ins.eventos?.titulo}</p>
                    <p className='evento-dato'>
                      <MapPin size={12} />
                      {ins.eventos?.lugar}
                    </p>
                    <p className='evento-dato'>
                      {ins.eventos?.fecha && formatearFecha(ins.eventos.fecha)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
