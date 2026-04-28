import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet'
import { supabase } from '../supabaseClient'
import { Calendar, MapPin, Plus } from 'lucide-react'
import CrearEventoForm from '../components/CrearEventoForm'
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

// Componente que detecta clic en el mapa
const ClickEnMapa = ({ onClic, activo }) => {
  useMapEvents({
    click(e) {
      if (activo) {
        onClic(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

const MapPage = ({ session }) => {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [coordenadasIniciales, setCoordenadasIniciales] = useState(null)
  const [modoSeleccion, setModoSeleccion] = useState(false)

  useEffect(() => {
    cargarEventos()
  }, [])

  const cargarEventos = async () => {
    const { data } = await supabase
      .from('eventos')
      .select('id, titulo, lugar, fecha, latitud, longitud, imagen_url')
      .order('fecha', { ascending: true })
    setEventos(data || [])
    setCargando(false)
  }

  const handleClickMapa = (lat, lng) => {
    setCoordenadasIniciales({ lat, lng })
    setMostrarFormulario(true)
    setModoSeleccion(false)
  }

  const handleEventoCreado = () => {
    setMostrarFormulario(false)
    setCoordenadasIniciales(null)
    setModoSeleccion(false)
    cargarEventos()
  }

  const handleCancelar = () => {
    setMostrarFormulario(false)
    setCoordenadasIniciales(null)
    setModoSeleccion(false)
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
          <h1 className='page-titulo'>Mapa de eventos</h1>
          <p className='page-subtitulo'>
            {cargando ? 'Cargando...' : `${eventos.length} eventos en España`}
          </p>
        </div>

        {session && !mostrarFormulario && (
          <div className='mapa-botones'>
            <button
              className={`btn-accion ${modoSeleccion ? 'btn-accion-activo' : ''}`}
              onClick={() => setModoSeleccion(!modoSeleccion)}
            >
              <MapPin size={16} />
              {modoSeleccion ? 'Cancelar selección' : 'Clic en mapa'}
            </button>
            <button
              className='btn-primary'
              onClick={() => {
                setCoordenadasIniciales(null)
                setMostrarFormulario(true)
              }}
            >
              <Plus size={16} />
              Crear evento
            </button>
          </div>
        )}
      </div>

      {/* Aviso modo selección */}
      {modoSeleccion && (
        <div className='mapa-aviso'>
          📍 Haz clic en cualquier punto del mapa para crear un evento en esa
          ubicación
        </div>
      )}

      {/* Formulario */}
      {mostrarFormulario && (
        <CrearEventoForm
          session={session}
          coordenadasIniciales={coordenadasIniciales}
          onEventoCreado={handleEventoCreado}
          onCancelar={handleCancelar}
        />
      )}

      {/* Mapa */}
      <div className='mapa-pagina'>
        <MapContainer
          center={[40.4168, -3.7038]}
          zoom={6}
          style={{
            height: '600px',
            width: '100%',
            borderRadius: '10px',
            cursor: modoSeleccion ? 'crosshair' : 'grab',
          }}
        >
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='© OpenStreetMap'
          />
          <ClickEnMapa onClic={handleClickMapa} activo={modoSeleccion} />
          {eventos.map((evento) => (
            <Marker
              key={evento.id}
              position={[evento.latitud, evento.longitud]}
            >
              <Popup>
                <div className='mapa-popup'>
                  {evento.imagen_url && (
                    <img
                      src={evento.imagen_url}
                      alt={evento.titulo}
                      className='popup-imagen'
                    />
                  )}
                  <p className='popup-titulo'>{evento.titulo}</p>
                  <p className='popup-dato'>
                    <Calendar size={12} />
                    {formatearFecha(evento.fecha)}
                  </p>
                  <p className='popup-dato'>
                    <MapPin size={12} />
                    {evento.lugar}
                  </p>
                  <button
                    className='popup-btn'
                    onClick={() =>
                      navigate(`/eventos/${evento.slug || evento.id}`)
                    }
                  >
                    Ver evento
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Lista bajo el mapa */}
      {!cargando && eventos.length > 0 && (
        <div className='mapa-lista'>
          <h2 className='mapa-lista-titulo'>Todos los eventos</h2>
          <div className='mapa-lista-grid'>
            {eventos.map((evento) => (
              <div
                key={evento.id}
                className='mapa-lista-item'
                onClick={() => navigate(`/eventos/${evento.id}`)}
              >
                <p className='mapa-lista-nombre'>{evento.titulo}</p>
                <p className='evento-dato'>
                  <Calendar size={12} />
                  {formatearFecha(evento.fecha)}
                </p>
                <p className='evento-dato'>
                  <MapPin size={12} />
                  {evento.lugar}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MapPage
