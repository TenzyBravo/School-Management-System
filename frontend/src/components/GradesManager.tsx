import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type Grade = {
    id: string
    name: string
    level: number
    streams: Stream[]
}

type Stream = {
    id: string
    name: string
}

export default function GradesManager() {
    const [grades, setGrades] = useState<Grade[]>([])
    const [loading, setLoading] = useState(true)
    const [newGradeName, setNewGradeName] = useState('')
    const [newGradeLevel, setNewGradeLevel] = useState('')

    useEffect(() => {
        fetchGrades()
    }, [])

    function fetchGrades() {
        setLoading(true)
        apiFetch('/api/v1/grades/')
            .then(r => r.json())
            .then(data => setGrades(data.results ? data.results : data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    async function createGrade(e: React.FormEvent) {
        e.preventDefault()
        try {
            const res = await apiFetch('/api/v1/grades/', {
                method: 'POST',
                body: JSON.stringify({ name: newGradeName, level: parseInt(newGradeLevel) })
            })
            if (res.ok) {
                setNewGradeName('')
                setNewGradeLevel('')
                fetchGrades()
            } else {
                alert('Failed to create grade')
            }
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return <div>Loading grades...</div>

    return (
        <div>
            <h4>Grades</h4>
            <form onSubmit={createGrade} style={{ marginBottom: 16 }}>
                <input
                    placeholder="Grade Name (e.g. Grade 1)"
                    value={newGradeName}
                    onChange={e => setNewGradeName(e.target.value)}
                    required
                />
                <input
                    type="number"
                    placeholder="Level (e.g. 1)"
                    value={newGradeLevel}
                    onChange={e => setNewGradeLevel(e.target.value)}
                    required
                    style={{ marginLeft: 8, width: 60 }}
                />
                <button type="submit" style={{ marginLeft: 8 }}>Add Grade</button>
            </form>

            <ul style={{ paddingLeft: 20 }}>
                {grades.map(g => (
                    <li key={g.id} style={{ marginBottom: 8 }}>
                        <strong>{g.name}</strong> (Level {g.level})
                        {g.streams && g.streams.length > 0 && (
                            <div style={{ fontSize: '0.9em', color: '#666' }}>
                                Streams: {g.streams.map(s => s.name).join(', ')}
                            </div>
                        )}
                        {/* Add Stream creation UI here if needed */}
                    </li>
                ))}
            </ul>
        </div>
    )
}
