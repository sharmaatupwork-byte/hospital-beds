import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  const { name, address, city, state, pincode, phone, pin, lat, lng, beds } = await req.json()

  if (!name || !city || !state || !phone || !pin || !lat || !lng) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: hosp, error: hospError } = await supabaseAdmin
    .from('hospitals')
    .insert({
      name, address, city, state, pincode, phone, pin,
      location: `POINT(${lng} ${lat})`
    })
    .select()
    .single()

  if (hospError) return NextResponse.json({ error: hospError.message }, { status: 500 })

  const BED_TYPES = ['ICU', 'General', 'HDU', 'Ventilator']
  const bedRows = BED_TYPES.map(type => ({
    hospital_id: hosp.id,
    bed_type: type,
    total_beds: beds?.[type] ?? 0,
    available_beds: beds?.[type] ?? 0
  }))

  const { error: bedError } = await supabaseAdmin.from('bed_inventory').insert(bedRows)
  if (bedError) return NextResponse.json({ error: bedError.message }, { status: 500 })

  return NextResponse.json({ hospital: hosp })
}
