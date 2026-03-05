import React from 'react'
import { useAuth } from '../context/AuthContext'
import SchoolSwitcher from './SchoolSwitcher'

type DashboardProps = {
  onNavigate: (section: string) => void
}

const ALL_CARDS = [
  { id: 'schools',        title: 'Schools',    description: 'Manage schools, view details and performance',         icon: '🏫', color: '#4F46E5', roles: ['SUPER_ADMIN'] },
  { id: 'classes',        title: 'Classes',    description: 'View school class structure — grades, streams & students', icon: '🎓', color: '#0891B2', roles: ['ACADEMIC_MANAGER', 'HEAD_OF_OPS', 'DIRECTOR', 'HEADTEACHER', 'DEPUTY_HEAD'] },
  { id: 'studentsmanager',title: 'Students',   description: 'Manage student records and bulk uploads',              icon: '👨‍🎓', color: '#059669', roles: ['SUPER_ADMIN', 'ACADEMIC_MANAGER', 'HEAD_OF_OPS', 'DIRECTOR', 'HEADTEACHER', 'DEPUTY_HEAD'] },
  { id: 'faculty',        title: 'Faculty',    description: 'Manage teachers, staff and user accounts',             icon: '👩‍🏫', color: '#F59E0B', roles: ['SUPER_ADMIN', 'ACADEMIC_MANAGER', 'HEAD_OF_OPS', 'DIRECTOR', 'HEADTEACHER', 'DEPUTY_HEAD'] },
  { id: 'students',       title: 'Attendance', description: 'Mark daily attendance and view statistics',            icon: '📋', color: '#10B981', roles: null }, // all roles
  { id: 'academics',      title: 'Academics',  description: 'Manage curriculum, subjects and academic years',       icon: '📚', color: '#DC2626', roles: ['SUPER_ADMIN', 'ACADEMIC_MANAGER', 'HEAD_OF_OPS', 'DIRECTOR', 'HEADTEACHER', 'DEPUTY_HEAD'] },
  { id: 'reports',        title: 'Reports',    description: 'Generate performance reports and analytics',            icon: '📊', color: '#7C3AED', roles: null }, // all roles
]

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { logout, userRole, userName } = useAuth()

  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isHqUser = userRole && ['SUPER_ADMIN', 'ACADEMIC_MANAGER', 'HEAD_OF_OPS', 'DIRECTOR'].includes(userRole)

  const cards = ALL_CARDS.filter(c => c.roles === null || (userRole && c.roles.includes(userRole)))

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '700', margin: 0 }}>
            School Management System
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => onNavigate('profile')}
              style={{
                background: 'rgba(255,255,255,0.15)', color: 'white',
                border: '1px solid rgba(255,255,255,0.3)', padding: '10px 20px',
                borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
              }}
            >
              My Profile
            </button>
            <button
              onClick={logout}
              style={{
                background: 'rgba(255,255,255,0.2)', color: 'white',
                border: '1px solid rgba(255,255,255,0.3)', padding: '10px 24px',
                borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Welcome Banner */}
        <div style={{
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
          borderRadius: '16px', padding: '40px',
          border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', marginBottom: '40px'
        }}>
          {isSuperAdmin && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.2)', borderRadius: '20px',
              padding: '4px 16px', marginBottom: '16px', fontSize: '13px',
              color: 'white', fontWeight: '600', letterSpacing: '0.5px'
            }}>
              ⚡ SUPER ADMIN
            </div>
          )}
          <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '600', marginBottom: '12px' }}>
            Welcome Back{userName ? `, ${userName}` : ''}! 👋
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', marginBottom: isHqUser ? '28px' : '0' }}>
            {isSuperAdmin
              ? 'You have full system access across all schools.'
              : 'Select a section below to get started'}
          </p>

          {isHqUser && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: '500', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Active School Context
              </span>
              <SchoolSwitcher />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                All data (students, grades, attendance) will be scoped to the selected school
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => onNavigate(card.id)}
            style={{
              background: 'white', borderRadius: '16px', padding: '32px',
              cursor: 'pointer', transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-8px)'
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            {/* Top colour accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: card.color }} />
            <div style={{
              width: '60px', height: '60px', borderRadius: '12px',
              background: card.color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '32px', marginBottom: '20px',
            }}>
              {card.icon}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
              {card.title}
            </h3>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6', margin: 0 }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '1200px', margin: '60px auto 0', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
        <p>School Management System © 2025</p>
      </div>
    </div>
  )
}
