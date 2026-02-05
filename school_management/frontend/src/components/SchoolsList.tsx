import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type School = {
  id: string
  name: string
  code: string
}

export default function SchoolsList({ onSelectSchool }: { onSelectSchool: (id: string) => void }) {
  const [schools, setSchools] = useState<School[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/v1/schools/')
      .then((r) => r.json())
      .then((data) => {
        // Handle both pagination and direct list
        const list = data.results ? data.results : data
        setSchools(list)
      })
      .catch((err) => {
        console.error(err)
        setSchools([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading schools...</div>
  if (!schools || schools.length === 0) return <div>No schools found.</div>

  return (
    <div>
      <h2>Select a School</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {schools.map((s) => (
          <li
            key={s.id}
            onClick={() => onSelectSchool(s.id)}
            style={{
              padding: '12px',
              border: '1px solid #ccc',
              marginBottom: 8,
              cursor: 'pointer',
              borderRadius: 4
            }}
          >
            <strong>{s.name}</strong> — {s.code}
          </li>
        ))}
      </ul>
    </div>
  )
}
