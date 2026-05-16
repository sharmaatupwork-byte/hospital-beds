'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BED_TYPES = ['ICU', 'General', 'HDU', 'Ventilator'] as const
const BED_META: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  ICU:        { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '🫁' },
  General:    { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', icon: '🛏️' },
  HDU:        { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '💊' },
  Ventilator: { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: '🌬️' },
}

type Hospital = {
  id: string; name: string; address: string; city: string; phone: string
  beds: Record<string, { available: number; total: number }>
}

function StatusPill({ available, total }: { available: number; total: number }) {
  if (available === 0) return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#FEE2E2', color: '#DC2626', letterSpacing: 0.5 }}>FULL</span>
  if (available / total < 0.2) return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#FEF3C7', color: '#D97706', letterSpacing: 0.5 }}>CRITICAL</span>
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#DCFCE7', color: '#16A34A', letterSpacing: 0.5 }}>AVAILABLE</span>
}

function BedBar({ available, total, color }: { available: number; total: number; color: string }) {
  const pct = total > 0 ? (available / total) * 100 : 0
  return (
    <div style={{ background: '#F1F5F9', borderRadius: 4, height: 6, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  )
}

function HospitalCard({ hospital, filter, index }: { hospital: Hospital; filter: string; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const bed = hospital.beds[filter] ?? { available: 0, total: 0 }
  const statusColor = bed.available === 0 ? '#DC2626' : bed.available / bed.total < 0.2 ? '#D97706' : '#16A34A'

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px', cursor: 'pointer', transition: 'all 0.2s ease', animation: `fadeUp 0.4s ease ${index * 0.07}s both`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: statusColor, borderRadius: '16px 0 0 16px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏥</div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A', letterSpacing: -0.3 }}>{hospital.name}</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>{hospital.address}</p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <StatusPill available={bed.available} total={bed.total} />
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{bed.available}</span>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>/ {bed.total}</span>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{filter} beds</div>
        </div>
      </div>

      <BedBar available={bed.available} total={bed.total} color={statusColor} />

      <div style={{ maxHeight: expanded ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ paddingTop: 16, marginTop: 16, borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {Object.entries(hospital.beds).map(([type, data]) => {
              const m = BED_META[type]
              if (!m) return null
              return (
                <div key={type} style={{ background: m.bg, borderRadius: 10, padding: '10px 12px', border: `1px solid ${m.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: m.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.icon} {type}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{data.available}<span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>/{data.total}</span></span>
                  </div>
                  <BedBar available={data.available} total={data.total} color={m.color} />
                </div>
              )
            })}
          </div>
          <a href={`tel:${hospital.phone}`} onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            📞 Call: {hospital.phone}
          </a>
        </div>
      </div>
      <div style={{ textAlign: 'right', marginTop: 8, fontSize: 11, color: '#CBD5E1' }}>{expanded ? '▲ less' : '▼ see all bed types'}</div>
    </div>
  )
}

export default function Home() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [filter, setFilter] = useState('ICU')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')

  async function fetchData() {
    const { data: hospData } = await supabase.from('hospitals').select('*')
    const { data: bedData } = await supabase.from('bed_inventory').select('*')
    if (!hospData || !bedData) return
    const mapped: Hospital[] = hospData.map((h: any) => {
      const hBeds = bedData.filter((b: any) => b.hospital_id === h.id)
      const beds: Record<string, { available: number; total: number }> = {}
      hBeds.forEach((b: any) => { beds[b.bed_type] = { available: b.available_beds, total: b.total_beds } })
      return { id: h.id, name: h.name, address: h.address, city: h.city, phone: h.phone, beds }
    })
    setHospitals(mapped)
    setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('bed_inventory_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bed_inventory' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(query.toLowerCase()) ||
    h.city.toLowerCase().includes(query.toLowerCase())
  )

  const totalICU = hospitals.reduce((s, h) => s + (h.beds['ICU']?.available ?? 0), 0)

  return (
    <>
      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>

        <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 20px 0' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>🏥</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5 }}>Hospital Beds</span>
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, fontFamily: "'DM Mono', monospace" }}>Real-time bed availability · India</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '6px 12px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A', animation: 'blink 2s ease infinite' }} />
                <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>LIVE</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'ICU Beds Free', value: totalICU, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
                { label: 'Hospitals', value: hospitals.length, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                { label: 'Last Sync', value: lastUpdated || '--:--', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ fontSize: s.label === 'Last Sync' ? 14 : 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'DM Mono', monospace" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ position: 'relative', marginBottom: 16 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
              <input type="text" placeholder="Search hospital name or city..." value={query} onChange={e => setQuery(e.target.value)}
                style={{ width: '100%', padding: '12px 16px 12px 42px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 14, color: '#0F172A', fontFamily: 'inherit' }} />
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              {BED_TYPES.map(type => {
                const m = BED_META[type]
                return (
                  <button key={type} onClick={() => setFilter(type)} style={{ flex: 1, padding: '8px 4px', borderRadius: '10px 10px 0 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: filter === type ? m.bg : 'transparent', color: filter === type ? m.color : '#94A3B8', borderBottom: filter === type ? `2px solid ${m.color}` : '2px solid transparent', transition: 'all 0.2s' }}>
                    {m.icon} {type}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 60px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', marginTop: 60, fontSize: 14 }}>Loading hospitals...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏥</div>
              <p>No hospitals found for "{query}"</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((h, i) => <HospitalCard key={h.id} hospital={h} filter={filter} index={i} />)}
            </div>
          )}
          <p style={{ textAlign: 'center', marginTop: 40, fontSize: 11, color: '#CBD5E1', fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
            REFRESHES EVERY 30s · EMERGENCIES: CALL 112
          </p>
        </div>
      </div>
    </>
  )
}
