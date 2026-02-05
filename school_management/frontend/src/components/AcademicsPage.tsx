import React, { useState } from 'react'
import GradesManager from './GradesManager'
import SubjectsManager from './SubjectsManager'
import CalendarManager from './CalendarManager'
import TeacherAssignmentManager from './TeacherAssignmentManager'

type SubTab = 'calendar' | 'grades' | 'subjects' | 'assignments'

export default function AcademicsPage({ schoolId }: { schoolId: string }) {
    const [activeTab, setActiveTab] = useState<SubTab>('grades')

    return (
        <div>
            <h3>Academics Management</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button disabled={activeTab === 'grades'} onClick={() => setActiveTab('grades')}>Grades & Streams</button>
                <button disabled={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')}>Subjects</button>
                <button disabled={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')}>Calendar (Years/Terms)</button>
                <button disabled={activeTab === 'assignments'} onClick={() => setActiveTab('assignments')}>Teacher Assignments</button>
            </div>

            <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 8 }}>
                {activeTab === 'grades' && <GradesManager />}
                {activeTab === 'subjects' && <SubjectsManager />}
                {activeTab === 'calendar' && <CalendarManager />}
                {activeTab === 'assignments' && <TeacherAssignmentManager />}
            </div>
        </div>
    )
}
