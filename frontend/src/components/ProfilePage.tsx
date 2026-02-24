import React, { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../lib/api'

interface Profile {
  id: string
  username: string
  employee_number: string
  email: string
  first_name: string
  last_name: string
  role: string
  school_name: string | null
  phone: string
  profile_picture: string | null
  profile_picture_url: string | null
}

const ROLE_LABELS: Record<string, string> = {
  TEACHER: 'Teacher',
  HEADTEACHER: 'Headteacher',
  DEPUTY_HEAD: 'Deputy Headteacher',
  SOCIAL_OFFICER: 'Social Services Officer',
  ACADEMIC_MANAGER: 'Academic Manager',
  HEAD_OF_OPS: 'Head of Operations',
  DIRECTOR: 'Director',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#1F2937',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'white',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '6px',
}

interface Props {
  onSaved?: () => void
}

export default function ProfilePage({ onSaved }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const res = await apiFetch('/api/v1/profile/')
      if (!res.ok) throw new Error('Failed to load profile')
      const data: Profile = await res.json()
      setProfile(data)
      setForm({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || '',
      })
    } catch (e: any) {
      setError('Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('first_name', form.first_name)
      formData.append('last_name', form.last_name)
      formData.append('email', form.email)
      formData.append('phone', form.phone)
      if (selectedFile) {
        formData.append('profile_picture', selectedFile)
      }

      const res = await fetch(
        'https://school-management-api-tkhv.onrender.com/api/v1/profile/',
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access')}`,
          },
          body: formData,
        }
      )

      if (!res.ok) {
        const errData = await res.json()
        const msgs = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ')
        throw new Error(msgs)
      }

      const updated: Profile = await res.json()
      setProfile(updated)
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setSuccess('Profile updated successfully!')
      onSaved?.()
    } catch (e: any) {
      setError(e.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match.')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('current_password', passwordForm.current_password)
      formData.append('new_password', passwordForm.new_password)
      formData.append('confirm_password', passwordForm.confirm_password)

      const res = await fetch(
        'https://school-management-api-tkhv.onrender.com/api/v1/profile/',
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access')}`,
          },
          body: formData,
        }
      )

      if (!res.ok) {
        const errData = await res.json()
        const msgs = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ')
        throw new Error(msgs)
      }

      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      setSuccess('Password changed successfully!')
    } catch (e: any) {
      setError(e.message || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  const avatarUrl = previewUrl || profile?.profile_picture_url
  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : '?'

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
        Loading profile...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Profile Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        color: 'white',
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: avatarUrl ? 'transparent' : 'rgba(255,255,255,0.2)',
              border: '3px solid rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: '700',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
            }}
            title="Click to change photo"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
            {/* Hover overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
            >
              Change
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
            {profile?.first_name} {profile?.last_name}
          </div>
          <div style={{ opacity: 0.85, fontSize: '15px', marginBottom: '8px' }}>
            {ROLE_LABELS[profile?.role || ''] || profile?.role}
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', opacity: 0.75, flexWrap: 'wrap' }}>
            <span>ID: {profile?.employee_number}</span>
            {profile?.school_name && <span>School: {profile.school_name}</span>}
          </div>
        </div>

        {selectedFile && (
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
          }}>
            New photo selected —<br/>save to apply
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#DC2626', fontSize: '14px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#16A34A', fontSize: '14px' }}>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#F3F4F6', borderRadius: '10px', padding: '4px' }}>
        {(['info', 'password'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setError(null); setSuccess(null) }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              background: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? '#4F46E5' : '#6B7280',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'info' ? 'Personal Information' : 'Change Password'}
          </button>
        ))}
      </div>

      {/* Personal Info Tab */}
      {activeTab === 'info' && (
        <form onSubmit={handleSaveInfo}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input
                  style={inputStyle}
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input
                  style={inputStyle}
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Email Address</label>
              <input
                style={inputStyle}
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Phone Number</label>
              <input
                style={inputStyle}
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+260971234567"
              />
            </div>

            {/* Read-only fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Employee ID</label>
                <input style={{ ...inputStyle, background: '#F9FAFB', color: '#9CA3AF' }} value={profile?.employee_number || ''} disabled />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <input style={{ ...inputStyle, background: '#F9FAFB', color: '#9CA3AF' }} value={ROLE_LABELS[profile?.role || ''] || profile?.role || ''} disabled />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px',
                background: saving ? '#9CA3AF' : '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Current Password</label>
              <input
                style={inputStyle}
                type="password"
                value={passwordForm.current_password}
                onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>New Password</label>
              <input
                style={inputStyle}
                type="password"
                value={passwordForm.new_password}
                onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))}
                required
                autoComplete="new-password"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                style={inputStyle}
                type="password"
                value={passwordForm.confirm_password}
                onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px',
                background: saving ? '#9CA3AF' : '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
