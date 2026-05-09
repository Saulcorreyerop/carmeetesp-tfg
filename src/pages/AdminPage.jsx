import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAdmin } from '../hooks/useAdmin'
import {
  Trash2,
  Calendar,
  MapPin,
  Car,
  Shield,
  Users,
  Crown,
} from 'lucide-react'

const AdminPage = ({ session }) => {
  const navigate = useNavigate()
  const esAdmin = useAdmin(session)
  const [tab, setTab] = useState('eventos')
  const [eventos, setEventos] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (esAdmin === false) navigate('/')
  }, [esAdmin])

  useEffect(() => {
    if (esAdmin === true) cargarDatos()
  }, [tab, esAdmin])

  const cargarDatos = async () => {
    setCargando(true)
    if (tab === 'eventos') {
      const { data } = await supabase
        .from('eventos')
        .select('*, usuarios(nombre, email)')
        .order('created_at', { ascending: false })
      setEventos(data || [])
    } else if (tab === 'vehiculos') {
      const { data } = await supabase
        .from('vehiculos')
        .select('*, usuarios(nombre, email)')
        .order('created_at', { ascending: false })
      setVehiculos(data || [])
    } else if (tab === 'usuarios') {
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })
      setUsuarios(data || [])
    }
    setCargando(false)
  }

  const eliminarEvento = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return
    await supabase.from('eventos').delete().eq('id', id)
    cargarDatos()
  }

  const eliminarVehiculo = async (id) => {
    if (!confirm('¿Eliminar este vehículo?')) return
    await supabase.from('vehiculos').delete().eq('id', id)
    cargarDatos()
  }

  const eliminarUsuario = async (id) => {
    if (id === session.user.id) {
      alert('No puedes eliminarte a ti mismo.')
      return
    }
    if (!confirm('¿Eliminar este usuario? Se eliminarán todos sus datos.'))
      return
    await supabase.from('usuarios').delete().eq('id', id)
    cargarDatos()
  }

  const toggleAdmin = async (id, esAdminActual) => {
    if (id === session.user.id) {
      alert('No puedes modificar tu propio rol.')
      return
    }
    const accion = esAdminActual
      ? 'quitar permisos de admin a'
      : 'hacer admin a'
    if (!confirm(`¿Seguro que quieres ${accion} este usuario?`)) return
    await supabase
      .from('usuarios')
      .update({ es_admin: !esAdminActual })
      .eq('id', id)
    cargarDatos()
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Madrid',
    })
  }

  if (esAdmin === null)
    return <div className='loading'>Verificando permisos...</div>
  if (!esAdmin) return null

  return (
    <div className='page-container'>
      <div className='page-header'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={28} color='#f97316' />
          <div>
            <h1 className='page-titulo'>Panel de administración</h1>
            <p className='page-subtitulo'>
              Gestión de contenido de CarMeet ESP
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className='admin-stats'>
        <div className='admin-stat-card'>
          <Calendar size={20} color='#2563eb' />
          <div>
            <p className='admin-stat-num'>{eventos.length}</p>
            <p className='admin-stat-label'>Eventos totales</p>
          </div>
        </div>
        <div className='admin-stat-card'>
          <Car size={20} color='#0f6e56' />
          <div>
            <p className='admin-stat-num'>{vehiculos.length}</p>
            <p className='admin-stat-label'>Vehículos totales</p>
          </div>
        </div>
        <div className='admin-stat-card'>
          <Users size={20} color='#7c3aed' />
          <div>
            <p className='admin-stat-num'>{usuarios.length}</p>
            <p className='admin-stat-label'>Usuarios registrados</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='admin-tabs'>
        <button
          className={`admin-tab ${tab === 'eventos' ? 'admin-tab-activo' : ''}`}
          onClick={() => setTab('eventos')}
        >
          <Calendar size={16} /> Eventos
        </button>
        <button
          className={`admin-tab ${tab === 'vehiculos' ? 'admin-tab-activo' : ''}`}
          onClick={() => setTab('vehiculos')}
        >
          <Car size={16} /> Vehículos
        </button>
        <button
          className={`admin-tab ${tab === 'usuarios' ? 'admin-tab-activo' : ''}`}
          onClick={() => setTab('usuarios')}
        >
          <Users size={16} /> Usuarios
        </button>
      </div>

      {cargando ? (
        <p className='texto-suave'>Cargando...</p>
      ) : tab === 'eventos' ? (
        <div className='admin-lista'>
          {eventos.length === 0 ? (
            <p className='texto-suave'>No hay eventos.</p>
          ) : (
            eventos.map((evento) => (
              <div key={evento.id} className='admin-item'>
                {evento.imagen_url && (
                  <img
                    src={evento.imagen_url}
                    alt={evento.titulo}
                    className='admin-item-img'
                  />
                )}
                <div className='admin-item-info'>
                  <p className='admin-item-titulo'>{evento.titulo}</p>
                  <p className='admin-item-meta'>
                    <Calendar size={13} />
                    {formatearFecha(evento.fecha)}
                  </p>
                  <p className='admin-item-meta'>
                    <MapPin size={13} />
                    {evento.lugar}
                  </p>
                  <p className='admin-item-autor'>
                    Por: {evento.usuarios?.nombre} ({evento.usuarios?.email})
                  </p>
                </div>
                <div className='admin-item-acciones'>
                  <button
                    className='btn-accion'
                    onClick={() =>
                      navigate(`/eventos/${evento.slug || evento.id}`)
                    }
                  >
                    Ver
                  </button>
                  <button
                    className='btn-accion btn-accion-peligro'
                    onClick={() => eliminarEvento(evento.id)}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : tab === 'vehiculos' ? (
        <div className='admin-lista'>
          {vehiculos.length === 0 ? (
            <p className='texto-suave'>No hay vehículos.</p>
          ) : (
            vehiculos.map((vehiculo) => (
              <div key={vehiculo.id} className='admin-item'>
                {vehiculo.imagen_url ? (
                  <img
                    src={vehiculo.imagen_url}
                    alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                    className='admin-item-img'
                  />
                ) : (
                  <div className='admin-item-img admin-item-noimg'>
                    <Car size={32} />
                  </div>
                )}
                <div className='admin-item-info'>
                  <p className='admin-item-titulo'>
                    {vehiculo.marca} {vehiculo.modelo}
                  </p>
                  {vehiculo.anio && (
                    <p className='admin-item-meta'>📅 {vehiculo.anio}</p>
                  )}
                  <p className='admin-item-meta'>
                    {vehiculo.tipo === 'car' ? '🚗 Coche' : '🏍️ Moto'}
                  </p>
                  <p className='admin-item-autor'>
                    Por: {vehiculo.usuarios?.nombre} ({vehiculo.usuarios?.email}
                    )
                  </p>
                </div>
                <div className='admin-item-acciones'>
                  <button
                    className='btn-accion'
                    onClick={() => navigate(`/garaje/${vehiculo.id}`)}
                  >
                    Ver
                  </button>
                  <button
                    className='btn-accion btn-accion-peligro'
                    onClick={() => eliminarVehiculo(vehiculo.id)}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className='admin-lista'>
          {usuarios.length === 0 ? (
            <p className='texto-suave'>No hay usuarios.</p>
          ) : (
            usuarios.map((usuario) => (
              <div key={usuario.id} className='admin-item'>
                {usuario.foto_url ? (
                  <img
                    src={usuario.foto_url}
                    alt={usuario.nombre}
                    className='admin-item-img'
                    style={{ borderRadius: '50%' }}
                  />
                ) : (
                  <div
                    className='admin-item-img admin-item-noimg'
                    style={{
                      borderRadius: '50%',
                      fontSize: '28px',
                      fontWeight: 'bold',
                    }}
                  >
                    {usuario.nombre?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className='admin-item-info'>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <p className='admin-item-titulo'>{usuario.nombre}</p>
                    {usuario.es_admin && (
                      <span
                        style={{
                          background: '#fff7ed',
                          color: '#f97316',
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '20px',
                          fontWeight: '500',
                          border: '1px solid #fed7aa',
                        }}
                      >
                        Admin
                      </span>
                    )}
                  </div>
                  <p className='admin-item-meta'>✉️ {usuario.email}</p>
                  {usuario.ciudad && (
                    <p className='admin-item-meta'>📍 {usuario.ciudad}</p>
                  )}
                  <p className='admin-item-autor'>
                    Registrado el {formatearFecha(usuario.created_at)}
                  </p>
                </div>
                <div className='admin-item-acciones'>
                  <button
                    className='btn-accion'
                    onClick={() => navigate(`/usuario/${usuario.id}`)}
                  >
                    Ver perfil
                  </button>
                  <button
                    className={`btn-accion ${usuario.es_admin ? 'btn-accion-activo-rojo' : ''}`}
                    onClick={() => toggleAdmin(usuario.id, usuario.es_admin)}
                    disabled={usuario.id === session.user.id}
                    title={usuario.es_admin ? 'Quitar admin' : 'Hacer admin'}
                  >
                    <Crown size={16} />
                    {usuario.es_admin ? 'Quitar admin' : 'Hacer admin'}
                  </button>
                  <button
                    className='btn-accion btn-accion-peligro'
                    onClick={() => eliminarUsuario(usuario.id)}
                    disabled={usuario.id === session.user.id}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default AdminPage
