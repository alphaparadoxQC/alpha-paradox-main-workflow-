import { create } from 'zustand';

export const ROLES = {
  student: {
    id: 'student',
    title: 'Student Mode',
    badge: 'STUDENT',
    tagline: 'Guided curricula, scoped tooling & auto-graded lab notebooks',
    color: 'var(--lab-cyan)',
    quotas: {
      maxShots: 2048,
      maxQubits: 12,
      maxQecRounds: 10,
      creditCostPerRun: 5
    }
  },
  instructor: {
    id: 'instructor',
    title: 'Instructor / Faculty Mode',
    badge: 'INSTRUCTOR',
    tagline: 'Cohort management, weekly syllabus release & gradebook auditing',
    color: 'var(--lab-emerald)',
    quotas: {
      maxShots: 8192,
      maxQubits: 20,
      maxQecRounds: 25,
      creditCostPerRun: 2
    }
  },
  researcher: {
    id: 'researcher',
    title: 'Researcher / Enterprise Mode',
    badge: 'RESEARCHER',
    tagline: 'Unconstrained execution, raw QPU Hamiltonian exports & pulse physics',
    color: 'var(--lab-amber)',
    quotas: {
      maxShots: 32768,
      maxQubits: 101,
      maxQecRounds: 100,
      creditCostPerRun: 0
    }
  }
};

const DEFAULT_PROFILE = {
  name: 'Aarav Sharma',
  studentId: 'AP-MAKAUT-2026-042',
  institution: 'Maulana Abul Kalam Azad University of Technology (MAKAUT)',
  courseCode: 'QC-401: Quantum Information & Fault-Tolerant Architectures',
  instructorName: 'Prof. S. Bhattacharya'
};

const DEFAULT_CURRICULUM = [
  { week: 1, title: 'Algorithm Notebook & Circuit Composer', labRoute: '/composer', labId: 'circuit', unlocked: true, targetHours: 3 },
  { week: 2, title: 'Quantum Machine Learning & Feature Maps', labRoute: '/labs/qml', labId: 'qml', unlocked: true, targetHours: 4 },
  { week: 3, title: 'Molecular VQE & STO-3G Integrals', labRoute: '/labs/chemistry', labId: 'chemistry', unlocked: true, targetHours: 4 },
  { week: 4, title: 'Combinatorial QAOA & QUBO Optimization', labRoute: '/labs/optimization', labId: 'optimization', unlocked: true, targetHours: 4 },
  { week: 5, title: 'Quantum Risk & Amplitude Estimation', labRoute: '/labs/finance', labId: 'finance', unlocked: true, targetHours: 3 },
  { week: 6, title: 'Quantum Cryptography, QKD & PQC CBOM', labRoute: '/labs/cryptography', labId: 'cryptography', unlocked: true, targetHours: 4 },
  { week: 7, title: 'Surface Codes, MWPM Decoders & Fault Tolerance', labRoute: '/labs/qec-noise', labId: 'qec-noise', unlocked: true, targetHours: 5 },
  { week: 8, title: 'Capstone: 1625-Qubit QLDPC vQPU Telemetry', labRoute: '/results', labId: 'hardware', unlocked: true, targetHours: 6 }
];

const DEFAULT_COHORT = [
  { id: 'STU-01', name: 'Aarav Sharma', studentId: 'AP-MAKAUT-042', completedLabs: 6, totalScore: 98, grade: 'A+', status: 'Active' },
  { id: 'STU-02', name: 'Priyanshu Das', studentId: 'AP-MAKAUT-018', completedLabs: 6, totalScore: 94, grade: 'A', status: 'Active' },
  { id: 'STU-03', name: 'Ananya Sen', studentId: 'AP-MAKAUT-007', completedLabs: 5, totalScore: 89, grade: 'A-', status: 'Review Needed' },
  { id: 'STU-04', name: 'Rohan Mehta', studentId: 'AP-MAKAUT-055', completedLabs: 6, totalScore: 96, grade: 'A+', status: 'Active' },
  { id: 'STU-05', name: 'Sneha Roy', studentId: 'AP-MAKAUT-081', completedLabs: 4, totalScore: 82, grade: 'B+', status: 'Late Lab 5' },
  { id: 'STU-06', name: 'Vikram Patel', studentId: 'AP-MAKAUT-099', completedLabs: 6, totalScore: 92, grade: 'A', status: 'Active' }
];

export const useRoleStore = create((set, get) => ({
  currentRole: (typeof window !== 'undefined' && localStorage.getItem('ap_user_role')) || 'student',
  profile: DEFAULT_PROFILE,
  credits: 85,
  maxCredits: 100,
  curriculum: DEFAULT_CURRICULUM,
  cohort: DEFAULT_COHORT,
  submissions: [],
  recentJobs: [
    { id: 'AP-8492', lab: 'QEC & Noise', status: 'Completed', latencyMs: 142, creditsDeducted: 5, timestamp: Date.now() - 60000 },
    { id: 'AP-8491', lab: 'Quantum Chemistry', status: 'Completed', latencyMs: 310, creditsDeducted: 5, timestamp: Date.now() - 180000 }
  ],

  setRole: (role) => {
    if (!ROLES[role]) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ap_user_role', role);
    }
    set({ currentRole: role });
  },

  deductCredits: (cost = 5, labName = 'Simulation') => {
    const current = get().credits;
    if (current < cost) {
      return false; // Insufficient credits
    }
    const newCredit = Math.max(0, current - cost);
    const newJob = {
      id: `AP-${Math.floor(1000 + Math.random() * 9000)}`,
      lab: labName,
      status: 'Completed',
      latencyMs: Math.floor(80 + Math.random() * 220),
      creditsDeducted: cost,
      timestamp: Date.now()
    };
    set(state => ({
      credits: newCredit,
      recentJobs: [newJob, ...state.recentJobs].slice(0, 10)
    }));
    return true;
  },

  resetCredits: () => set({ credits: 100 }),

  toggleWeekUnlock: (weekNumber) => set(state => ({
    curriculum: state.curriculum.map(w =>
      w.week === weekNumber ? { ...w, unlocked: !w.unlocked } : w
    )
  })),

  addSubmission: (submission) => set(state => ({
    submissions: [submission, ...state.submissions]
  })),

  exportGradebookCsv: () => {
    const cohort = get().cohort;
    const header = 'Student ID,Name,Completed Labs,Total Score,Grade,Status\n';
    const rows = cohort.map(s => `${s.studentId},"${s.name}",${s.completedLabs},${s.totalScore},${s.grade},${s.status}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradebook-makaut-qc401-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}));

