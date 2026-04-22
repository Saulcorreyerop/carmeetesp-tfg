import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Calendar, MapPin, Heart, Users, ArrowLeft, Trash2 } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const EventDetailPage = ({ session }) => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [evento, setEvento] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [asistentes, setAsistentes] = useState([])
  const [totalFavoritos, setTotalFavoritos] = useState(0)
  const [yaAsiste, setYaAsiste] = useState(false)
  const [yaFavorito, setYaFavorito] = useState(false)
  const [cargandoAccion, setCargandoAccion] = useState(false)

  useEffect(() => {
    cargarEvento()
  }, [id])

  const cargarEvento = async () => {
    setCargando(true)

    // Cargar evento
    const { data: eventoData } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', id)
      .single()
    setEvento(eventoData)

    // Cargar asistentes
    const { data: asistentesData } = await supabase
      .from('inscripciones')
      .select('usuario_id, usuarios(nombre, foto_url)')
      .eq('evento_id', id)
    setAsistentes(asistentesData || [])

    // Contar favoritos
    const { count } = await supabase
      .from('favoritos')
      .select('*', { count: 'exact', head: true })
      .eq('evento_id', id)
    setTotalFavoritos(count || 0)

    // Comprobar si el usuario actual ya asiste o tiene favorito
    if (session?.user?.id) {
      const { data: inscripcion } = await supabase
        .from('inscripciones')
        .select('id')
        .eq('evento_id', id)
        .eq('usuario_id', session.user.id)
        .single()
      setYaAsiste(!!inscripcion)

      const { data: favorito } = await supabase
        .from('favoritos')
        .select('id')
        .eq('evento_id', id)
        .eq('usuario_id', session.user.id)
        .single()
      setYaFavorito(!!favorito)
    }

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
        .eq('evento_id', id)
        .eq('usuario_id', session.user.id)
      setYaAsiste(false)
      setAsistentes((a) => a.filter((a) => a.usuario_id !== session.user.id))
    } else {
      await supabase
        .from('inscripciones')
        .insert({ evento_id: id, usuario_id: session.user.id })
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
        .eq('evento_id', id)
        .eq('usuario_id', session.user.id)
      setYaFavorito(false)
      setTotalFavoritos((f) => f - 1)
    } else {
      await supabase
        .from('favoritos')
        .insert({ evento_id: id, usuario_id: session.user.id })
      setYaFavorito(true)
      setTotalFavoritos((f) => f + 1)
    }
    setCargandoAccion(false)
  }

  const handleEliminar = async () => {
    if (!confirm('¿Seguro que quieres eliminar este evento?')) return
    await supabase.from('eventos').delete().eq('id', id)
    navigate('/eventos')
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      {/* Botón volver */}
      <button className='btn-volver' onClick={() => navigate('/eventos')}>
        <ArrowLeft size={16} /> Volver a eventos
      </button>

      {/* Imagen portada */}
      {evento.imagen_url && (
        <img
          src={evento.imagen_url}
          alt={evento.titulo}
          className='detalle-imagen'
        />
      )}

      {/* Cabecera */}
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

        {/* Acciones */}
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
            <button
              className='btn-accion btn-accion-peligro'
              onClick={handleEliminar}
            >
              <Trash2 size={18} />
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Descripción */}
      {evento.descripcion && (
        <div className='detalle-seccion'>
          <h2>Descripción</h2>
          <p className='detalle-descripcion'>{evento.descripcion}</p>
        </div>
      )}

      {/* Mapa */}
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
      </div>

      {/* Asistentes */}
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
              <div key={i} className='asistente-chip'>
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
    </div>
  )
}

export default EventDetailPage
