// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfpacewgyctqtqnlbvhj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcGFjZXdneWN0cXRxbmxidmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTQxNjUsImV4cCI6MjA2NDczMDE2NX0.voerUotXFpQLoTwr-1Ky9RiO6dmDmQ3Aq_IZxXdPD2Q' 

export const supabase = createClient(supabaseUrl, supabaseKey)
