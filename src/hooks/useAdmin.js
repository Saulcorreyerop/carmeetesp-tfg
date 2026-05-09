import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export const useAdmin = (session) => {
  const [esAdmin, setEsAdmin] = useState(null) // null = cargando, false = no admin, true = admin

  useEffect(() => {
    if (!session?.user?.id) {
      setEsAdmin(false)
      return
    }
    supabase
      .from('usuarios')
      .select('es_admin')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setEsAdmin(data?.es_admin || false))
  }, [session])

  return esAdmin
}
