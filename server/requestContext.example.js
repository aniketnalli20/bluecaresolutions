import { createSupabaseContext } from '@supabase/server'

export async function buildSupabaseRequestContext(request, auth = 'user') {
  const { data: context, error } = await createSupabaseContext(request, { auth })

  if (error) {
    throw error
  }

  return context
}
