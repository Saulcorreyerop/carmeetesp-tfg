import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Calendar, MapPin, Plus, Trash2 } from 'lucide-react'
import CrearEventoForm from '../components/CrearEventoForm'

const EventsPage = ({ session }) => {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  useEffect(() => {
    cargarEventos()
  }, [])

  const cargarEventos = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('fecha', { ascending: true })
    if (!error) setEventos(data)
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
    })
  }

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
      ) : eventos.length === 0 ? (
        <p className='texto-suave'>
          No hay eventos todavía. ¡Sé el primero en crear uno!
        </p>
      ) : (
        <div className='eventos-grid'>
          {eventos.map((evento) => (
            <div
              key={evento.id}
              className='evento-card'
              onClick={() => navigate(`/eventos/${evento.id}`)}
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
                  onClick={(e) =>
                    handleEliminar(evento.id, evento.creador_id, e)
                  }
                  title='Eliminar evento'
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventsPage
