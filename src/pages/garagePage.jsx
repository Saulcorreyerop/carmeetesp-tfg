import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Plus, Car, Upload, X, Search } from 'lucide-react'

const GaragePage = ({ session }) => {
  const navigate = useNavigate()
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [busquedaTexto, setBusquedaTexto] = useState('')

  // Estado del formulario
  const [tipo, setTipo] = useState('car')
  const [marcas, setMarcas] = useState([])
  const [modelos, setModelos] = useState([])
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('')
  const [modeloSeleccionado, setModeloSeleccionado] = useState('')
  const [cargandoMarcas, setCargandoMarcas] = useState(false)
  const [cargandoModelos, setCargandoModelos] = useState(false)
  const [anio, setAnio] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagenFile, setImagenFile] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarVehiculos()
  }, [])

  // Cargar marcas cuando cambia el tipo
  useEffect(() => {
    const tipoApi = tipo === 'car' ? 'passenger car' : 'motorcycle'
    setCargandoMarcas(true)
    setMarcas([])
    setMarcaSeleccionada('')
    setModelos([])
    setModeloSeleccionado('')
    fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/${tipoApi}?format=json`,
    )
      .then((r) => r.json())
      .then((data) => {
        const lista = data.Results || []
        lista.sort((a, b) => a.MakeName.localeCompare(b.MakeName))
        setMarcas(lista)
        setCargandoMarcas(false)
      })
      .catch(() => setCargandoMarcas(false))
  }, [tipo])

  // Cargar modelos cuando cambia la marca
  useEffect(() => {
    if (!marcaSeleccionada) return
    const tipoApi = tipo === 'car' ? 'passenger%20car' : 'motorcycle'
    const anioQuery = anio || new Date().getFullYear()
    setCargandoModelos(true)
    setModelos([])
    setModeloSeleccionado('')
    fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(marcaSeleccionada)}/vehicleType/${tipoApi}?format=json`,
    )
      .then((r) => r.json())
      .then((data) => {
        const lista = data.Results || []
        lista.sort((a, b) => a.Model_Name.localeCompare(b.Model_Name))
        setModelos(lista)
        setCargandoModelos(false)
      })
      .catch(() => setCargandoModelos(false))
  }, [marcaSeleccionada])

  const cargarVehiculos = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('vehiculos')
      .select('*, usuarios(nombre, foto_url)')
      .order('created_at', { ascending: false })
    setVehiculos(data || [])
    setCargando(false)
  }

  const handleImagenChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagenFile(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    if (!marcaSeleccionada || !modeloSeleccionado) {
      setError('Selecciona una marca y un modelo.')
      return
    }
    setGuardando(true)
    setError('')

    let imagen_url = ''
    if (imagenFile) {
      const extension = imagenFile.name.split('.').pop()
      const nombreArchivo = `${session.user.id}/${Date.now()}.${extension}`
      const { error: errorSubida } = await supabase.storage
        .from('vehiculos')
        .upload(nombreArchivo, imagenFile)
      if (!errorSubida) {
        const { data: urlData } = supabase.storage
          .from('vehiculos')
          .getPublicUrl(nombreArchivo)
        imagen_url = urlData.publicUrl
      }
    }

    const { error: errorVehiculo } = await supabase.from('vehiculos').insert({
      usuario_id: session.user.id,
      marca: marcaSeleccionada,
      modelo: modeloSeleccionado,
      anio: anio ? parseInt(anio) : null,
      tipo,
      descripcion,
      imagen_url,
    })

    if (errorVehiculo) {
      console.log('Error completo:', JSON.stringify(errorVehiculo))
      setError(
        'Error: ' + errorVehiculo.message + ' / ' + errorVehiculo.details,
      )
    } else {
      cargarVehiculos()
      setMostrarFormulario(false)
    }

    if (errorVehiculo) {
      setError('Error al guardar el vehículo.')
    } else {
      setMostrarFormulario(false)
      setMarcaSeleccionada('')
      setModeloSeleccionado('')
      setAnio('')
      setDescripcion('')
      setImagenFile(null)
      setImagenPreview(null)
      cargarVehiculos()
    }
    setGuardando(false)
  }

  const vehiculosFiltrados = vehiculos.filter((v) =>
    `${v.marca} ${v.modelo}`
      .toLowerCase()
      .includes(busquedaTexto.toLowerCase()),
  )

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div>
          <h1 className='page-titulo'>Garaje</h1>
          <p className='page-subtitulo'>Los vehículos de la comunidad</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {session && (
            <button
              className='btn-primary'
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
            >
              <Plus size={16} />
              {mostrarFormulario ? 'Cancelar' : 'Añadir vehículo'}
            </button>
          )}
        </div>
      </div>

      {/* Buscador */}
      <div className='garaje-buscador'>
        <Search size={16} className='form-icono' />
        <input
          type='text'
          placeholder='Buscar por marca o modelo...'
          value={busquedaTexto}
          onChange={(e) => setBusquedaTexto(e.target.value)}
        />
      </div>

      {/* Formulario */}
      {mostrarFormulario && (
        <div className='evento-form'>
          <div className='evento-form-header'>
            <h2>Añadir vehículo</h2>
            <button
              onClick={() => setMostrarFormulario(false)}
              className='btn-icon'
            >
              <X size={18} />
            </button>
          </div>

          {error && <p className='auth-error'>{error}</p>}

          <form onSubmit={handleGuardar} className='crear-form'>
            {/* Tipo */}
            <div className='form-grupo'>
              <label>Tipo de vehículo</label>
              <div className='tipo-selector'>
                <button
                  type='button'
                  className={`tipo-btn ${tipo === 'car' ? 'tipo-btn-activo' : ''}`}
                  onClick={() => setTipo('car')}
                >
                  🚗 Coche
                </button>
                <button
                  type='button'
                  className={`tipo-btn ${tipo === 'motorcycle' ? 'tipo-btn-activo' : ''}`}
                  onClick={() => setTipo('motorcycle')}
                >
                  🏍️ Moto
                </button>
              </div>
            </div>

            {/* Marca */}
            <div className='form-grupo'>
              <label>Marca {cargandoMarcas && '(cargando...)'}</label>
              <select
                value={marcaSeleccionada}
                onChange={(e) => setMarcaSeleccionada(e.target.value)}
                required
                disabled={cargandoMarcas}
              >
                <option value=''>Selecciona una marca</option>
                {marcas.map((m, i) => (
                  <option key={i} value={m.MakeName}>
                    {m.MakeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Modelo */}
            <div className='form-grupo'>
              <label>Modelo {cargandoModelos && '(cargando...)'}</label>
              <select
                value={modeloSeleccionado}
                onChange={(e) => setModeloSeleccionado(e.target.value)}
                required
                disabled={!marcaSeleccionada || cargandoModelos}
              >
                <option value=''>
                  {!marcaSeleccionada
                    ? 'Primero selecciona una marca'
                    : 'Selecciona un modelo'}
                </option>
                {modelos.map((m, i) => (
                  <option key={i} value={m.Model_Name}>
                    {m.Model_Name}
                  </option>
                ))}
              </select>
            </div>

            {/* Año */}
            <div className='form-grupo'>
              <label>Año (opcional)</label>
              <input
                type='number'
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                placeholder='Ej: 2019'
                min='1900'
                max={new Date().getFullYear() + 1}
              />
            </div>

            {/* Descripción */}
            <div className='form-grupo'>
              <label>Descripción (opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                placeholder='Cuéntanos algo sobre tu vehículo, modificaciones, historia...'
              />
            </div>

            {/* Imagen */}
            <div className='form-grupo'>
              <label>Foto del vehículo (opcional)</label>
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
                    <span>Haz clic para seleccionar una foto</span>
                    <span className='upload-hint'>JPG, PNG, WEBP</span>
                  </div>
                )}
              </label>
            </div>

            <button
              type='submit'
              className='btn-primary btn-full'
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Añadir al garaje'}
            </button>
          </form>
        </div>
      )}

      {/* Grid de vehículos */}
      {cargando ? (
        <p className='texto-suave'>Cargando vehículos...</p>
      ) : vehiculosFiltrados.length === 0 ? (
        <p className='texto-suave'>
          {busquedaTexto
            ? 'No se encontraron vehículos.'
            : 'No hay vehículos todavía. ¡Sé el primero!'}
        </p>
      ) : (
        <div className='eventos-grid'>
          {vehiculosFiltrados.map((vehiculo) => (
            <div
              key={vehiculo.id}
              className='evento-card'
              onClick={() => navigate(`/garaje/${vehiculo.id}`)}
            >
              {vehiculo.imagen_url ? (
                <img
                  src={vehiculo.imagen_url}
                  alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                  className='evento-imagen'
                />
              ) : (
                <div className='vehiculo-sin-imagen'>
                  <Car size={48} />
                </div>
              )}
              <div className='evento-info'>
                <h3 className='evento-titulo'>
                  {vehiculo.marca} {vehiculo.modelo}
                </h3>
                {vehiculo.anio && (
                  <p className='evento-dato'>📅 {vehiculo.anio}</p>
                )}
                <p className='evento-dato'>
                  {vehiculo.tipo === 'car' ? '🚗 Coche' : '🏍️ Moto'}
                </p>
                {vehiculo.descripcion && (
                  <p className='evento-descripcion'>{vehiculo.descripcion}</p>
                )}
                <div className='vehiculo-owner'>
                  {vehiculo.usuarios?.foto_url ? (
                    <img
                      src={vehiculo.usuarios.foto_url}
                      alt={vehiculo.usuarios.nombre}
                    />
                  ) : (
                    <div className='owner-avatar'>
                      {vehiculo.usuarios?.nombre?.charAt(0).toUpperCase() ||
                        '?'}
                    </div>
                  )}
                  <span>{vehiculo.usuarios?.nombre}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GaragePage
