import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'TU_URL_DE_SUPABASE_AQUI' // Sácalo de Settings -> API
const supabaseKey = 'TU_ANON_KEY_DE_SUPABASE_AQUI' // Sácalo de Settings -> API

export const supabase = createClient(supabaseUrl, supabaseKey)