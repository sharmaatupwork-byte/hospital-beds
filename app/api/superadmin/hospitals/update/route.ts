import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  const { id, form, beds } = await req.json()

  if (!id) return NextResponse.json({ error: 'Missing hospital id' }, { status: 400 })

  const { error: hospError } = await supabaseAdmin
    .from('hospitals')
    .update({ ...form })
    .eq('id', id)

  if (hospError) return NextResponse.json({ error: hospError.message }, { status: 500 })

  const BED_TYPES = ['ICU', 'General', 'HDU', 'Ventilator']
  for (const type of BED_TYPES) {
    if (beds?.[type] !== undefined) {
      await supabaseAdmin
        .from('bed_inventory')
        .update({ total_beds: beds[type].total })
        .eq('hospital_id', id)
        .eq('bed_type', type)
    }
  }

  return NextResponse.json({ ok: true })
}
