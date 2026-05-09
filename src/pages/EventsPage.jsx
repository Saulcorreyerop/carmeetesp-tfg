import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Calendar, MapPin, Plus, Trash2, Trophy, Clock } from 'lucide-react'
import CrearEventoForm from '../components/CrearEventoForm'

const EventsPage = ({ session }) => {
  const navigate = useNavigate()
  const [eventosFuturos, setEventosFuturos] = useState([])
  const [eventosPasados, setEventosPasados] = useState([])
  const [topEventos, setTopEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  useEffect(() => {
    cargarEventos()
  }, [])

  const cargarEventos = async () => {
    setCargando(true)
    const ahora = new Date().toISOString()

    // Cargar eventos futuros
    const { data: futuros } = await supabase
      .from('eventos')
      .select('*')
      .gte('fecha', ahora)
      .order('fecha', { ascending: true })

    // Cargar eventos pasados
    const { data: pasados } = await supabase
      .from('eventos')
      .select('*')
      .lt('fecha', ahora)
      .order('fecha', { ascending: false })

    // Cargar conteo de asistentes e inscripciones para el TOP
    const { data: inscripciones } = await supabase
      .from('inscripciones')
      .select('evento_id')

    const { data: favoritos } = await supabase
      .from('favoritos')
      .select('evento_id')

    // Calcular puntuación de cada evento (asistentes + favoritos)
    const todosEventos = [...(futuros || []), ...(pasados || [])]
    const puntuaciones = {}

    todosEventos.forEach((e) => {
      const asistentes = (inscripciones || []).filter(
        (i) => i.evento_id === e.id,
      ).length
      const favs = (favoritos || []).filter((f) => f.evento_id === e.id).length
      puntuaciones[e.id] = asistentes + favs
    })

    // Top 3 con más puntuación (solo futuros)
    const top = [...(futuros || [])]
      .filter((e) => puntuaciones[e.id] > 0)
      .sort((a, b) => puntuaciones[b.id] - puntuaciones[a.id])
      .slice(0, 3)

    setTopEventos(top)
    setEventosFuturos(futuros || [])
    setEventosPasados(pasados || [])
    setCargando(false)
  }

  const handleEliminar = async (id, creadorId, e) => {
    e.stopPropagation()
    if (session?.user?.id !== creadorId) return
    if (!confirm('¿Seguro que quieres eliminar este evento?')) return
    const { error } = await supabase.from('eventos').delete().eq('id', id)
    if (!error) cargarEventos()
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const EventoCard = ({ evento, apagado = false }) => (
    <div
      className={`evento-card ${apagado ? 'evento-card-pasado' : ''}`}
      onClick={() => navigate(`/eventos/${evento.slug || evento.id}`)}
    >
      {evento.imagen_url && (
        <img
          src={evento.imagen_url}
          alt={evento.titulo}
          className='evento-imagen'
        />
      )}
      <div className='evento-info'>
        <h3 className='evento-titulo'>{evento.titulo}</h3>
        <p className='evento-dato'>
          <Calendar size={14} />
          {formatearFecha(evento.fecha)}
        </p>
        <p className='evento-dato'>
          <MapPin size={14} />
          {evento.lugar}
        </p>
        {evento.descripcion && (
          <p className='evento-descripcion'>{evento.descripcion}</p>
        )}
      </div>
      {session?.user?.id === evento.creador_id && (
        <button
          className='evento-eliminar'
          onClick={(e) => handleEliminar(evento.id, evento.creador_id, e)}
          title='Eliminar evento'
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div>
          <h1 className='page-titulo'>Eventos</h1>
          <p className='page-subtitulo'>
            Concentraciones y rutas por toda España
          </p>
        </div>
        {session && (
          <button
            className='btn-primary'
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            <Plus size={16} />
            {mostrarFormulario ? 'Cancelar' : 'Crear evento'}
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <CrearEventoForm
          session={session}
          onEventoCreado={() => {
            setMostrarFormulario(false)
            cargarEventos()
          }}
          onCancelar={() => setMostrarFormulario(false)}
        />
      )}

      {cargando ? (
        <p className='texto-suave'>Cargando eventos...</p>
      ) : (
        <>
          {/* TOP EVENTOS */}
          {topEventos.length > 0 && (
            <div className='eventos-seccion'>
              <div className='eventos-seccion-header'>
                <Trophy size={20} className='seccion-icono-trophy' />
                <h2 className='eventos-seccion-titulo'>Top Eventos</h2>
              </div>
              <div className='eventos-grid top-grid'>
                {topEventos.map((evento, i) => (
                  <div key={evento.id} className='top-evento-wrap'>
                    <div className='top-badge'>#{i + 1}</div>
                    <EventoCard evento={evento} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRÓXIMOS EVENTOS */}
          <div className='eventos-seccion'>
            <div className='eventos-seccion-header'>
              <Calendar size={20} className='seccion-icono-calendar' />
              <h2 className='eventos-seccion-titulo'>Próximos eventos</h2>
            </div>
            {eventosFuturos.length === 0 ? (
              <p className='texto-suave'>
                No hay eventos próximos. ¡Sé el primero en crear uno!
              </p>
            ) : (
              <div className='eventos-grid'>
                {eventosFuturos.map((evento) => (
                  <EventoCard key={evento.id} evento={evento} />
                ))}
              </div>
            )}
          </div>

          {/* EVENTOS PASADOS */}
          {eventosPasados.length > 0 && (
            <div className='eventos-seccion'>
              <div className='eventos-seccion-header'>
                <Clock size={20} className='seccion-icono-clock' />
                <h2 className='eventos-seccion-titulo'>Eventos pasados</h2>
              </div>
              <div className='eventos-grid'>
                {eventosPasados.map((evento) => (
                  <EventoCard key={evento.id} evento={evento} apagado={true} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default EventsPage
