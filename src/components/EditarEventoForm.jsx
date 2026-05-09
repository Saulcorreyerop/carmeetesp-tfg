import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { X, Save } from 'lucide-react'
import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE_ID = 'service_0f4bfol'
const EMAILJS_TEMPLATE_ID = 'template_lo3isbm'
const EMAILJS_PUBLIC_KEY = '7BYyyqjywJ_HQasag'

const EditarEventoForm = ({ evento, onEventoEditado, onCancelar }) => {
  const [form, setForm] = useState({
    titulo: evento.titulo || '',
    descripcion: evento.descripcion || '',
    lugar: evento.lugar || '',
    fecha: evento.fecha
      ? new Date(evento.fecha).toISOString().slice(0, 16)
      : '',
  })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const notificarAsistentes = async (datosNuevos, cambios) => {
    try {
      // Obtener todos los asistentes del evento con su email
      const { data: inscripciones } = await supabase
        .from('inscripciones')
        .select('usuario_id, usuarios(nombre, email)')
        .eq('evento_id', evento.id)

      if (!inscripciones || inscripciones.length === 0) return

      // Formatear la fecha para el email
      const fechaFormateada = new Date(datosNuevos.fecha).toLocaleDateString(
        'es-ES',
        {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Madrid',
        },
      )

      const urlEvento = `${window.location.origin}/eventos/${evento.slug || evento.id}`

      // Enviar email a cada asistente
      const promesas = inscripciones.map((ins) => {
        if (!ins.usuarios?.email) return Promise.resolve()
        return emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            nombre_asistente: ins.usuarios.nombre || 'Usuario',
            evento_titulo: datosNuevos.titulo,
            evento_fecha: fechaFormateada,
            evento_lugar: datosNuevos.lugar,
            cambios: cambios,
            evento_url: urlEvento,
            to_email: ins.usuarios.email,
          },
          EMAILJS_PUBLIC_KEY,
        )
      })

      await Promise.all(promesas)
      console.log(
        'Notificaciones enviadas a',
        inscripciones.length,
        'asistentes',
      )
    } catch (err) {
      console.warn('Error enviando notificaciones:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (new Date(form.fecha) < new Date()) {
      setError('No puedes poner una fecha pasada.')
      return
    }
    setCargando(true)
    setError('')

    // Detectar qué ha cambiado
    const cambiosList = []
    if (form.titulo !== evento.titulo) cambiosList.push('Título')
    if (form.lugar !== evento.lugar) cambiosList.push('Lugar')
    if (form.descripcion !== evento.descripcion) cambiosList.push('Descripción')
    if (form.fecha !== new Date(evento.fecha).toISOString().slice(0, 16))
      cambiosList.push('Fecha y hora')
    const cambios =
      cambiosList.length > 0 ? cambiosList.join(', ') : 'Información general'

    const { error: errorUpdate } = await supabase
      .from('eventos')
      .update({
        titulo: form.titulo,
        descripcion: form.descripcion,
        lugar: form.lugar,
        fecha: new Date(form.fecha).toISOString(),
      })
      .eq('id', evento.id)

    if (errorUpdate) {
      setError('Error al guardar los cambios.')
      setCargando(false)
      return
    }

    // Notificar a los asistentes en segundo plano
    await notificarAsistentes(form, cambios)

    onEventoEditado()
    setCargando(false)
  }

  return (
    <div className='evento-form'>
      <div className='evento-form-header'>
        <h2>Editar evento</h2>
        <button onClick={onCancelar} className='btn-icon'>
          <X size={18} />
        </button>
      </div>

      {error && <p className='auth-error'>{error}</p>}

      <form onSubmit={handleSubmit} className='crear-form'>
        <div className='form-grupo'>
          <label>Título del evento</label>
          <input
            type='text'
            name='titulo'
            value={form.titulo}
            onChange={handleChange}
            required
          />
        </div>

        <div className='form-grupo'>
          <label>Fecha y hora</label>
          <input
            type='datetime-local'
            name='fecha'
            value={form.fecha}
            onChange={handleChange}
            min={new Date().toISOString().slice(0, 16)}
            required
          />
        </div>

        <div className='form-grupo'>
          <label>Lugar</label>
          <input
            type='text'
            name='lugar'
            value={form.lugar}
            onChange={handleChange}
            required
          />
        </div>

        <div className='form-grupo'>
          <label>Descripción (opcional)</label>
          <textarea
            name='descripcion'
            value={form.descripcion}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <button
          type='submit'
          className='btn-primary btn-full'
          disabled={cargando}
        >
          <Save size={16} />
          {cargando ? 'Guardando y notificando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}

export default EditarEventoForm
