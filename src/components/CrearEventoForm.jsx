import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { supabase } from '../supabaseClient'
import { MapPin, Upload, Search, X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { generarSlugUnico } from '../utils/slug'

// Fix icono leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

// Componente interno para capturar click en el mapa
const SelectorUbicacion = ({ onSeleccionar }) => {
  useMapEvents({
    click(e) {
      onSeleccionar(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

const CrearEventoForm = ({
  session,
  onEventoCreado,
  onCancelar,
  coordenadasIniciales,
}) => {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    lugar: '',
    fecha: '',
  })
  const [coordenadas, setCoordenadas] = useState(coordenadasIniciales || null)

  useEffect(() => {
    if (coordenadasIniciales) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coordenadasIniciales.lat}&lon=${coordenadasIniciales.lng}&format=json`,
      )
        .then((r) => r.json())
        .then((data) => {
          const nombre =
            data.display_name ||
            `${coordenadasIniciales.lat.toFixed(4)}, ${coordenadasIniciales.lng.toFixed(4)}`
          setForm((f) => ({ ...f, lugar: nombre }))
          setBusqueda(nombre)
        })
    }
  }, [])

  const [imagenFile, setImagenFile] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [sugerencias, setSugerencias] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const busquedaTimeout = useRef(null)

  // Autocompletado de direcciones con Nominatim
  useEffect(() => {
    if (busqueda.length < 3) {
      setSugerencias([])
      return
    }
    clearTimeout(busquedaTimeout.current)
    busquedaTimeout.current = setTimeout(async () => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(busqueda)}&format=json&addressdetails=1&limit=5&countrycodes=es`,
      )
      const data = await res.json()
      setSugerencias(data)
    }, 400)
  }, [busqueda])

  const seleccionarSugerencia = (item) => {
    setForm({ ...form, lugar: item.display_name })
    setCoordenadas({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) })
    setBusqueda(item.display_name)
    setSugerencias([])
  }

  const seleccionarEnMapa = (lat, lng) => {
    setCoordenadas({ lat, lng })
    // Reverse geocoding para obtener el nombre del lugar
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    )
      .then((r) => r.json())
      .then((data) => {
        const nombre =
          data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        setForm((f) => ({ ...f, lugar: nombre }))
        setBusqueda(nombre)
      })
  }

  const handleImagenChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!coordenadas) {
      setError(
        'Por favor selecciona una ubicación en el mapa o busca una dirección.',
      )
      return
    }
    setCargando(true)
    setError('')

    let imagen_url = ''

    // Subir imagen al bucket si se ha seleccionado
    if (imagenFile) {
      const extension = imagenFile.name.split('.').pop()
      const nombreArchivo = `${session.user.id}/${Date.now()}.${extension}`
      const { error: errorSubida } = await supabase.storage
        .from('eventos')
        .upload(nombreArchivo, imagenFile)
      if (errorSubida) {
        setError('Error al subir la imagen. Inténtalo de nuevo.')
        setCargando(false)
        return
      }
      const { data: urlData } = supabase.storage
        .from('eventos')
        .getPublicUrl(nombreArchivo)
      imagen_url = urlData.publicUrl

      // Generar slug único a partir del título
      const slug = await generarSlugUnico(form.titulo, supabase)

      const { error: errorEvento } = await supabase.from('eventos').insert({
        titulo: form.titulo,
        descripcion: form.descripcion,
        lugar: form.lugar,
        fecha: form.fecha,
        latitud: coordenadas.lat,
        longitud: coordenadas.lng,
        imagen_url,
        creador_id: session.user.id,
        slug, // <-- añadido
      })
    }

    // Crear el evento en la base de datos
    const { error: errorEvento } = await supabase.from('eventos').insert({
      titulo: form.titulo,
      descripcion: form.descripcion,
      lugar: form.lugar,
      fecha: form.fecha,
      latitud: coordenadas.lat,
      longitud: coordenadas.lng,
      imagen_url,
      creador_id: session.user.id,
    })

    if (errorEvento) {
      setError('Error al crear el evento. Inténtalo de nuevo.')
    } else {
      onEventoCreado()
    }

    setCargando(false)
  }

  return (
    <div className='evento-form'>
      <div className='evento-form-header'>
        <h2>Nuevo evento</h2>
        <button onClick={onCancelar} className='btn-icon'>
          <X size={18} />
        </button>
      </div>

      {error && <p className='auth-error'>{error}</p>}

      <form onSubmit={handleSubmit} className='crear-form'>
        {/* Título */}
        <div className='form-grupo'>
          <label>Título del evento</label>
          <input
            type='text'
            name='titulo'
            value={form.titulo}
            onChange={handleChange}
            placeholder='Ej: Concentración coches clásicos Madrid'
            required
          />
        </div>

        {/* Fecha */}
        <div className='form-grupo'>
          <label>Fecha y hora</label>
          <input
            type='datetime-local'
            name='fecha'
            value={form.fecha}
            onChange={handleChange}
            required
          />
        </div>

        {/* Buscador de ubicación */}
        <div className='form-grupo'>
          <label>Ubicación</label>
          <div className='buscador-wrap'>
            <Search size={16} className='form-icono' />
            <input
              type='text'
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder='Busca una dirección o haz clic en el mapa...'
            />
          </div>
          {sugerencias.length > 0 && (
            <ul className='sugerencias-lista'>
              {sugerencias.map((s, i) => (
                <li key={i} onClick={() => seleccionarSugerencia(s)}>
                  <MapPin size={12} />
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Mapa interactivo */}
        <div className='form-grupo'>
          <label>
            {coordenadas
              ? '✓ Ubicación seleccionada — haz clic para cambiarla'
              : 'Haz clic en el mapa para seleccionar la ubicación'}
          </label>
          <div className='mapa-selector'>
            <MapContainer
              center={[40.4168, -3.7038]}
              zoom={6}
              style={{ height: '300px', width: '100%', borderRadius: '10px' }}
            >
              <TileLayer
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                attribution='© OpenStreetMap'
              />
              <SelectorUbicacion onSeleccionar={seleccionarEnMapa} />
              {coordenadas && (
                <Marker position={[coordenadas.lat, coordenadas.lng]} />
              )}
            </MapContainer>
          </div>
        </div>

        {/* Descripción */}
        <div className='form-grupo'>
          <label>Descripción (opcional)</label>
          <textarea
            name='descripcion'
            value={form.descripcion}
            onChange={handleChange}
            rows={3}
            placeholder='Describe el evento, qué tipo de coches se esperan, normas...'
          />
        </div>

        {/* Imagen */}
        <div className='form-grupo'>
          <label>Imagen del evento (opcional)</label>
          <label className='upload-area'>
            <input
              type='file'
              accept='image/*'
              onChange={handleImagenChange}
              style={{ display: 'none' }}
            />
            {imagenPreview ? (
              <img
                src={imagenPreview}
                alt='preview'
                className='upload-preview'
              />
            ) : (
              <div className='upload-placeholder'>
                <Upload size={24} />
                <span>Haz clic para seleccionar una imagen</span>
                <span className='upload-hint'>
                  JPG, PNG, WEBP — desde tu dispositivo o móvil
                </span>
              </div>
            )}
          </label>
        </div>

        <button
          type='submit'
          className='btn-primary btn-full'
          disabled={cargando}
        >
          {cargando ? 'Creando evento...' : 'Crear evento'}
        </button>
      </form>
    </div>
  )
}

export default CrearEventoForm
