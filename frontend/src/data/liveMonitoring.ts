export type StudentStatus = 'Focused' | 'Left tab' | 'Offline'
export type MonitoringEventKind = 'Exam started' | 'Left tab' | 'Copied text' | 'Fullscreen exited' | 'Connection lost'

export type MonitoringEvent = {
  kind: MonitoringEventKind
  detail: string
  time: string
}

export type MonitoredStudent = {
  id: string
  studentNumber: string
  name: string
  events: MonitoringEvent[]
}

export function currentStudentStatus(events: MonitoringEvent[]): StudentStatus {
  const latestEvent = events.at(-1)
  if (latestEvent?.kind === 'Connection lost') return 'Offline'
  if (latestEvent && latestEvent.kind !== 'Exam started') return 'Left tab'
  return 'Focused'
}

export const monitoredStudents: MonitoredStudent[] = [
  {
    id: 'maria-santos',
    studentNumber: '2023-0141',
    name: 'Maria Santos',
    events: [
      { kind: 'Exam started', detail: 'Exam session opened', time: '10:00' },
      { kind: 'Left tab', detail: 'Switched to another tab (14 s)', time: '10:02' },
      { kind: 'Copied text', detail: 'Copied text from question 2', time: '10:05' },
      { kind: 'Fullscreen exited', detail: 'Exited fullscreen', time: '10:06' },
    ],
  },
  {
    id: 'juan-dela-cruz',
    studentNumber: '2023-0142',
    name: 'Juan dela Cruz',
    events: [{ kind: 'Exam started', detail: 'Exam session opened', time: '10:00' }],
  },
  {
    id: 'ana-reyes',
    studentNumber: '2023-0143',
    name: 'Ana Reyes',
    events: [
      { kind: 'Exam started', detail: 'Exam session opened', time: '10:00' },
      { kind: 'Left tab', detail: 'Switched to another tab', time: '10:02' },
      { kind: 'Left tab', detail: 'Switched to another tab', time: '10:07' },
    ],
  },
  {
    id: 'carlo-mendoza',
    studentNumber: '2023-0144',
    name: 'Carlo Mendoza',
    events: [{ kind: 'Exam started', detail: 'Exam session opened', time: '10:00' }],
  },
  {
    id: 'bea-lim',
    studentNumber: '2023-0145',
    name: 'Bea Lim',
    events: [{ kind: 'Exam started', detail: 'Exam session opened', time: '10:00' }],
  },
  {
    id: 'paolo-garcia',
    studentNumber: '2023-0146',
    name: 'Paolo Garcia',
    events: [
      { kind: 'Exam started', detail: 'Exam session opened', time: '10:00' },
      { kind: 'Connection lost', detail: 'Connection lost', time: '10:08' },
    ],
  },
  {
    id: 'isa-navarro',
    studentNumber: '2023-0147',
    name: 'Isa Navarro',
    events: [{ kind: 'Exam started', detail: 'Exam session opened', time: '10:00' }],
  },
  {
    id: 'miguel-tan',
    studentNumber: '2023-0148',
    name: 'Miguel Tan',
    events: [
      { kind: 'Exam started', detail: 'Exam session opened', time: '10:00' },
      { kind: 'Copied text', detail: 'Pasted text into an answer', time: '10:05' },
      { kind: 'Left tab', detail: 'Exited fullscreen', time: '10:09' },
    ],
  },
]

export const roomAlerts = [
  { kind: 'Left tab' as const, student: 'Miguel Tan', detail: 'Exited fullscreen', time: '22:29' },
  { kind: 'Left tab' as const, student: 'Ana Reyes', detail: 'Switched to another tab', time: '22:25' },
  { kind: 'Copied text' as const, student: 'Miguel Tan', detail: 'Pasted text into an answer', time: '22:17' },
  { kind: 'Left tab' as const, student: 'Ana Reyes', detail: 'Switched to another tab', time: '10:02' },
  { kind: 'Copied text' as const, student: 'Miguel Tan', detail: 'Copied text from question 2', time: '10:05' },
]
