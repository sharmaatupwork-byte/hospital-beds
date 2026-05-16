'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BED_TYPES = ['ICU', 'General', 'HDU', 'Ventilator']

export default function NewHospital() {
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', pincode: '', phone: '', pin: '', lat: '', lng: '' })
  const [beds, setBeds] = useState<Record<string, number>>({ ICU: 0, General: 0, HDU: 0, Ventilator: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function update(field: string, value: string) { setForm(prev => ({ ...prev, [field]: value })) }

  async function handleSubmit() {
    if (!form.name || !form.city || !form.state || !form.phone || !form.pin || !form.lat || !form.lng) {
      setError('Please fill all required fields including coordinates and PIN'); return
    }
    setLoading(true); setError('')
    const res = await fetch('/api/superadmin/hospitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, beds })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to create hospital'); setLoading(false); return }
    router.push('/superadmin')
  }

  const inputStyle = { width: '100%', padding: '11px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', fontFamily: 'inherit' }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: '16px 20px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/superadmin')} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Add New Hospital</h1>
            <p style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'DM Mono, monospace' }}>Fill in details and set bed capacity</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Hospital Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { field: 'name', label: 'Hospital Name *', placeholder: 'AIIMS Delhi', full: true },
              { field: 'address', label: 'Address', placeholder: 'Ansari Nagar', full: true },
              { field: 'city', label: 'City *', placeholder: 'New Delhi' },
              { field: 'state', label: 'State *', placeholder: 'Delhi' },
              { field: 'pincode', label: 'Pincode', placeholder: '110029' },
              { field: 'phone', label: 'Phone *', placeholder: '011-26588500' },
              { field: 'lat', label: 'Latitude *', placeholder: '28.5672' },
              { field: 'lng', label: 'Longitude *', placeholder: '77.2090' },
              { field: 'pin', label: 'Receptionist PIN *', placeholder: 'e.g. 4821' },
            ].map(f => (
              <div key={f.field} style={{ gridColumn: f.full ? '1 / -1' : undefined }}>
                <label style={labelStyle}>{f.label}</label>
                <input value={form[f.field as keyof typeof form]} onChange={e => update(f.field, e.target.value)} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 12, fontFamily: 'DM Mono, monospace' }}>
            💡 Get lat/lng from Google Maps → right-click any location → copy coordinates
          </p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Bed Capacity</h2>
          <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>Set total beds — available count starts at 100% and receptionists adjust from there</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {BED_TYPES.map(type => (
              <div key={type} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px' }}>
                <label style={labelStyle}>{type} Beds</label>
                <input type="number" min="0" value={beds[type]} onChange={e => setBeds(prev => ({ ...prev, [type]: parseInt(e.target.value) || 0 }))}
                  style={{ ...inputStyle, fontSize: 20, fontWeight: 700, background: '#fff' }} />
              </div>
            ))}
          </div>
        </div>

        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#DC2626', fontWeight: 500 }}>⚠️ {error}</div>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: loading ? '#94A3B8' : '#0F172A', color: '#fff', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Creating Hospital...' : '✅ Create Hospital'}
        </button>
      </div>
    </div>
  )
}
