import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables')
}

export const supabaseServer = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)

// Server-side helpers for API routes
export const supabaseServerHelpers = {
  // Admin operations (use service key for these)
  createUser: async (email: string, password: string, metadata?: any) => {
    return await supabaseServer.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata
    })
  },

  // Database operations
  from: (table: string) => supabaseServer.from(table),
  
  // Storage operations
  storage: {
    upload: async (bucket: string, path: string, file: Buffer | ArrayBuffer) => {
      return await supabaseServer.storage
        .from(bucket)
        .upload(path, file)
    },
    
    download: async (bucket: string, path: string) => {
      return await supabaseServer.storage
        .from(bucket)
        .download(path)
    }
  }
}

export default supabaseServer