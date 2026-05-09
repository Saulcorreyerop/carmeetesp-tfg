import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Trash2, Send } from 'lucide-react'
import { useAdmin } from '../hooks/useAdmin'

const GarageDetailPage = ({ session }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const esAdmin = useAdmin(session)
  const [vehiculo, setVehiculo] = useState(null)
  const [comentarios, setComentarios] = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    cargar()
  }, [id])

  const cargar = async () => {
    setCargando(true)
    const { data: vehiculoData } = await supabase
      .from('vehiculos')
      .select('*, usuarios(id, nombre, foto_url)')
      .eq('id', id)
      .single()
    setVehiculo(vehiculoData)

    const { data: comentariosData } = await supabase
      .from('comentarios')
      .select('*, usuarios(nombre, foto_url)')
      .eq('vehiculo_id', id)
      .order('created_at', { ascending: true })
    setComentarios(comentariosData || [])
    setCargando(false)
  }

  const handleEliminar = async () => {
    if (!confirm('¿Seguro que quieres eliminar este vehículo?')) return
    await supabase.from('vehiculos').delete().eq('id', id)
    navigate('/garaje')
  }

  const handleComentario = async (e) => {
    e.preventDefault()
    if (!nuevoComentario.trim()) return
    setEnviando(true)
    const { error } = await supabase.from('comentarios').insert({
      vehiculo_id: id,
      usuario_id: session.user.id,
      contenido: nuevoComentario.trim(),
    })
    if (!error) {
      setNuevoComentario('')
      cargar()
    }
    setEnviando(false)
  }

  const handleEliminarComentario = async (comentarioId) => {
    await supabase.from('comentarios').delete().eq('id', comentarioId)
    setComentarios((c) => c.filter((c) => c.id !== comentarioId))
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (cargando) return <div className='loading'>Cargando vehículo...</div>
  if (!vehiculo)
    return (
      <div className='page-container'>
        <p className='texto-suave'>Vehículo no encontrado.</p>
      </div>
    )

  return (
    <div className='page-container'>
      <button className='btn-volver' onClick={() => navigate('/garaje')}>
        <ArrowLeft size={16} /> Volver al garaje
      </button>

      {vehiculo.imagen_url && (
        <img
          src={vehiculo.imagen_url}
          alt={`${vehiculo.marca} ${vehiculo.modelo}`}
          className='detalle-imagen'
        />
      )}

      <div className='detalle-header'>
        <div className='detalle-info'>
          <h1 className='detalle-titulo'>
            {vehiculo.marca} {vehiculo.modelo}
          </h1>
          {vehiculo.anio && <p className='evento-dato'>📅 {vehiculo.anio}</p>}
          <p className='evento-dato'>
            {vehiculo.tipo === 'car' ? '🚗 Coche' : '🏍️ Moto'}
          </p>
          <div className='vehiculo-owner' style={{ marginTop: '8px' }}>
            {vehiculo.usuarios?.foto_url ? (
              <img
                src={vehiculo.usuarios.foto_url}
                alt={vehiculo.usuarios.nombre}
              />
            ) : (
              <div className='owner-avatar'>
                {vehiculo.usuarios?.nombre?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <span
              className='owner-nombre'
              onClick={() => navigate(`/usuario/${vehiculo.usuarios?.id}`)}
            >
              {vehiculo.usuarios?.nombre}
            </span>
          </div>
        </div>

        {session?.user?.id === vehiculo.usuario_id && (
          <button
            className='btn-accion btn-accion-peligro'
            onClick={handleEliminar}
          >
            <Trash2 size={18} /> Eliminar
          </button>
        )}
      </div>

      {vehiculo.descripcion && (
        <div className='detalle-seccion'>
          <h2>Descripción</h2>
          <p className='detalle-descripcion'>{vehiculo.descripcion}</p>
        </div>
      )}

      {/* Comentarios */}
      <div className='detalle-seccion'>
        <h2>Comentarios ({comentarios.length})</h2>

        {comentarios.length === 0 ? (
          <p className='texto-suave'>Sé el primero en comentar.</p>
        ) : (
          <div className='comentarios-lista'>
            {comentarios.map((c) => (
              <div key={c.id} className='comentario'>
                <div className='comentario-avatar'>
                  {c.usuarios?.foto_url ? (
                    <img src={c.usuarios.foto_url} alt={c.usuarios.nombre} />
                  ) : (
                    <div className='owner-avatar'>
                      {c.usuarios?.nombre?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className='comentario-cuerpo'>
                  <div className='comentario-header'>
                    <span className='comentario-nombre'>
                      {c.usuarios?.nombre}
                    </span>
                    <span className='comentario-fecha'>
                      {formatearFecha(c.created_at)}
                    </span>
                  </div>
                  <p className='comentario-texto'>{c.contenido}</p>
                </div>
                {(session?.user?.id === c.usuario_id || esAdmin) && (
                  <button
                    className='comentario-eliminar'
                    onClick={() => handleEliminarComentario(c.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {session ? (
          <form onSubmit={handleComentario} className='comentario-form'>
            <input
              type='text'
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder='Escribe un comentario...'
              required
            />
            <button type='submit' className='btn-primary' disabled={enviando}>
              <Send size={16} />
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        ) : (
          <p className='texto-suave'>
            <span className='link-login' onClick={() => navigate('/login')}>
              Inicia sesión
            </span>{' '}
            para comentar.
          </p>
        )}
      </div>
    </div>
  )
}

export default GarageDetailPage
