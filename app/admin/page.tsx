'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BED_TYPES = ['ICU', 'General', 'HDU', 'Ventilator']
const BED_META: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  ICU:        { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '🫁' },
  General:    { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', icon: '🛏️' },
  HDU:        { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '💊' },
  Ventilator: { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: '🌬️' },
}

type Hospital = { id: string; name: string; city: string }
type BedData = Record<string, { available: number; total: number }>

export default function AdminPage() {
  const [step, setStep] = useState<'login' | 'dashboard'>('login')
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hospitalName, setHospitalName] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [beds, setBeds] = useState<BedData>({})
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    supabase.from('hospitals').select('id, name, city').then(({ data }) => {
      if (data) setHospitals(data)
    })
    const saved = localStorage.getItem('hb_hospital_id')
    const savedName = localStorage.getItem('hb_hospital_name')
    if (saved && savedName) {
      setHospitalId(saved)
      setHospitalName(savedName)
      setStep('dashboard')
      fetchBeds(saved)
    }
  }, [])

  async function fetchBeds(hid: string) {
    const { data } = await supabase
      .from('bed_inventory')
      .select('bed_type, available_beds, total_beds')
      .eq('hospital_id', hid)
    if (data) {
      const mapped: BedData = {}
      data.forEach((b: any) => { mapped[b.bed_type] = { available: b.available_beds, total: b.total_beds } })
      setBeds(mapped)
    }
  }

  async function handleLogin() {
    if (!selectedId || !pin) { setError('Please select your hospital and enter your PIN'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth/hospital', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospital_id: selectedId, pin })
    })
    const data = await res.json()
    if (!res.ok) { setError('Invalid PIN. Please try again.'); setLoading(false); return }
    localStorage.setItem('hb_hospital_id', data.hospital_id)
    localStorage.setItem('hb_hospital_name', data.hospital_name)
    setHospitalId(data.hospital_id)
    setHospitalName(data.hospital_name)
    setStep('dashboard')
    fetchBeds(data.hospital_id)
    setLoading(false)
  }

  async function updateBed(bedType: string, delta: 1 | -1) {
    setUpdating(bedType)
    const res = await fetch('/api/beds/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospital_id: hospitalId, bed_type: bedType, delta, secret_key: 'icuconnect2024' })
    })
    const data = await res.json()
    if (res.ok) {
      setBeds(prev => ({
        ...prev,
        [bedType]: { ...prev[bedType], available: data.data.available_beds }
      }))
      showToast(delta === 1 ? '✅ Bed marked available' : '✅ Bed marked occupied')
    } else {
      showToast('❌ ' + data.error)
    }
    setUpdating(null)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function logout() {
    localStorage.removeItem('hb_hospital_id')
    localStorage.removeItem('hb_hospital_name')
    setStep('login'); setPin(''); setSelectedId(''); setBeds({})
  }

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 14, fontWeight: 600, color: '#0F172A', animation: 'toastIn 0.3s ease' }}>
          {toast}
        </div>
      )}

      {step === 'login' ? (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 420, animation: 'slideUp 0.4s ease' }}>

            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: '#fff', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>🏥</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>Hospital Beds</h1>
              <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontFamily: 'DM Mono, monospace' }}>Receptionist Portal</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0', padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Sign in to your hospital</h2>
              <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>Select your hospital and enter your PIN to continue</p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Your Hospital</label>
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: selectedId ? '#0F172A' : '#94A3B8', fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  <option value="">Select hospital...</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} — {h.city}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>PIN</label>
                <input
                  type="password"
                  placeholder="Enter your hospital PIN"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ width: '100%', padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', fontFamily: 'inherit', letterSpacing: 4 }}
                />
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: loading ? '#94A3B8' : '#0F172A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              >
                {loading ? 'Verifying...' : 'Sign In →'}
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#CBD5E1', fontFamily: 'DM Mono, monospace' }}>
              FOR HOSPITAL STAFF ONLY
            </p>
          </div>
        </div>

      ) : (
        <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>

          <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: '16px 20px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🏥</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: -0.3 }}>{hospitalName}</span>
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>Receptionist Dashboard</p>
              </div>
              <button
                onClick={logout}
                style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Sign Out
              </button>
            </div>
          </div>

          <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20, fontFamily: 'DM Mono, monospace' }}>
              Tap + when a bed becomes free · Tap − when a patient is admitted
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {BED_TYPES.map((type, i) => {
                const bed = beds[type] ?? { available: 0, total: 0 }
                const m = BED_META[type]
                const pct = bed.total > 0 ? (bed.available / bed.total) * 100 : 0
                const isUpdating = updating === type
                const status = bed.available === 0 ? { label: 'FULL', color: '#DC2626', bg: '#FEF2F2' }
                  : bed.available / bed.total < 0.2 ? { label: 'CRITICAL', color: '#D97706', bg: '#FEF3C7' }
                  : { label: 'AVAILABLE', color: '#16A34A', bg: '#DCFCE7' }

                return (
                  <div key={type} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', animation: `slideUp 0.4s ease ${i * 0.08}s both`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: m.color, borderRadius: '16px 0 0 16px' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{m.icon}</div>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>{type} Beds</div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: status.bg, color: status.color }}>{status.label}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{bed.available}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Mono, monospace' }}>of {bed.total} free</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <button
                            onClick={() => updateBed(type, 1)}
                            disabled={isUpdating || bed.available >= bed.total}
                            style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: bed.available >= bed.total ? '#F1F5F9' : '#F0FDF4', color: bed.available >= bed.total ? '#CBD5E1' : '#16A34A', fontSize: 22, fontWeight: 700, cursor: bed.available >= bed.total ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          >
                            +
                          </button>
                          <button
                            onClick={() => updateBed(type, -1)}
                            disabled={isUpdating || bed.available <= 0}
                            style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: bed.available <= 0 ? '#F1F5F9' : '#FEF2F2', color: bed.available <= 0 ? '#CBD5E1' : '#DC2626', fontSize: 22, fontWeight: 700, cursor: bed.available <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          >
                            −
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#F1F5F9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: m.color, borderRadius: 6, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Mono, monospace' }}>0</span>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Mono, monospace' }}>{bed.total} total</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <p style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: '#CBD5E1', fontFamily: 'DM Mono, monospace' }}>
              CHANGES ARE LIVE INSTANTLY · HOSPITAL BEDS INDIA
            </p>
          </div>
        </div>
      )}
    </>
  )
}
