import { useState, useEffect } from 'react'
import EditarEventoForm from '../components/EditarEventoForm'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  Calendar,
  MapPin,
  Heart,
  Users,
  ArrowLeft,
  Trash2,
  Send,
  Edit2,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import { useAdmin } from '../hooks/useAdmin'

L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const EventDetailPage = ({ session }) => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const esAdmin = useAdmin(session)

  const [evento, setEvento] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [asistentes, setAsistentes] = useState([])
  const [totalFavoritos, setTotalFavoritos] = useState(0)
  const [yaAsiste, setYaAsiste] = useState(false)
  const [yaFavorito, setYaFavorito] = useState(false)
  const [cargandoAccion, setCargandoAccion] = useState(false)
  const [editando, setEditando] = useState(false)
  const [comentarios, setComentarios] = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    cargarEvento()
  }, [slug])

  const cargarEvento = async () => {
    setCargando(true)

    let eventoData = null
    const { data: porSlug } = await supabase
      .from('eventos')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (porSlug) {
      eventoData = porSlug
    } else {
      const { data: porId } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', slug)
        .maybeSingle()
      eventoData = porId
    }

    setEvento(eventoData)

    if (!eventoData) {
      setCargando(false)
      return
    }

    const { data: asistentesData } = await supabase
      .from('inscripciones')
      .select('usuario_id, usuarios(nombre, foto_url)')
      .eq('evento_id', eventoData.id)
    setAsistentes(asistentesData || [])

    const { count } = await supabase
      .from('favoritos')
      .select('*', { count: 'exact', head: true })
      .eq('evento_id', eventoData.id)
    setTotalFavoritos(count || 0)

    if (session?.user?.id) {
      const { data: inscripcion } = await supabase
        .from('inscripciones')
        .select('id')
        .eq('evento_id', eventoData.id)
        .eq('usuario_id', session.user.id)
        .maybeSingle()
      setYaAsiste(!!inscripcion)

      const { data: favorito } = await supabase
        .from('favoritos')
        .select('id')
        .eq('evento_id', eventoData.id)
        .eq('usuario_id', session.user.id)
        .maybeSingle()
      setYaFavorito(!!favorito)
    }

    const { data: comentariosData } = await supabase
      .from('comentarios')
      .select('*, usuarios(nombre, foto_url)')
      .eq('evento_id', eventoData.id)
      .order('created_at', { ascending: true })
    setComentarios(comentariosData || [])

    setCargando(false)
  }

  const toggleAsistir = async () => {
    if (!session) {
      navigate('/login')
      return
    }
    setCargandoAccion(true)
    if (yaAsiste) {
      await supabase
        .from('inscripciones')
        .delete()
        .eq('evento_id', evento.id)
        .eq('usuario_id', session.user.id)
      setYaAsiste(false)
      setAsistentes((a) => a.filter((a) => a.usuario_id !== session.user.id))
    } else {
      await supabase
        .from('inscripciones')
        .insert({ evento_id: evento.id, usuario_id: session.user.id })
      setYaAsiste(true)
      setAsistentes((a) => [
        ...a,
        { usuario_id: session.user.id, usuarios: { nombre: 'Tú' } },
      ])
    }
    setCargandoAccion(false)
  }

  const toggleFavorito = async () => {
    if (!session) {
      navigate('/login')
      return
    }
    setCargandoAccion(true)
    if (yaFavorito) {
      await supabase
        .from('favoritos')
        .delete()
        .eq('evento_id', evento.id)
        .eq('usuario_id', session.user.id)
      setYaFavorito(false)
      setTotalFavoritos((f) => f - 1)
    } else {
      await supabase
        .from('favoritos')
        .insert({ evento_id: evento.id, usuario_id: session.user.id })
      setYaFavorito(true)
      setTotalFavoritos((f) => f + 1)
    }
    setCargandoAccion(false)
  }

  const handleEliminar = async () => {
    if (!confirm('¿Seguro que quieres eliminar este evento?')) return
    await supabase.from('eventos').delete().eq('id', evento.id)
    navigate('/eventos')
  }

  const handleComentario = async (e) => {
    e.preventDefault()
    if (!nuevoComentario.trim()) return
    setEnviando(true)
    const { error } = await supabase.from('comentarios').insert({
      evento_id: evento.id,
      usuario_id: session.user.id,
      contenido: nuevoComentario.trim(),
    })
    if (!error) {
      setNuevoComentario('')
      cargarEvento()
    }
    setEnviando(false)
  }

  const handleEliminarComentario = async (comentarioId) => {
    await supabase.from('comentarios').delete().eq('id', comentarioId)
    setComentarios((c) => c.filter((c) => c.id !== comentarioId))
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid',
    })
  }

  if (cargando) return <div className='loading'>Cargando evento...</div>
  if (!evento)
    return (
      <div className='page-container'>
        <p className='texto-suave'>Evento no encontrado.</p>
      </div>
    )

  return (
    <div className='page-container'>
      <button className='btn-volver' onClick={() => navigate('/eventos')}>
        <ArrowLeft size={16} /> Volver a eventos
      </button>

      {evento.imagen_url && (
        <img
          src={evento.imagen_url}
          alt={evento.titulo}
          className='detalle-imagen'
        />
      )}

      {editando && (
        <div className='editar-evento-wrap'>
          <EditarEventoForm
            evento={evento}
            onEventoEditado={() => {
              setEditando(false)
              cargarEvento()
            }}
            onCancelar={() => setEditando(false)}
          />
        </div>
      )}

      {!editando && (
        <div className='detalle-header'>
          <div className='detalle-info'>
            <h1 className='detalle-titulo'>{evento.titulo}</h1>
            <p className='evento-dato'>
              <Calendar size={16} />
              {formatearFecha(evento.fecha)}
            </p>
            <p className='evento-dato'>
              <MapPin size={16} />
              {evento.lugar}
            </p>
          </div>

          <div className='detalle-acciones'>
            <button
              className={`btn-accion ${yaFavorito ? 'btn-accion-activo-rojo' : ''}`}
              onClick={toggleFavorito}
              disabled={cargandoAccion}
            >
              <Heart size={18} fill={yaFavorito ? 'currentColor' : 'none'} />
              {totalFavoritos} {totalFavoritos === 1 ? 'favorito' : 'favoritos'}
            </button>

            <button
              className={`btn-accion ${yaAsiste ? 'btn-accion-activo' : ''}`}
              onClick={toggleAsistir}
              disabled={cargandoAccion}
            >
              <Users size={18} />
              {yaAsiste ? 'Cancelar asistencia' : 'Asistir'}
            </button>

            {session?.user?.id === evento.creador_id && (
              <>
                <button
                  className='btn-accion'
                  onClick={() => setEditando(!editando)}
                >
                  <Edit2 size={18} />
                  {editando ? 'Cancelar' : 'Editar'}
                </button>
                <button
                  className='btn-accion btn-accion-peligro'
                  onClick={handleEliminar}
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {evento.descripcion && (
        <div className='detalle-seccion'>
          <h2>Descripción</h2>
          <p className='detalle-descripcion'>{evento.descripcion}</p>
        </div>
      )}

      <div className='detalle-seccion'>
        <h2>Ubicación</h2>
        <div className='detalle-mapa'>
          <MapContainer
            center={[evento.latitud, evento.longitud]}
            zoom={15}
            style={{ height: '300px', width: '100%', borderRadius: '10px' }}
          >
            <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
            <Marker position={[evento.latitud, evento.longitud]}>
              <Popup>{evento.titulo}</Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className='navegacion-botones'>
          <a
            href={
              'https://www.google.com/maps/dir/?api=1&destination=' +
              evento.latitud +
              ',' +
              evento.longitud
            }
            target='_blank'
            rel='noopener noreferrer'
            className='nav-btn nav-btn-google'
          >
            <svg viewBox='0 0 24 24' width='18' height='18' fill='currentColor'>
              <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' />
            </svg>
            Google Maps
          </a>

          <a
            href={
              'https://maps.apple.com/?daddr=' +
              evento.latitud +
              ',' +
              evento.longitud
            }
            target='_blank'
            rel='noopener noreferrer'
            className='nav-btn nav-btn-apple'
          >
            <svg viewBox='0 0 24 24' width='18' height='18' fill='currentColor'>
              <path d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z' />
            </svg>
            Apple Maps
          </a>

          <a
            href={
              'https://waze.com/ul?ll=' +
              evento.latitud +
              ',' +
              evento.longitud +
              '&navigate=yes'
            }
            target='_blank'
            rel='noopener noreferrer'
            className='nav-btn nav-btn-waze'
          >
            <svg viewBox='0 0 24 24' width='18' height='18' fill='currentColor'>
              <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z' />
            </svg>
            Waze
          </a>
        </div>
      </div>

      <div className='detalle-seccion'>
        <h2>
          {asistentes.length}{' '}
          {asistentes.length === 1 ? 'persona asiste' : 'personas asisten'}
        </h2>
        {asistentes.length === 0 ? (
          <p className='texto-suave'>Sé el primero en apuntarte.</p>
        ) : (
          <div className='asistentes-lista'>
            {asistentes.map((a, i) => (
              <div
                key={i}
                className='asistente-chip'
                onClick={() => navigate(`/usuario/${a.usuario_id}`)}
                title='Ver perfil'
              >
                {a.usuarios?.foto_url ? (
                  <img src={a.usuarios.foto_url} alt={a.usuarios.nombre} />
                ) : (
                  <div className='asistente-avatar'>
                    {a.usuarios?.nombre?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <span>{a.usuarios?.nombre || 'Usuario'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

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
                      {new Date(c.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
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

export default EventDetailPage
