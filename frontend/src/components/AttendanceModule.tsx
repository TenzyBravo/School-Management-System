import React, { useState } from 'react'
import AttendanceMarking from './AttendanceMarking'
import AttendanceDashboard from './AttendanceDashboard'

export default function AttendanceModule() {
  const [activeTab, setActiveTab] = useState('marking')

  const tabs = [
    { id: 'marking', label: 'Mark Attendance', icon: '✓' },
    { id: 'dashboard', label: 'Statistics & Reports', icon: '📊' }
  ]

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>
          Attendance Management
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          Mark daily attendance and view statistics
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        borderBottom: '1px solid #E5E7EB',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #059669' : '2px solid transparent',
                color: activeTab === tab.id ? '#059669' : '#6B7280',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'marking' && <AttendanceMarking />}
        {activeTab === 'dashboard' && <AttendanceDashboard />}
      </div>
    </div>
  )
}