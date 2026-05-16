import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { hospital_id, bed_type } = await req.json()

  if (!hospital_id) {
    return NextResponse.json({ error: 'hospital_id required' }, { status: 400 })
  }

  const query = supabase.rpc('reset_beds', {
    p_hospital_id: hospital_id,
    p_bed_type: bed_type ?? null,
  })

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
