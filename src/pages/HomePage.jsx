import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { MapPin, Calendar, Users, Map, ArrowRight } from 'lucide-react'

const HomePage = ({ session }) => {
  const navigate = useNavigate()
  const [ultimosEventos, setUltimosEventos] = useState([])

  useEffect(() => {
    const cargarEventos = async () => {
      const { data } = await supabase
        .from('eventos')
        .select('id, titulo, fecha, lugar, imagen_url')
        .order('fecha', { ascending: true })
        .limit(3)
      setUltimosEventos(data || [])
    }
    cargarEventos()
  }, [])

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className='home'>
      {/* ── HERO ── */}
      <section className='hero'>
        <div className='hero-contenido'>
          <img src='/logo.png' alt='CarMeet ESP' className='hero-logo' />
          <h1 className='hero-titulo'>
            La comunidad de coches
            <br />
            <span className='hero-titulo-azul'>en España</span>
          </h1>
          <p className='hero-subtitulo'>
            Encuentra concentraciones y rutas cerca de ti,
            <br />
            gestiona tu perfil y conecta con otros aficionados al motor.
          </p>
          <div className='hero-botones'>
            <button
              className='btn-primary btn-grande'
              onClick={() => navigate('/eventos')}
            >
              Ver eventos <ArrowRight size={18} />
            </button>
            {!session && (
              <button
                className='btn-outline btn-grande'
                onClick={() => navigate('/login')}
              >
                Crear cuenta gratis
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── CARACTERÍSTICAS ── */}
      <section className='features'>
        <div className='features-contenido'>
          <h2 className='seccion-titulo'>¿Qué puedes hacer en CarMeet ESP?</h2>
          <div className='features-grid'>
            <div className='feature-card'>
              <div className='feature-icono'>
                <Calendar size={28} />
              </div>
              <h3>Eventos y concentraciones</h3>
              <p>
                Consulta todos los eventos de coches organizados en España.
                Filtra por fecha y ubicación.
              </p>
            </div>

            <div className='feature-card'>
              <div className='feature-icono'>
                <Map size={28} />
              </div>
              <h3>Mapa interactivo</h3>
              <p>
                Visualiza todos los eventos geolocalizados en un mapa de España.
                Haz clic para ver los detalles.
              </p>
            </div>

            <div className='feature-card'>
              <div className='feature-icono'>
                <Users size={28} />
              </div>
              <h3>Asiste y guarda favoritos</h3>
              <p>
                Apúntate a los eventos que te interesen y guarda tus favoritos
                para no perder ninguno.
              </p>
            </div>

            <div className='feature-card'>
              <div className='feature-icono'>
                <MapPin size={28} />
              </div>
              <h3>Crea tus propios eventos</h3>
              <p>
                Organiza una concentración o ruta y compártela con la comunidad
                en segundos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRÓXIMOS EVENTOS ── */}
      {ultimosEventos.length > 0 && (
        <section className='home-eventos'>
          <div className='home-eventos-contenido'>
            <div className='home-eventos-header'>
              <h2 className='seccion-titulo'>Próximos eventos</h2>
              <button
                className='btn-outline'
                onClick={() => navigate('/eventos')}
              >
                Ver todos <ArrowRight size={16} />
              </button>
            </div>
            <div className='eventos-grid'>
              {ultimosEventos.map((evento) => (
                <div
                  key={evento.id}
                  className='evento-card'
                  onClick={() =>
                    navigate(`/eventos/${evento.slug || evento.id}`)
                  }
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA FINAL ── */}
      {!session && (
        <section className='cta'>
          <div className='cta-contenido'>
            <h2>¿Listo para unirte?</h2>
            <p>
              Crea tu cuenta gratis y empieza a descubrir eventos cerca de ti.
            </p>
            <button
              className='btn-primary btn-grande'
              onClick={() => navigate('/login')}
            >
              Comenzar ahora <ArrowRight size={18} />
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

export default HomePage
