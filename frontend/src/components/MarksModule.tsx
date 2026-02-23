import React, { useState } from 'react'
import AssessmentsManager from './AssessmentsManager'
import MarksEntry from './MarksEntry'
import MarksReports from './MarksReports'

export default function MarksModule() {
  const [activeTab, setActiveTab] = useState('assessments')

  const tabs = [
    { id: 'assessments', label: 'Manage Assessments', icon: '📝' },
    { id: 'entry', label: 'Enter Marks', icon: '✏️' },
    { id: 'reports', label: 'Reports & Analytics', icon: '📊' }
  ]

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>
          Marks Management
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          Manage assessments, enter marks, and view performance reports
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
                borderBottom: activeTab === tab.id ? '2px solid #4F46E5' : '2px solid transparent',
                color: activeTab === tab.id ? '#4F46E5' : '#6B7280',
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
        {activeTab === 'assessments' && <AssessmentsManager />}
        {activeTab === 'entry' && <MarksEntry />}
        {activeTab === 'reports' && <MarksReports />}
      </div>
    </div>
  )
}
