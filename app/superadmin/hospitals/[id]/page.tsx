'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

const BED_TYPES = ['ICU', 'General', 'HDU', 'Ventilator']

export default function ManageHospital() {
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', pincode: '', phone: '', pin: '' })
  const [beds, setBeds] = useState<Record<string, { total: number; available: number }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: h } = await supabase.from('hospitals').select('*').eq('id', id).single()
    if (h) setForm({ name: h.name, address: h.address, city: h.city, state: h.state, pincode: h.pincode, phone: h.phone, pin: h.pin ?? '' })
    const { data: b } = await supabase.from('bed_inventory').select('*').eq('hospital_id', id)
    if (b) {
      const mapped: Record<string, { total: number; available: number }> = {}
      b.forEach((row: any) => { mapped[row.bed_type] = { total: row.total_beds, available: row.available_beds } })
      setBeds(mapped)
    }
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function saveHospital() {
    setSaving(true)
    const res = await fetch('/api/superadmin/hospitals/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, form, beds })
    })
    const data = await res.json()
    if (!res.ok) { showToast('❌ ' + (data.error ?? 'Failed to save')); setSaving(false); return }
    showToast('✅ Hospital updated successfully')
    setSaving(false)
  }

  async function resetBeds(type: string) {
    const total = beds[type]?.total ?? 0
    const res = await fetch('/api/superadmin/beds/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospital_id: id, bed_type: type, total })
    })
    if (res.ok) {
      setBeds(prev => ({ ...prev, [type]: { ...prev[type], available: total } }))
      showToast(`✅ ${type} beds reset to ${total}`)
    } else {
      showToast('❌ Failed to reset beds')
    }
  }

  async function resetAllBeds() {
    for (const type of BED_TYPES) { await resetBeds(type) }
    showToast('✅ All beds reset to full capacity')
  }

  const inputStyle = { width: '100%', padding: '11px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', fontFamily: 'inherit' }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }
  const BED_META: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    ICU: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '🫁' },
    General: { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', icon: '🛏️' },
    HDU: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '💊' },
    Ventilator: { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: '🌬️' },
  }

  if (loading) return <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>Loading...</div>

  return (
    <>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 14, fontWeight: 600, color: '#0F172A', animation: 'toastIn 0.3s ease' }}>{toast}</div>}

      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: '16px 20px' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => router.push('/superadmin')} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{form.name}</h1>
                <p style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'DM Mono, monospace' }}>Manage hospital settings</p>
              </div>
            </div>
            <button onClick={resetAllBeds} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #FDE68A', background: '#FFFBEB', color: '#D97706', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              🔄 Reset All Beds
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 28, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Hospital Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { field: 'name', label: 'Hospital Name', full: true },
                { field: 'address', label: 'Address', full: true },
                { field: 'city', label: 'City' }, { field: 'state', label: 'State' },
                { field: 'pincode', label: 'Pincode' }, { field: 'phone', label: 'Phone' },
                { field: 'pin', label: 'Receptionist PIN' },
              ].map(f => (
                <div key={f.field} style={{ gridColumn: f.full ? '1 / -1' : undefined }}>
                  <label style={labelStyle}>{f.label}</label>
                  <input value={form[f.field as keyof typeof form]} onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 28, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Bed Management</h2>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>Update total capacity or reset available count to full</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {BED_TYPES.map(type => {
                const m = BED_META[type]
                const bed = beds[type] ?? { total: 0, available: 0 }
                const pct = bed.total > 0 ? (bed.available / bed.total) * 100 : 0
                return (
                  <div key={type} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 14, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{m.icon}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{type}</span>
                        <span style={{ fontSize: 12, color: m.color, fontWeight: 600, fontFamily: 'monospace' }}>{bed.available}/{bed.total} free</span>
                      </div>
                      <button onClick={() => resetBeds(type)} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${m.border}`, background: '#fff', color: m.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Reset
                      </button>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 6, height: 6, marginBottom: 12, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: m.color, borderRadius: 6, transition: 'width 0.4s ease' }} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, color: m.color }}>Total Beds</label>
                      <input type="number" min="0" value={bed.total}
                        onChange={e => setBeds(prev => ({ ...prev, [type]: { ...prev[type], total: parseInt(e.target.value) || 0 } }))}
                        style={{ ...inputStyle, background: '#fff', fontWeight: 700, fontSize: 16, width: 120 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button onClick={saveHospital} disabled={saving}
            style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: saving ? '#94A3B8' : '#0F172A', color: '#fff', fontSize: 16, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}
