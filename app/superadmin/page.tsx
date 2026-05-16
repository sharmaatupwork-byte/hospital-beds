'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Hospital = {
  id: string; name: string; city: string; state: string; phone: string; pin: string; updated_at: string
  bed_inventory: { bed_type: string; available_beds: number; total_beds: number }[]
}

export default function SuperAdminDashboard() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('')
  const [toast, setToast] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchHospitals()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/superadmin/login'); return }
    const { data: admin } = await supabase.from('admins').select('name').eq('user_id', session.user.id).single()
    if (!admin) { router.push('/superadmin/login'); return }
    setAdminName(admin.name)
  }

  async function fetchHospitals() {
    const { data } = await supabase.from('hospitals').select('*, bed_inventory(bed_type, available_beds, total_beds)').order('name')
    if (data) setHospitals(data)
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/superadmin/login')
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function isStale(updatedAt: string) {
    return (Date.now() - new Date(updatedAt).getTime()) > 4 * 60 * 60 * 1000
  }

  const totalHospitals = hospitals.length
  const totalICU = hospitals.reduce((s, h) => s + (h.bed_inventory?.find(b => b.bed_type === 'ICU')?.available_beds ?? 0), 0)
  const staleCount = hospitals.filter(h => isStale(h.updated_at)).length

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 14, fontWeight: 600, color: '#0F172A', animation: 'toastIn 0.3s ease' }}>{toast}</div>
      )}

      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: '16px 20px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>⚕️</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Hospital Beds</span>
                <span style={{ fontSize: 11, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontFamily: 'monospace' }}>SUPER ADMIN</span>
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>Welcome, {adminName}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => router.push('/superadmin/hospitals/new')}
                style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#0F172A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Add Hospital
              </button>
              <button onClick={logout}
                style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Total Hospitals', value: totalHospitals, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: '🏥' },
              { label: 'ICU Beds Free', value: totalICU, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '🫁' },
              { label: 'Stale Data (4h+)', value: staleCount, color: staleCount > 0 ? '#D97706' : '#16A34A', bg: staleCount > 0 ? '#FFFBEB' : '#F0FDF4', border: staleCount > 0 ? '#FDE68A' : '#BBF7D0', icon: '⚠️' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '16px 20px' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'DM Mono, monospace' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>All Hospitals</h2>

          {loading ? (
            <p style={{ color: '#94A3B8', fontSize: 14 }}>Loading...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {hospitals.map((h, i) => {
                const stale = isStale(h.updated_at)
                const icu = h.bed_inventory?.find(b => b.bed_type === 'ICU')
                return (
                  <div key={h.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, animation: `slideUp 0.3s ease ${i * 0.05}s both`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{h.name}</span>
                        {stale && <span style={{ fontSize: 10, background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 20, padding: '1px 8px', fontWeight: 700 }}>STALE</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{h.city}, {h.state} · 📞 {h.phone}</div>
                      <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>
                        PIN: {h.pin ?? 'not set'} · ICU: {icu?.available_beds ?? 0}/{icu?.total_beds ?? 0} · Updated: {new Date(h.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button onClick={() => router.push(`/superadmin/hospitals/${h.id}`)}
                      style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      Manage →
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
