import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const UpdateSchema = z.object({
  hospital_id: z.string().uuid(),
  bed_type: z.enum(['ICU', 'General', 'HDU', 'Ventilator']),
  delta: z.union([z.literal(1), z.literal(-1)]),
  secret_key: z.string()
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { hospital_id, bed_type, delta, secret_key } = parsed.data

  if (secret_key !== process.env.RECEPTIONIST_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase.rpc('update_bed_count', {
    p_hospital_id: hospital_id,
    p_bed_type: bed_type,
    p_delta: delta,
    p_user_id: null
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
