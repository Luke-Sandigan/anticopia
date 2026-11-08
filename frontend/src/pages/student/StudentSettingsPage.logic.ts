import { useState, type FormEvent } from 'react'

interface Profile { firstName: string; lastName: string; email: string }
const navigation = [
  { label: 'Dashboard', href: '/student/dashboard' },
  { label: 'My classes', href: '/student/classes' },
  { label: 'Exams', href: '/student/exams' },
  { label: 'My grades', href: '/student/grades' },
  { label: 'Exam history', href: '/student/exam-history' },
  { label: 'Settings', href: '/student/settings' },
]

export function useStudentSettingsPageLogic() {
  const [darkMode, setDarkMode] = useState(false)
  const [profile, setProfile] = useState<Profile>({ firstName: 'Maria', lastName: 'Santos', email: 'm.santos@school.edu' })
  const [notifications, setNotifications] = useState({ examUpdates: true, examReminders: true })
  const [passwords, setPasswords] = useState({ current: '', new: '' })
  const [message, setMessage] = useState('')
  const [deviceMessage, setDeviceMessage] = useState('')

  function updateProfile(field: keyof Profile, value: string) {
    setProfile((previous) => ({ ...previous, [field]: value }))
  }
  function updateNotification(field: keyof typeof notifications) {
    setNotifications((previous) => ({ ...previous, [field]: !previous[field] }))
  }
  function handleSaveProfile(event: FormEvent) {
    event.preventDefault()
    setMessage('Profile changes saved locally.')
  }
  function handlePasswordUpdate(event: FormEvent) {
    event.preventDefault()
    if (!passwords.current || !passwords.new) { setMessage('Please complete both password fields.'); return }
    if (passwords.new.length < 8) { setMessage('New password must contain at least 8 characters.'); return }
    setMessage('Password form validated. Connect your backend to update your password.')
    setPasswords({ current: '', new: '' })
  }
  function handleDeviceCheck() {
    const secure = window.isSecureContext
    const sharing = !!navigator.mediaDevices?.getDisplayMedia
    const camera = !!navigator.mediaDevices?.getUserMedia
    const fullscreen = !!document.documentElement.requestFullscreen
    setDeviceMessage(`Secure connection: ${secure ? 'Available' : 'Not available'} | ` + `Screen sharing API: ${sharing ? 'Supported' : 'Not supported'} | ` + `Camera API: ${camera ? 'Supported' : 'Not supported'} | ` + `Fullscreen API: ${fullscreen ? 'Supported' : 'Not supported'}`)
  }

  return { darkMode, setDarkMode, profile, notifications, passwords, setPasswords, message, setMessage, deviceMessage, navigation, updateProfile, updateNotification, handleSaveProfile, handlePasswordUpdate, handleDeviceCheck }
}
