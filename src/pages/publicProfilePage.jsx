import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { MapPin, Calendar, ArrowLeft, Car } from 'lucide-react'

const PublicProfilePage = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)

      const { data: perfilData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()
      setPerfil(perfilData)

      const { data: eventosData } = await supabase
        .from('eventos')
        .select('id, titulo, fecha, lugar, slug')
        .eq('creador_id', userId)
        .order('fecha', { ascending: false })
      setEventos(eventosData || [])

      setCargando(false)
    }
    cargar()
  }, [userId])

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  if (cargando) return <div className="loading">Cargando perfil...</div>
  if (!perfil) return (
    <div className="page-container">
      <p className="texto-suave">Usuario no encontrado.</p>
    </div>
  )

  return (
    <div className="page-container">
      <button className="btn-volver" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="perfil-layout">
        <div className="perfil-card">
          <div className="perfil-avatar-wrap">
            {perfil.foto_url ? (
              <img src={perfil.foto_url} alt={perfil.nombre} className="perfil-avatar" />
            ) : (
              <div className="perfil-avatar-placeholder">
                {perfil.nombre?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>

          <div className="perfil-info">
            <h2 className="perfil-nombre">{perfil.nombre}</h2>
            {perfil.ciudad && (
              <p className="perfil-dato"><MapPin size={14} />{perfil.ciudad}</p>
            )}
            {perfil.bio && (
              <p className="perfil-bio">{perfil.bio}</p>
            )}
          </div>
        </div>

        <div className="perfil-panel">
          <div className="perfil-seccion">
            <h2>Eventos organizados ({eventos.length})</h2>
            {eventos.length === 0 ? (
              <p className="texto-suave">Este usuario no ha creado eventos todavía.</p>
            ) : (
              <div className="perfil-lista">
                {eventos.map(evento => (
                  <div
                    key={evento.id}
                    className="perfil-lista-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/eventos/${evento.slug || evento.id}`)}
                  >
                    <p className="perfil-lista-titulo">{evento.titulo}</p>
                    <p className="evento-dato"><MapPin size={12} />{evento.lugar}</p>
                    <p className="evento-dato"><Calendar size={12} />{formatearFecha(evento.fecha)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicProfilePage