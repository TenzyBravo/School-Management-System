import React from 'react'
import { useAuth } from '../context/AuthContext'

type DashboardProps = {
  onNavigate: (section: string) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { logout } = useAuth()

  const cards = [
    {
      id: 'schools',
      title: 'Schools',
      description: 'Manage schools, view details, and track performance',
      icon: '🏫',
      color: '#4F46E5'
    },
    {
      id: 'students',
      title: 'Students',
      description: 'View student records, attendance, and academic progress',
      icon: '👨‍🎓',
      color: '#059669'
    },
    {
      id: 'academics',
      title: 'Academics',
      description: 'Manage curriculum, subjects, and academic years',
      icon: '📚',
      color: '#DC2626'
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Generate performance reports and analytics',
      icon: '📊',
      color: '#7C3AED'
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '60px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '32px',
            fontWeight: '700',
            margin: 0
          }}>
            School Management System
          </h1>
          <button
            onClick={logout}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '10px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            Logout
          </button>
        </div>

        {/* Welcome Banner */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            Welcome Back! 👋
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            margin: 0
          }}>
            Select a section below to get started
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => onNavigate(card.id)}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)'
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              background: card.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginBottom: '20px'
            }}>
              {card.icon}
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1F2937',
              marginBottom: '8px'
            }}>
              {card.title}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              lineHeight: '1.6',
              margin: 0
            }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        maxWidth: '1200px',
        margin: '60px auto 0',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px'
      }}>
        <p>School Management System © 2024</p>
      </div>
    </div>
  )
}
