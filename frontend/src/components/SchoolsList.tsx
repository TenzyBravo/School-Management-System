import React, { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type School = {
  id: string
  name: string
  code: string
}

export default function SchoolsList() {
  const [schools, setSchools] = useState<School[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/v1/schools/')
      .then((r) => r.json())
      .then((data) => setSchools(data))
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
      <ul>
        {schools.map((s) => (
          <li key={s.id}>
            <strong>{s.name}</strong> — {s.code}
          </li>
        ))}
      </ul>
    </div>
  )
}
