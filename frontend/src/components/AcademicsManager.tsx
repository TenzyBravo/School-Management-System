import React, { useState } from 'react'
import AcademicYearsManager from './AcademicYearsManager'
import GradesManager from './GradesManager'
import SubjectsManager from './SubjectsManager'
import TeacherAssignmentManager from './TeacherAssignmentManager'

export default function AcademicsManager() {
  const [activeTab, setActiveTab] = useState('years')

  const tabs = [
    { id: 'years', label: 'Academic Years & Terms', icon: '📅' },
    { id: 'grades', label: 'Grades & Streams', icon: '🎓' },
    { id: 'subjects', label: 'Subjects', icon: '📚' },
    { id: 'assignments', label: 'Teacher Assignments', icon: '👨‍🏫' }
  ]

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>
          Academic Management
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>
          Manage grades, subjects, terms, and teacher assignments
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
        {activeTab === 'years' && <AcademicYearsManager />}
        {activeTab === 'grades' && <GradesManager />}
        {activeTab === 'subjects' && <SubjectsManager />}
        {activeTab === 'assignments' && <TeacherAssignmentManager />}
      </div>
    </div>
  )
}
