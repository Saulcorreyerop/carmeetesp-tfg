import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  MapPin,
  Calendar,
  Users,
  Map,
  ArrowRight,
  Trophy,
  Car,
  Gauge,
} from 'lucide-react'

const HomePage = ({ session }) => {
  const navigate = useNavigate()
  const [topEventos, setTopEventos] = useState([])
  const [proximosEventos, setProximosEventos] = useState([])
  const [ultimosVehiculos, setUltimosVehiculos] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const ahora = new Date().toISOString()

    // Próximos 3 eventos futuros
    const { data: futuros } = await supabase
      .from('eventos')
      .select('id, titulo, fecha, lugar, imagen_url, slug')
      .gte('fecha', ahora)
      .order('fecha', { ascending: true })
      .limit(6)

    // Inscripciones y favoritos para calcular top
    const { data: inscripciones } = await supabase
      .from('inscripciones')
      .select('evento_id')
    const { data: favoritos } = await supabase
      .from('favoritos')
      .select('evento_id')

    // Calcular top eventos
    const puntuaciones = {}
    ;(futuros || []).forEach((e) => {
      const asistentes = (inscripciones || []).filter(
        (i) => i.evento_id === e.id,
      ).length
      const favs = (favoritos || []).filter((f) => f.evento_id === e.id).length
      puntuaciones[e.id] = asistentes + favs
    })

    const top = [...(futuros || [])]
      .filter((e) => puntuaciones[e.id] > 0)
      .sort((a, b) => puntuaciones[b.id] - puntuaciones[a.id])
      .slice(0, 3)

    const proximos = (futuros || [])
      .filter((e) => !top.find((t) => t.id === e.id))
      .slice(0, 3)

    setTopEventos(top)
    setProximosEventos(proximos)

    // Últimos 3 vehículos
    const { data: vehiculos } = await supabase
      .from('vehiculos')
      .select(
        'id, marca, modelo, anio, imagen_url, tipo, usuarios(nombre, foto_url)',
      )
      .order('created_at', { ascending: false })
      .limit(3)
    setUltimosVehiculos(vehiculos || [])
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Madrid',
    })
  }

  return (
    <div className='home'>
      {/* ── HERO ── */}
      <section className='hero-nuevo'>
        <div className='hero-overlay' />
        <div className='hero-contenido-nuevo'>
          <img src='/logo.png' alt='CarMeet ESP' className='hero-logo-nuevo' />
          <div className='hero-badge'>🏁 La comunidad motorista de España</div>
          <h1 className='hero-titulo-nuevo'>
            Donde los coches
            <br />
            <span className='hero-titulo-azul'>se encuentran</span>
          </h1>
          <p className='hero-subtitulo-nuevo'>
            Descubre concentraciones, rutas y eventos de coches cerca de ti.
            <br />
            Comparte tu vehículo y conecta con miles de aficionados al motor.
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
                className='btn-outline-hero btn-grande'
                onClick={() => navigate('/login')}
              >
                Unirme gratis
              </button>
            )}
            {session && (
              <button
                className='btn-outline-hero btn-grande'
                onClick={() => navigate('/garaje')}
              >
                Ver garaje <Car size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── TOP EVENTOS ── */}
      {topEventos.length > 0 && (
        <section className='home-seccion'>
          <div className='home-seccion-contenido'>
            <div className='home-seccion-header'>
              <div className='home-seccion-titulo-wrap'>
                <Trophy size={22} color='#f59e0b' />
                <h2 className='home-seccion-titulo'>Top Eventos</h2>
              </div>
              <button
                className='btn-outline'
                onClick={() => navigate('/eventos')}
              >
                Ver todos <ArrowRight size={16} />
              </button>
            </div>
            <div className='eventos-grid'>
              {topEventos.map((evento, i) => (
                <div
                  key={evento.id}
                  className='evento-card home-top-card'
                  onClick={() =>
                    navigate(`/eventos/${evento.slug || evento.id}`)
                  }
                >
                  <div className='home-top-badge'>#{i + 1}</div>
                  {evento.imagen_url ? (
                    <img
                      src={evento.imagen_url}
                      alt={evento.titulo}
                      className='evento-imagen'
                    />
                  ) : (
                    <div className='evento-imagen-placeholder'>
                      <Gauge size={40} />
                    </div>
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

      {/* ── PRÓXIMOS EVENTOS ── */}
      {proximosEventos.length > 0 && (
        <section className='home-seccion home-seccion-alt'>
          <div className='home-seccion-contenido'>
            <div className='home-seccion-header'>
              <div className='home-seccion-titulo-wrap'>
                <Calendar size={22} color='#2563eb' />
                <h2 className='home-seccion-titulo'>Próximos eventos</h2>
              </div>
              <button
                className='btn-outline'
                onClick={() => navigate('/eventos')}
              >
                Ver todos <ArrowRight size={16} />
              </button>
            </div>
            <div className='eventos-grid'>
              {proximosEventos.map((evento) => (
                <div
                  key={evento.id}
                  className='evento-card'
                  onClick={() =>
                    navigate(`/eventos/${evento.slug || evento.id}`)
                  }
                >
                  {evento.imagen_url ? (
                    <img
                      src={evento.imagen_url}
                      alt={evento.titulo}
                      className='evento-imagen'
                    />
                  ) : (
                    <div className='evento-imagen-placeholder'>
                      <Calendar size={40} />
                    </div>
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

      {/* ── VEHÍCULOS DE LA COMUNIDAD ── */}
      {ultimosVehiculos.length > 0 && (
        <section className='home-seccion'>
          <div className='home-seccion-contenido'>
            <div className='home-seccion-header'>
              <div className='home-seccion-titulo-wrap'>
                <Car size={22} color='#0f6e56' />
                <h2 className='home-seccion-titulo'>
                  Vehículos de la comunidad
                </h2>
              </div>
              <button
                className='btn-outline'
                onClick={() => navigate('/garaje')}
              >
                Ver garaje <ArrowRight size={16} />
              </button>
            </div>
            <div className='eventos-grid'>
              {ultimosVehiculos.map((v) => (
                <div
                  key={v.id}
                  className='evento-card'
                  onClick={() => navigate(`/garaje/${v.id}`)}
                >
                  {v.imagen_url ? (
                    <img
                      src={v.imagen_url}
                      alt={`${v.marca} ${v.modelo}`}
                      className='evento-imagen'
                    />
                  ) : (
                    <div className='evento-imagen-placeholder'>
                      <Car size={40} />
                    </div>
                  )}
                  <div className='evento-info'>
                    <h3 className='evento-titulo'>
                      {v.marca} {v.modelo}
                    </h3>
                    {v.anio && <p className='evento-dato'>📅 {v.anio}</p>}
                    <p className='evento-dato'>
                      {v.tipo === 'car' ? '🚗 Coche' : '🏍️ Moto'}
                    </p>
                    <div
                      className='vehiculo-owner'
                      style={{ marginTop: '4px' }}
                    >
                      {v.usuarios?.foto_url ? (
                        <img
                          src={v.usuarios.foto_url}
                          alt={v.usuarios.nombre}
                        />
                      ) : (
                        <div className='owner-avatar'>
                          {v.usuarios?.nombre?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <span>{v.usuarios?.nombre}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CARACTERÍSTICAS ── */}
      <section className='home-seccion home-seccion-alt'>
        <div className='home-seccion-contenido'>
          <h2 className='seccion-titulo'>¿Qué puedes hacer en CarMeet ESP?</h2>
          <div className='features-grid'>
            <div className='feature-card'>
              <div className='feature-icono'>
                <Calendar size={28} />
              </div>
              <h3>Eventos y concentraciones</h3>
              <p>
                Consulta todos los eventos de coches organizados en España, crea
                los tuyos y gestiona la asistencia.
              </p>
            </div>
            <div className='feature-card'>
              <div className='feature-icono'>
                <Map size={28} />
              </div>
              <h3>Mapa interactivo</h3>
              <p>
                Visualiza todos los eventos geolocalizados. Haz clic en el mapa
                para crear un evento en esa ubicación.
              </p>
            </div>
            <div className='feature-card'>
              <div className='feature-icono'>
                <Users size={28} />
              </div>
              <h3>Comunidad activa</h3>
              <p>
                Apúntate a eventos, guarda favoritos, comenta en vehículos y
                conoce a otros aficionados al motor.
              </p>
            </div>
            <div className='feature-card'>
              <div className='feature-icono'>
                <Car size={28} />
              </div>
              <h3>Tu garaje virtual</h3>
              <p>
                Publica tu coche o moto con fotos y descripción. La comunidad
                puede verlo y comentarlo.
              </p>
            </div>
          </div>
        </div>
      </section>

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
