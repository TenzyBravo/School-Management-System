import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type Subject = {
    id: string
    name: string
    code: string
    is_core: boolean
}

export default function SubjectsManager() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [newName, setNewName] = useState('')
    const [newCode, setNewCode] = useState('')
    const [newIsCore, setNewIsCore] = useState(true)

    useEffect(() => {
        fetchSubjects()
    }, [])

    function fetchSubjects() {
        setLoading(true)
        apiFetch('/api/v1/subjects/')
            .then(r => r.json())
            .then(data => setSubjects(data.results ? data.results : data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    async function createSubject(e: React.FormEvent) {
        e.preventDefault()
        try {
            const res = await apiFetch('/api/v1/subjects/', {
                method: 'POST',
                body: JSON.stringify({ name: newName, code: newCode, is_core: newIsCore })
            })
            if (res.ok) {
                setNewName('')
                setNewCode('')
                setNewIsCore(true)
                fetchSubjects()
            } else {
                const err = await res.json()
                alert('Failed to create subject: ' + JSON.stringify(err))
            }
        } catch (err) {
            console.error(err)
            alert('Network error')
        }
    }

    if (loading) return <div>Loading subjects...</div>

    return (
        <div>
            <h4>Subjects</h4>
            <form onSubmit={createSubject} style={{ marginBottom: 16 }}>
                <input
                    placeholder="Subject Name (e.g. Mathematics)"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                />
                <input
                    placeholder="Code (e.g. MAT)"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    required
                    style={{ marginLeft: 8, width: 80 }}
                />
                <label style={{ marginLeft: 8 }}>
                    <input
                        type="checkbox"
                        checked={newIsCore}
                        onChange={e => setNewIsCore(e.target.checked)}
                    /> Core?
                </label>
                <button type="submit" style={{ marginLeft: 8 }}>Add Subject</button>
            </form>

            <ul style={{ paddingLeft: 20 }}>
                {subjects.map(s => (
                    <li key={s.id} style={{ marginBottom: 4 }}>
                        <strong>{s.name}</strong> ({s.code}) {s.is_core && <span style={{ fontSize: '0.8em', background: '#eee', padding: '2px 4px', borderRadius: 4 }}>Core</span>}
                    </li>
                ))}
            </ul>
        </div>
    )
}
