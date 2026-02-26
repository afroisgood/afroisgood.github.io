import { createClient } from '@supabase/supabase-js'

// 請將下方的網址與金鑰替換成你 Supabase 官網後台看到的內容
const supabaseUrl = 'https://psjppsbawwcksyvynfwe.supabase.co'
const supabaseAnonKey = 'sb_publishable_030XccMcJ3cjy6l2hdn02A_QCrOwWmq'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)