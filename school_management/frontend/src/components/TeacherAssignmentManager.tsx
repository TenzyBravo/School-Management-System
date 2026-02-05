import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type User = {
    id: string
    first_name: string
    last_name: string
    email: string
}

type Grade = { id: string, name: string }
type Stream = { id: string, name: string, grade: string }
type Subject = { id: string, name: string, code: string }
type Year = { id: string, name: string }
type Assignment = {
    id: string
    teacher_name?: string // simplistic for now, might need join or separate fetch
    teacher: string
    subject: string
    grade: string
    stream: string | null
    grade_name?: string
    subject_name?: string
}

export default function TeacherAssignmentManager() {
    const [teachers, setTeachers] = useState<User[]>([])
    const [grades, setGrades] = useState<Grade[]>([])
    const [streams, setStreams] = useState<Stream[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [years, setYears] = useState<Year[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)

    // Form State
    const [selectedTeacher, setSelectedTeacher] = useState('')
    const [selectedGrade, setSelectedGrade] = useState('')
    const [selectedStream, setSelectedStream] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')
    const [selectedYear, setSelectedYear] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [tRes, gRes, stRes, suRes, yRes, aRes] = await Promise.all([
                apiFetch('/api/v1/users/?role=TEACHER'),
                apiFetch('/api/v1/grades/'),
                apiFetch('/api/v1/streams/'),
                apiFetch('/api/v1/subjects/'),
                apiFetch('/api/v1/academic-years/'),
                apiFetch('/api/v1/assignments/')
            ])

            const tData = await tRes.json()
            const gData = await gRes.json()
            const stData = await stRes.json()
            const suData = await suRes.json()
            const yData = await yRes.json()
            const aData = await aRes.json()

            setTeachers(tData.results || tData)
            setGrades(gData.results || gData)
            setStreams(stData.results || stData)
            setSubjects(suData.results || suData)
            setYears(yData.results || yData)
            setAssignments(aData.results || aData)

            // Auto-select current year if possible?
            // For now just pick first
            const yList = yData.results || yData
            if (yList.length > 0) setSelectedYear(yList[0].id)

        } catch (e) {
            console.error(e)
            alert('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    async function createAssignment(e: React.FormEvent) {
        e.preventDefault()
        try {
            const res = await apiFetch('/api/v1/assignments/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacher: selectedTeacher,
                    grade: selectedGrade,
                    stream: selectedStream || null,
                    subject: selectedSubject,
                    academic_year: selectedYear
                })
            })
            if (res.ok) {
                alert('Assignment created')
                loadData() // refresh list
            } else {
                const err = await res.json()
                alert('Failed: ' + JSON.stringify(err))
            }
        } catch (e) {
            console.error(e)
        }
    }

    const filteredStreams = streams.filter(s => s.grade === selectedGrade)

    if (loading) return <div>Loading...</div>

    return (
        <div>
            <h4>Teacher Assignments</h4>
            <form onSubmit={createAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, marginBottom: 24 }}>
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} required>
                    <option value="">Select Year</option>
                    {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>

                <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} required>
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                </select>

                <select value={selectedGrade} onChange={e => { setSelectedGrade(e.target.value); setSelectedStream(''); }} required>
                    <option value="">Select Grade</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>

                <select value={selectedStream} onChange={e => setSelectedStream(e.target.value)} disabled={!selectedGrade}>
                    <option value="">Select Stream (Optional)</option>
                    {filteredStreams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} required>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>

                <button type="submit">Assign Teacher</button>
            </form>

            <h5>Existing Assignments</h5>
            <ul>
                {assignments.map(a => {
                    // Manual lookup for display since API might return IDs
                    // Optimally serializer should return names or use expand
                    const t = teachers.find(u => u.id === a.teacher)
                    const s = subjects.find(sub => sub.id === a.subject)
                    const g = grades.find(gr => gr.id === a.grade)
                    return (
                        <li key={a.id}>
                            {t ? `${t.first_name} ${t.last_name}` : a.teacher} - {s?.name} ({g?.name})
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
