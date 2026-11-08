import { useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { starterClasses, type ClassDetails } from '../../data/teacherClasses'

function makeCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 4).toUpperCase()
}

export function useTeacherClassesPageLogic(navigate: NavigateFunction) {
  const [classes, setClasses] = useState(starterClasses)
  const [dialog, setDialog] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<ClassDetails | undefined>()
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [notice, setNotice] = useState('')

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }
  function openCreate() { setEditing(undefined); setDialog('create') }
  function openEdit(classItem: ClassDetails) { setEditing(classItem); setDialog('edit') }
  function saveClass(details: Omit<ClassDetails, 'id' | 'code'>) {
    if (dialog === 'edit' && editing) {
      setClasses((current) => current.map((item) => item.id === editing.id ? { ...item, ...details } : item))
      setNotice('Class details saved.')
    } else {
      const newClass = { ...details, id: `class-${Date.now()}`, code: makeCode() }
      setClasses((current) => [...current, newClass])
      setNotice('Class created. Share its code with students to invite them.')
    }
    setDialog(null)
  }
  function regenerateCode(id: string) {
    setClasses((current) => current.map((item) => item.id === id ? { ...item, code: makeCode() } : item))
    setNotice('A new join code is ready to share.')
  }
  function archiveClass(item: ClassDetails) {
    setClasses((current) => current.filter((classItem) => classItem.id !== item.id))
    setNotice(`${item.name} was archived.`)
  }
  function openClass(item: ClassDetails) { navigate(`/teacher/classes/${item.id}`, { state: item }) }

  return { classes, dialog, setDialog, editing, dark, notice, setNotice, toggleTheme, openCreate, openEdit, saveClass, regenerateCode, archiveClass, openClass }
}
