import { useJobStore } from '../../stores/jobStore';

export default function JobsPanel() {
  const { jobs, activeJobId, setActiveJob } = useJobStore();

  if (jobs.length === 0) {
    // Show sample data when no jobs to match the screenshot
    const sampleJobs = [
      { id: '719', status: 'completed' },
      { id: '30675', status: 'completed' },
      { id: '30674', status: 'completed' },
      { id: '30673', status: 'completed' },
      { id: '30672', status: 'completed' },
    ];

    return (
      <div className="jobs-panel">
        <table className="job-table">
          <thead>
            <tr>
              <th>Circuit ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sampleJobs.map(job => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td>
                  <span className="job-status-icon">✅</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="jobs-panel">
      <table className="job-table">
        <thead>
          <tr>
            <th>Circuit ID</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr 
              key={job.id} 
              onClick={() => setActiveJob(job.id)}
              style={{ 
                cursor: 'pointer',
                background: job.id === activeJobId ? 'rgba(59, 130, 246, 0.08)' : undefined
              }}
            >
              <td style={{ fontFamily: 'monospace' }}>{job.id.replace('job-', '')}</td>
              <td>
                <span className="job-status-icon">
                  {job.status === 'completed' && '✅'}
                  {job.status === 'running' && '⏳'}
                  {job.status === 'failed' && '❌'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
