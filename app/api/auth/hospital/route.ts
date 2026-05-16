import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { hospital_id, pin } = await req.json()
  const { data, error } = await supabase
    .from('hospitals')
    .select('id, name, pin')
    .eq('id', hospital_id)
    .eq('pin', pin)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }
  return NextResponse.json({ success: true, hospital_id: data.id, hospital_name: data.name })
}
