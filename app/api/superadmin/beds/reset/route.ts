import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  const { hospital_id, bed_type, total } = await req.json()

  if (!hospital_id || !bed_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('bed_inventory')
    .update({ available_beds: total })
    .eq('hospital_id', hospital_id)
    .eq('bed_type', bed_type)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
