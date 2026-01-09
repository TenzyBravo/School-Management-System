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
