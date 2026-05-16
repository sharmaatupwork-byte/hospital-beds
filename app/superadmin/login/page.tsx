'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true); setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError('Invalid email or password'); setLoading(false); return }
    const { data: adminData } = await supabase.from('admins').select('user_id').eq('user_id', data.user.id).single()
    if (!adminData) { setError('You are not authorized as an admin'); await supabase.auth.signOut(); setLoading(false); return }
    router.push('/superadmin')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'slideUp 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: '#fff', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>⚕️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>Hospital Beds</h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontFamily: 'DM Mono, monospace' }}>Super Admin Portal</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0', padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Admin Sign In</h2>
          <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>Access the hospital management dashboard</p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Email</label>
            <input type="email" placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', fontFamily: 'inherit' }} />
          </div>
          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626', fontWeight: 500 }}>⚠️ {error}</div>}
          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: loading ? '#94A3B8' : '#0F172A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#CBD5E1', fontFamily: 'DM Mono, monospace' }}>AUTHORISED PERSONNEL ONLY</p>
      </div>
    </div>
  )
}
