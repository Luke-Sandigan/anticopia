import { useMemo, useState, type FormEvent } from 'react'
import { starterClasses, type ClassDetails } from '../../data/teacherClasses'

export type Student = { name: string; id: string; enrollment: 'Enrolled'; account: 'Active' | 'Not verified'; performance: number }

export const initialRoster: Student[] = [
  { name: 'Maria Santos', id: '2023-0141', enrollment: 'Enrolled', account: 'Active', performance: 88 },
  { name: 'Juan dela Cruz', id: '2023-0152', enrollment: 'Enrolled', account: 'Active', performance: 74 },
  { name: 'Ana Reyes', id: '2023-0167', enrollment: 'Enrolled', account: 'Active', performance: 91 },
  { name: 'Carlo Mendoza', id: '2023-0173', enrollment: 'Enrolled', account: 'Active', performance: 67 },
  { name: 'Bea Lim', id: '2023-0188', enrollment: 'Enrolled', account: 'Active', performance: 95 },
  { name: 'Paolo Garcia', id: '2023-0194', enrollment: 'Enrolled', account: 'Not verified', performance: 58 },
  { name: 'Isa Navarro', id: '2023-0203', enrollment: 'Enrolled', account: 'Active', performance: 82 },
  { name: 'Miguel Tan', id: '2023-0219', enrollment: 'Enrolled', account: 'Active', performance: 79 },
]

export const classExams = [
  { name: 'Midterm: Data Structures', when: 'Today, 10:00', status: 'Active' },
  { name: 'Quiz 2: Arrays', when: 'Oct 10, 10:00', status: 'Closed' },
]

function initialClassForRoute(id: string | undefined, state: unknown): ClassDetails {
  if (state && typeof state === 'object' && 'name' in state) return state as ClassDetails
  return starterClasses.find((item) => item.id === id) ?? starterClasses[0]
}

export function useTeacherClassDetailPageLogic(classId: string | undefined, routeState: unknown) {
  const classItem = initialClassForRoute(classId, routeState)
  const [roster, setRoster] = useState(initialRoster)
  const [search, setSearch] = useState('')
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [notice, setNotice] = useState('')
  const [fileName, setFileName] = useState('')
  const visibleRoster = useMemo(() => roster.filter((student) => `${student.name} ${student.id}`.toLowerCase().includes(search.toLowerCase())), [roster, search])

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }
  function addStudent(identifier: string) {
    const emailName = identifier.includes('@') ? identifier.split('@')[0].replace(/[._-]+/g, ' ') : ''
    const name = emailName ? emailName.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'New student'
    const id = identifier.includes('@') ? `NEW-${String(roster.length + 1).padStart(4, '0')}` : identifier
    setRoster((current) => [...current, { name, id, enrollment: 'Enrolled', account: 'Not verified', performance: 0 }])
    setNotice(`${name} was added to the class roster.`)
    setShowAddStudent(false)
  }
  function importRoster(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(fileName ? `${fileName} is ready for roster import when backend support is added.` : 'Choose a roster file to continue.')
    setShowImport(false)
  }
  function removeStudent(student: Student) {
    setRoster((current) => current.filter((item) => item.id !== student.id))
    setNotice(`${student.name} was removed from the roster.`)
  }

  return { classItem, roster, search, setSearch, showAddStudent, setShowAddStudent, showImport, setShowImport, dark, notice, setNotice, fileName, setFileName, visibleRoster, toggleTheme, addStudent, importRoster, removeStudent }
}
