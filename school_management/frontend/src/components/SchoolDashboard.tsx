import React, { useState } from 'react'
import StudentsPage from './StudentsPage'
import AcademicsPage from './AcademicsPage'
import AttendancePage from './AttendancePage'

type Tab = 'students' | 'academics' | 'attendance'

export default function SchoolDashboard({ schoolId, onBack }: { schoolId: string, onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<Tab>('students')

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <button onClick={onBack} style={{ marginRight: 16 }}>← Schools</button>
                    <span style={{ fontWeight: 'bold' }}>School Dashboard</span>
                </div>
                <div>
                    {/* Placeholder for school info if needed */}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #ccc', marginBottom: 16 }}>
                <button
                    onClick={() => setActiveTab('students')}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'students' ? '2px solid blue' : 'none',
                        fontWeight: activeTab === 'students' ? 'bold' : 'normal',
                        cursor: 'pointer'
                    }}
                >
                    Students
                </button>
                <button
                    onClick={() => setActiveTab('academics')}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'academics' ? '2px solid blue' : 'none',
                        fontWeight: activeTab === 'academics' ? 'bold' : 'normal',
                        cursor: 'pointer'
                    }}
                >
                    Academics
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'attendance' ? '2px solid blue' : 'none',
                        fontWeight: activeTab === 'attendance' ? 'bold' : 'normal',
                        cursor: 'pointer'
                    }}
                >
                    Attendance
                </button>
            </div>

            <div>
                {activeTab === 'students' && <StudentsPage schoolId={schoolId} />}
                {activeTab === 'academics' && <AcademicsPage schoolId={schoolId} />}
                {activeTab === 'attendance' && <AttendancePage schoolId={schoolId} />}
            </div>
        </div>
    )
}
