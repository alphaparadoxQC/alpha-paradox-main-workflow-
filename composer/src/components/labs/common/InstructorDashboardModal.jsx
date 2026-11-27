import React from 'react';
import { useRoleStore } from '../../../stores/roleStore';
import '../../../styles/labs.css';

export default function InstructorDashboardModal({ isOpen, onClose }) {
  const curriculum = useRoleStore(state => state.curriculum);
  const toggleWeekUnlock = useRoleStore(state => state.toggleWeekUnlock);
  const cohort = useRoleStore(state => state.cohort);
  const exportGradebookCsv = useRoleStore(state => state.exportGradebookCsv);
  const profile = useRoleStore(state => state.profile);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--lab-bg-panel)',
        border: '1px solid var(--lab-border)',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--lab-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🎓</span>
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--lab-text-primary)' }}>
                Faculty & Instructor Command Center
              </span>
              <span style={{
                fontSize: '0.66rem',
                fontFamily: 'var(--lab-font-mono)',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--lab-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                SEMESTER BATCH 2026
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--lab-text-secondary)', marginTop: '2px' }}>
              {profile.institution} · Course: {profile.courseCode}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={exportGradebookCsv}
              className="lab-action-btn primary"
              style={{ fontSize: '0.74rem', padding: '6px 12px' }}
            >
              📥 Export Gradebook (CSV)
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--lab-text-muted)',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={{ background: 'var(--lab-bg-subpanel)', padding: '12px', borderRadius: '6px', border: '1px solid var(--lab-border)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-secondary)' }}>Enrolled Cohort</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--lab-cyan)', marginTop: '2px' }}>
                {cohort.length} Students
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-muted)' }}>MAKAUT Section A</div>
            </div>

            <div style={{ background: 'var(--lab-bg-subpanel)', padding: '12px', borderRadius: '6px', border: '1px solid var(--lab-border)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-secondary)' }}>Labs Completed</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--lab-emerald)', marginTop: '2px' }}>
                93.8%
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-muted)' }}>34 of 36 required labs</div>
            </div>

            <div style={{ background: 'var(--lab-bg-subpanel)', padding: '12px', borderRadius: '6px', border: '1px solid var(--lab-border)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-secondary)' }}>Class Average Score</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--lab-cyan)', marginTop: '2px' }}>
                91.8 / 100
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--lab-emerald)' }}>Grade A Benchmark</div>
            </div>

            <div style={{ background: 'var(--lab-bg-subpanel)', padding: '12px', borderRadius: '6px', border: '1px solid var(--lab-border)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-secondary)' }}>vQPU Compute Quota</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--lab-amber)', marginTop: '2px' }}>
                510 / 600
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-muted)' }}>Pooled Student Credits</div>
            </div>
          </div>

          {/* Section 1: Weekly Syllabus Access Control (Lock / Unlock) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--lab-text-primary)' }}>
                📅 Semester Syllabus Lock / Unlock by Week
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--lab-text-muted)' }}>
                Click module switch to release or lock workbench tools for students
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px'
            }}>
              {curriculum.map(item => (
                <div
                  key={item.week}
                  style={{
                    background: item.unlocked ? 'var(--lab-bg-subpanel)' : 'rgba(0,0,0,0.4)',
                    border: `1px solid ${item.unlocked ? 'var(--lab-border-highlight)' : 'var(--lab-border)'}`,
                    borderRadius: '6px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    opacity: item.unlocked ? 1 : 0.6
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                        WEEK {item.week}
                      </span>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: '600',
                        color: item.unlocked ? 'var(--lab-emerald)' : 'var(--lab-text-muted)'
                      }}>
                        {item.unlocked ? 'UNLOCKED' : 'LOCKED'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', fontWeight: '600', color: 'var(--lab-text-primary)', marginTop: '4px' }}>
                      {item.title}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleWeekUnlock(item.week)}
                    style={{
                      marginTop: '8px',
                      background: item.unlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      border: `1px solid ${item.unlocked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                      color: item.unlocked ? 'var(--lab-red)' : 'var(--lab-emerald)',
                      fontSize: '0.66rem',
                      padding: '4px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {item.unlocked ? '🔒 Lock for Students' : '🔓 Release to Students'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Student Cohort Gradebook & Completion Matrix */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--lab-text-primary)' }}>
                📊 Student Cohort Performance & Verified Rubric Scores
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--lab-text-muted)' }}>
                Authenticated against Execution Telemetry JSON signatures
              </span>
            </div>

            <table className="lab-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Completed Labs</th>
                  <th>Overall Score</th>
                  <th>Letter Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cohort.map(student => (
                  <tr key={student.id}>
                    <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                      {student.studentId}
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      {student.name}
                    </td>
                    <td style={{ fontFamily: 'var(--lab-font-mono)' }}>
                      {student.completedLabs} / 6 Labs
                    </td>
                    <td style={{ fontFamily: 'var(--lab-font-mono)', fontWeight: '700', color: student.totalScore >= 90 ? 'var(--lab-emerald)' : 'var(--lab-amber)' }}>
                      {student.totalScore}%
                    </td>
                    <td style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>
                      {student.grade}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.66rem',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        background: student.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: student.status === 'Active' ? 'var(--lab-emerald)' : 'var(--lab-amber)',
                        border: `1px solid ${student.status === 'Active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                      }}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--lab-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--lab-bg-subpanel)'
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--lab-text-muted)' }}>
            System Sync: Google Classroom / Canvas LMS / Moodle API Ready
          </span>
          <button
            onClick={onClose}
            className="lab-action-btn"
            style={{ fontSize: '0.74rem', padding: '6px 14px' }}
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

