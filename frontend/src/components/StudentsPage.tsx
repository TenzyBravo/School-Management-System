import React, { useEffect, useState } from 'react'

type Student = {
  id: string
  first_name: string
  last_name: string
  admission_number: string
}

type AttendanceMap = Record<string, string> // studentId -> status code

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default function StudentsPage({ schoolId }: { schoolId: string }) {
  const [students, setStudents] = useState<Student[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [attendance, setAttendance] = useState<AttendanceMap>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const token = localStorage.getItem('access')
    setLoading(true)

    // fetch students
    fetch('/api/v1/students/', {
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    })
      .then((r) => r.json())
      .then((data) => setStudents(data.results ? data.results : data))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))

    // fetch existing attendance for today using apiFetch
    import('../lib/api').then(({ apiFetch }) => {
      apiFetch(`/api/v1/attendance/?date=${todayISO()}`)
        .then((r) => r.json())
        .then((data) => {
          const items = data.results ? data.results : data
          const map: AttendanceMap = {}
          items.forEach((it: any) => { map[it.student] = it.status })
          setAttendance(map)
        })
        .catch(() => {})
    })
  }, [schoolId])

  async function markAttendance(studentId: string, status: string) {
    setSaving((s) => ({ ...s, [studentId]: true }))
    try {
      // use apiFetch to ensure token refresh works
      const { apiFetch } = await import('../lib/api')
      const res = await apiFetch('/api/v1/attendance/', {
        method: 'POST',
        body: JSON.stringify({ student: studentId, date: todayISO(), status })
      })
      if (!res.ok) {
        const err = await res.text()
        console.error('Failed to save attendance', err)
        alert('Failed to save attendance')
        return
      }
      const data = await res.json()
      setAttendance((m) => ({ ...m, [studentId]: data.status }))
    } catch (e) {
      console.error(e)
      alert('Network error')
    } finally {
      setSaving((s) => ({ ...s, [studentId]: false }))
    }
  }

  if (loading) return <div>Loading students...</div>
  if (!students || students.length === 0) return <div>No students found.</div>

  return (
    <div>
      <h2>Students</h2>
      <p>Attendance for {todayISO()}</p>
      <table>
        <thead>
          <tr><th>Name</th><th>Admission No.</th><th>Attendance</th></tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.first_name} {s.last_name}</td>
              <td>{s.admission_number}</td>
              <td>
                {attendance[s.id] ? (
                  <span>{attendance[s.id] === 'P' ? 'Present' : attendance[s.id] === 'A' ? 'Absent' : attendance[s.id] === 'L' ? 'Late' : 'Excused'}</span>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button disabled={!!saving[s.id]} onClick={() => markAttendance(s.id, 'P')}>P</button>
                    <button disabled={!!saving[s.id]} onClick={() => markAttendance(s.id, 'A')}>A</button>
                    <button disabled={!!saving[s.id]} onClick={() => markAttendance(s.id, 'L')}>L</button>
                    <button disabled={!!saving[s.id]} onClick={() => markAttendance(s.id, 'E')}>E</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
import React, { useEffect, useState } from 'react'

type Student = {
  id: string
  first_name: string
  last_name: string
  admission_number: string
}

type AttendanceMap = Record<string, string> // studentId -> status code

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default function StudentsPage({ schoolId }: { schoolId: string }) {
  const [students, setStudents] = useState<Student[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [attendance, setAttendance] = useState<AttendanceMap>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const token = localStorage.getItem('access')
    useEffect(() => {
      const token = localStorage.getItem('access')
      setLoading(true)

      // fetch students
      fetch('/api/v1/students/', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
        .then((r) => r.json())
        .then((data) => setStudents(data.results ? data.results : data))
        .catch(() => setStudents([]))
        .finally(() => setLoading(false))

      // fetch existing attendance for today using apiFetch
      import('../lib/api').then(({ apiFetch }) => {
        apiFetch(`/api/v1/attendance/?date=${todayISO()}`)
          .then((r) => r.json())
          .then((data) => {
            const items = data.results ? data.results : data
            const map: AttendanceMap = {}
            items.forEach((it: any) => { map[it.student] = it.status })
            setAttendance(map)
          })
          .catch(() => {})
      })
    }, [schoolId])
    const token = localStorage.getItem('access')
    setSaving((s) => ({ ...s, [studentId]: true }))
    try {
      // use apiFetch to ensure token refresh works
      const { apiFetch } = await import('../lib/api')
      const res = await apiFetch('/api/v1/attendance/', {
        method: 'POST',
        body: JSON.stringify({ student: studentId, date: todayISO(), status })
      })
      if (!res.ok) {
        const err = await res.text()
        console.error('Failed to save attendance', err)
        alert('Failed to save attendance')
        return
      }
      const data = await res.json()
      setAttendance((m) => ({ ...m, [studentId]: data.status }))
    } catch (e) {
      console.error(e)
      alert('Network error')
    } finally {
      setSaving((s) => ({ ...s, [studentId]: false }))
    }
  }

  if (loading) return <div>Loading students...</div>
  if (!students || students.length === 0) return <div>No students found.</div>

  return (
    <div>
      <h2>Students</h2>
      <p>Attendance for {todayISO()}</p>
      <table>
        <thead>
          <tr><th>Name</th><th>Admission No.</th><th>Attendance</th></tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.first_name} {s.last_name}</td>
              <td>{s.admission_number}</td>
              <td>
                {attendance[s.id] ? (
                  <span>{attendance[s.id] === 'P' ? 'Present' : attendance[s.id] === 'A' ? 'Absent' : attendance[s.id] === 'L' ? 'Late' : 'Excused'}</span>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button disabled={!!saving[s.id]} onClick={() => markAttendance(s.id, 'P')}>P</button>
                    <button disabled={!!saving[s.id]} onClick={() => markAttendance(s.id, 'A')}>A</button>
                    <button disabled={!!saving[s.id]} onClick={() => markAttendance(s.id, 'L')}>L</button>
                    <button disabled={!!saving[s.id]} onClick={() => markAttendance(s.id, 'E')}>E</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
import React, { useEffect, useState } from 'react'

type Student = {
  id: string
  first_name: string
  last_name: string
  admission_number: string
}

export default function StudentsPage({ schoolId }: { schoolId: string }) {
  const [students, setStudents] = useState<Student[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    fetch('/api/v1/students/', {
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    })
      .then((r) => r.json())
      .then((data) => {
        // handle paginated and plain arrays
        setStudents(data.results ? data.results : data)
      })
      .catch((err) => setStudents([]))
      .finally(() => setLoading(false))
  }, [schoolId])

  if (loading) return <div>Loading students...</div>
  if (!students || students.length === 0) return <div>No students found.</div>

  return (
    <div>
      <h2>Students</h2>
      <table>
        <thead>
          <tr><th>Name</th><th>Admission No.</th></tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}><td>{s.first_name} {s.last_name}</td><td>{s.admission_number}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
