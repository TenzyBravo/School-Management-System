import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type Term = {
    id: string
    name: string
    start_date: string
    end_date: string
    is_current: boolean
}

type AcademicYear = {
    id: string
    name: string
    start_date: string
    end_date: string
    is_current: boolean
    terms: Term[]
}

export default function CalendarManager() {
    const [years, setYears] = useState<AcademicYear[]>([])
    const [loading, setLoading] = useState(true)

    // New Year Form
    const [newYearName, setNewYearName] = useState('')
    const [newYearStart, setNewYearStart] = useState('')
    const [newYearEnd, setNewYearEnd] = useState('')

    useEffect(() => {
        fetchYears()
    }, [])

    function fetchYears() {
        setLoading(true)
        apiFetch('/api/v1/academic-years/')
            .then(r => r.json())
            .then(data => setYears(data.results ? data.results : data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    async function createYear(e: React.FormEvent) {
        e.preventDefault()
        try {
            const res = await apiFetch('/api/v1/academic-years/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newYearName,
                    start_date: newYearStart,
                    end_date: newYearEnd
                })
            })
            if (res.ok) {
                setNewYearName('')
                setNewYearStart('')
                setNewYearEnd('')
                fetchYears()
            } else {
                const err = await res.json()
                alert('Failed: ' + JSON.stringify(err))
            }
        } catch (err) {
            console.error(err)
        }
    }

    async function createTerm(e: React.FormEvent, yearId: string, name: string, start: string, end: string) {
        e.preventDefault()
        try {
            const res = await apiFetch('/api/v1/terms/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    academic_year: yearId,
                    name,
                    start_date: start,
                    end_date: end
                })
            })
            if (res.ok) {
                fetchYears() // Refresh to show new term
            } else {
                const err = await res.json()
                alert('Failed to add term: ' + JSON.stringify(err))
            }
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return <div>Loading calendar...</div>

    return (
        <div>
            <h4>Academic Years</h4>
            <form onSubmit={createYear} style={{ marginBottom: 16 }}>
                <input
                    placeholder="Year Name (e.g. 2025)"
                    value={newYearName}
                    onChange={e => setNewYearName(e.target.value)}
                    required
                />
                <input
                    type="date"
                    value={newYearStart}
                    onChange={e => setNewYearStart(e.target.value)}
                    required
                    style={{ marginLeft: 8 }}
                />
                <span style={{ margin: '0 4px' }}>to</span>
                <input
                    type="date"
                    value={newYearEnd}
                    onChange={e => setNewYearEnd(e.target.value)}
                    required
                />
                <button type="submit" style={{ marginLeft: 8 }}>Add Year</button>
            </form>

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {years.map(y => (
                    <li key={y.id} style={{ marginBottom: 16, border: '1px solid #eee', padding: 8, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>{y.name}</strong>
                            <span>{y.start_date} - {y.end_date} {y.is_current && "(Current)"}</span>
                        </div>

                        <div style={{ marginTop: 8, paddingLeft: 16 }}>
                            <small>Terms:</small>
                            {y.terms && y.terms.length > 0 ? (
                                <ul style={{ marginTop: 4 }}>
                                    {y.terms.map(t => (
                                        <li key={t.id}>{t.name} ({t.start_date} - {t.end_date})</li>
                                    ))}
                                </ul>
                            ) : (
                                <div style={{ fontStyle: 'italic', color: '#888' }}>No terms defined</div>
                            )}
                            {/* Add Term Form */}
                            <TermForm yearId={y.id} onSubmit={createTerm} />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function TermForm({ yearId, onSubmit }: { yearId: string, onSubmit: (e: React.FormEvent, yId: string, n: string, s: string, end: string) => void }) {
    const [name, setName] = useState('')
    const [start, setStart] = useState('')
    const [end, setEnd] = useState('')

    return (
        <form onSubmit={(e) => { onSubmit(e, yearId, name, start, end); setName(''); setStart(''); setEnd('') }} style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input placeholder="Term Name" value={name} onChange={e => setName(e.target.value)} required style={{ padding: 4 }} />
                <input type="date" value={start} onChange={e => setStart(e.target.value)} required style={{ padding: 4 }} />
                <span>-</span>
                <input type="date" value={end} onChange={e => setEnd(e.target.value)} required style={{ padding: 4 }} />
                <button type="submit" style={{ padding: '4px 8px' }}>Add Term</button>
            </div>
        </form>
    )
}
