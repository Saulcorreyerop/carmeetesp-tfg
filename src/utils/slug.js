// Convierte un título en un slug limpio
// Ej: "Concentración Madrid 2025!" → "concentracion-madrid-2025"
export const generarSlug = (titulo) => {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimina acentos
    .replace(/[^a-z0-9\s-]/g, '') // elimina caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // espacios por guiones
    .replace(/-+/g, '-') // guiones dobles por uno
}

// Genera un slug único añadiendo un número si ya existe
export const generarSlugUnico = async (titulo, supabase) => {
  const base = generarSlug(titulo)
  let slug = base
  let contador = 1

  while (true) {
    const { data } = await supabase
      .from('eventos')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!data) return slug // slug disponible

    slug = `${base}-${contador}`
    contador++
  }
}
